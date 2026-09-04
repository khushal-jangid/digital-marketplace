import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Order from '../models/Order.js';
import Subscriber from '../models/Subscriber.js';
import User from '../models/User.js';
import { saveFileToStorage, getSecureFilePath } from '../config/storage.js';
import { sendNewProjectEmail } from '../config/mail.js';
import { verifyJwt, signJwt } from '../config/jwt.js';

/**
 * @desc    Fetch all active projects with search, filter, and pagination
 * @route   GET /api/projects
 * @access  Public
 */
export const getProjects = async (req, res) => {
  try {
    const { search, category, sort, minPrice, maxPrice } = req.query;
    const query = {};

    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitized, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { techStack: regex },
      ];
    }

    if (category && category !== 'all' && typeof category === 'string') {
      query.category = category.trim();
    }

    if ((minPrice && !isNaN(minPrice)) || (maxPrice && !isNaN(maxPrice))) {
      query.price = {};
      if (minPrice && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
      if (maxPrice && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
    }

    let apiQuery = Project.find(query);

    if (sort === 'price-low') {
      apiQuery = apiQuery.sort({ price: 1 });
    } else if (sort === 'price-high') {
      apiQuery = apiQuery.sort({ price: -1 });
    } else if (sort === 'rating') {
      apiQuery = apiQuery.sort({ 'ratings.average': -1 });
    } else if (sort === 'popular') {
      apiQuery = apiQuery.sort({ downloadCount: -1 });
    } else {
      apiQuery = apiQuery.sort({ createdAt: -1 });
    }

    const projects = await apiQuery.populate('createdBy', 'name email');
    return res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Get single project details
 * @route   GET /api/projects/:id
 * @access  Public
 */
export const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, code: 'INVALID_PROJECT_ID', message: 'Invalid project ID format' });
    }

    const project = await Project.findById(projectId).populate('createdBy', 'name email');
    if (!project) {
      return res.status(404).json({ success: false, code: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    }

    return res.json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Create a project (Admin only)
 * @route   POST /api/projects
 * @access  Private/Admin
 */
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      techStack,
      previewUrls,
      externalDownloadUrl,
      fileUrl,
      upiId,
    } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please provide project title, description, and price.',
      });
    }

    const downloadLink = (externalDownloadUrl || fileUrl || '').trim();

    let fileData = { fileKey: '', fileName: 'external-link', fileSize: '0 MB' };
    if (req.file) {
      fileData = await saveFileToStorage(req.file);
    }

    // Parse tech stack
    let processedTechStack = [];
    if (techStack) {
      processedTechStack = typeof techStack === 'string'
        ? techStack.split(',').map((s) => s.trim()).filter(Boolean)
        : Array.isArray(techStack) ? techStack : [];
    }

    // Parse preview URLs
    let processedPreviewUrls = [];
    if (previewUrls) {
      if (typeof previewUrls === 'string') {
        processedPreviewUrls = previewUrls.split('\n').map((u) => u.trim()).filter(Boolean);
      } else if (Array.isArray(previewUrls)) {
        processedPreviewUrls = previewUrls;
      }
    }

    // Find creator ID safely
    let creatorId = req.user?._id;
    if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
      const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
      creatorId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      category: category || 'source-code',
      techStack: processedTechStack,
      previewUrls: processedPreviewUrls,
      fileKey: fileData.fileKey,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      externalDownloadUrl: downloadLink,
      fileUrl: downloadLink,
      upiId: (upiId || '7303354598@omni').trim(),
      createdBy: creatorId,
      isActive: true,
      ratings: { average: 5, count: 1 },
      downloadCount: 0,
      versions: [
        {
          version: 'v1.0.0',
          fileKey: fileData.fileKey,
          fileName: fileData.fileName,
          releaseNotes: 'Initial release',
        },
      ],
    });

    Subscriber.find({})
      .then((subs) => {
        if (subs && subs.length > 0) {
          sendNewProjectEmail(subs, project).catch(() => {});
        }
      })
      .catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Project uploaded and published to catalog successfully!',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Update project (Admin only)
 * @route   PUT /api/projects/:id
 * @access  Private/Admin
 */
export const updateProject = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      techStack,
      previewUrls,
      externalDownloadUrl,
      fileUrl,
      upiId,
      isActive,
    } = req.body;

    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, code: 'INVALID_PROJECT_ID', message: 'Invalid project ID format' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, code: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    }

    if (title) project.title = title.trim();
    if (description) project.description = description.trim();
    if (price !== undefined && !isNaN(price)) project.price = Number(price);
    if (originalPrice !== undefined && !isNaN(originalPrice)) project.originalPrice = Number(originalPrice);
    if (category) project.category = category;
    if (upiId) project.upiId = upiId.trim();
    if (isActive !== undefined) project.isActive = Boolean(isActive);

    const downloadLink = (externalDownloadUrl || fileUrl);
    if (downloadLink !== undefined) {
      project.externalDownloadUrl = downloadLink.trim();
      project.fileUrl = downloadLink.trim();
    }

    if (techStack !== undefined) {
      project.techStack = typeof techStack === 'string'
        ? techStack.split(',').map((s) => s.trim()).filter(Boolean)
        : Array.isArray(techStack) ? techStack : project.techStack;
    }

    if (previewUrls !== undefined) {
      if (typeof previewUrls === 'string') {
        project.previewUrls = previewUrls.split('\n').map((u) => u.trim()).filter(Boolean);
      } else if (Array.isArray(previewUrls)) {
        project.previewUrls = previewUrls;
      }
    }

    if (req.file) {
      const fileData = await saveFileToStorage(req.file);
      project.fileKey = fileData.fileKey;
      project.fileName = fileData.fileName;
      project.fileSize = fileData.fileSize;

      const nextVerNum = (project.versions?.length || 0) + 1;
      project.versions.push({
        version: `v1.${nextVerNum}.0`,
        fileKey: fileData.fileKey,
        fileName: fileData.fileName,
        releaseNotes: 'File updated via management panel',
      });
    }

    const updatedProject = await project.save();
    return res.json({
      success: true,
      message: 'Project updated successfully in database!',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Delete project (Admin only)
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, code: 'INVALID_PROJECT_ID', message: 'Invalid project ID format' });
    }

    const deleted = await Project.findByIdAndDelete(projectId);
    if (!deleted) {
      return res.status(404).json({ success: false, code: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    }

    return res.json({ success: true, message: 'Project permanently deleted from database.' });
  } catch (error) {
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

/**
 * @desc    Add a new project version
 * @route   POST /api/projects/:id/versions
 * @access  Private/Admin
 */
export const addProjectVersion = async (req, res) => {
  try {
    const { version, releaseNotes } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let fileData = { fileKey: project.fileKey || '', fileName: project.fileName || 'download.zip' };
    if (req.file) {
      fileData = await saveFileToStorage(req.file);
      project.fileKey = fileData.fileKey;
      project.fileName = fileData.fileName;
      project.fileSize = fileData.fileSize;
    }

    project.versions.push({
      version: version || `v1.${project.versions.length + 1}.0`,
      fileKey: fileData.fileKey,
      fileName: fileData.fileName,
      releaseNotes: releaseNotes || 'Updated release',
    });

    await project.save();
    return res.status(201).json({ success: true, message: 'New version added', project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get secure download link for purchased project
 * @route   GET /api/projects/:id/download-link
 * @access  Private
 */
export const getDownloadLink = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    const paidOrder = await Order.findOne({
      user: userId,
      paymentStatus: { $in: ['paid', 'fulfilled', 'completed'] },
      'items.project': projectId,
    });

    if (!paidOrder) {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'You have not purchased this project or payment is pending approval.',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const directUrl = project.fileUrl || project.externalDownloadUrl;
    return res.json({
      success: true,
      downloadUrl: directUrl || 'https://drive.google.com',
      fileName: project.fileName || `${project.title}.zip`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Download project securely
 * @route   GET /api/projects/download-secure
 * @access  Public (Token verified)
 */
export const downloadProjectSecure = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.redirect('https://apexmarketstore.vercel.app/dashboard');
    }

    let decoded = null;
    try {
      decoded = verifyJwt(token);
    } catch (_) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        decoded = jwt.decode(token);
      } catch (_) {}
    }

    if (decoded && decoded.projectId) {
      const project = await Project.findById(decoded.projectId);
      if (project && (project.externalDownloadUrl || project.fileUrl)) {
        return res.redirect(302, project.externalDownloadUrl || project.fileUrl);
      }
    }

    if (decoded && decoded.fileKey) {
      try {
        const filePath = getSecureFilePath(decoded.fileKey);
        const fs = (await import('fs')).default;
        if (fs.existsSync(filePath)) {
          return res.download(filePath, decoded.fileName || 'download.zip');
        }
      } catch (_) {}
    }

    return res.redirect('https://apexmarketstore.vercel.app/dashboard');
  } catch (error) {
    return res.redirect('https://apexmarketstore.vercel.app/dashboard');
  }
};

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectVersion,
  getDownloadLink,
  downloadProjectSecure,
};
