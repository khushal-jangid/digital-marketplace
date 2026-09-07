import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Order from '../models/Order.js';
import Subscriber from '../models/Subscriber.js';
import User from '../models/User.js';
import DownloadLog from '../models/DownloadLog.js';
import {
  saveFileToStorage,
  getSecureFilePath,
  generateSignedDownloadUrl,
  getDeviceFingerprint,
  normalizeIpAddress,
} from '../config/storage.js';
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
 * @desc    Get secure download link for purchased project with device/IP binding
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

    const clientIp = normalizeIpAddress(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    const userAgent = req.headers['user-agent'] || '';
    const hostUrl = `${req.protocol}://${req.get('host')}`;

    // Find or initialize DownloadLog record
    let downloadLog = await DownloadLog.findOne({
      user: userId,
      project: projectId,
      order: paidOrder._id,
    });

    if (!downloadLog) {
      downloadLog = await DownloadLog.create({
        user: userId,
        project: projectId,
        order: paidOrder._id,
        downloadCount: 0,
        maxDownloadsAllowed: 5,
        clientIp,
        deviceHash: getDeviceFingerprint(userAgent),
      });
    }

    // STRICT 5-DOWNLOADS CAP CHECK
    if (downloadLog.downloadCount >= downloadLog.maxDownloadsAllowed) {
      return res.status(403).json({
        success: false,
        code: 'DOWNLOAD_LIMIT_EXCEEDED',
        message: `Download limit reached (${downloadLog.downloadCount}/${downloadLog.maxDownloadsAllowed}). You have used all 5 allowed downloads for this purchase.`,
        downloadCount: downloadLog.downloadCount,
        maxDownloadsAllowed: downloadLog.maxDownloadsAllowed,
        remainingDownloads: 0,
      });
    }

    // Generate single-use signed download token bound to IP and Device
    const downloadUrl = generateSignedDownloadUrl(
      project.fileKey || '',
      project.fileName || `${project.title}.zip`,
      userId.toString(),
      projectId.toString(),
      paidOrder._id.toString(),
      clientIp,
      userAgent,
      hostUrl
    );

    return res.json({
      success: true,
      downloadUrl,
      fileName: project.fileName || `${project.title}.zip`,
      downloadCount: downloadLog.downloadCount,
      maxDownloadsAllowed: downloadLog.maxDownloadsAllowed,
      remainingDownloads: Math.max(0, downloadLog.maxDownloadsAllowed - downloadLog.downloadCount),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper to render clean HTML security warning page if browser navigates directly
 */
const renderSecurityError = (res, title, message, code = 403) => {
  return res.status(code).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - ApexMarket Security</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #111827; border: 1px solid #374151; border-radius: 16px; padding: 36px 28px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6); }
        .icon { font-size: 44px; margin-bottom: 12px; }
        .badge { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; margin-bottom: 16px; }
        h1 { font-size: 20px; color: #ffffff; margin: 0 0 10px 0; font-weight: 700; }
        p { font-size: 13.5px; color: #9ca3af; line-height: 1.6; margin: 0 0 24px 0; }
        .btn { display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 13px; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">🛡️</div>
        <div class="badge">Security Protection Active</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="https://apexmarketstore.vercel.app/dashboard" class="btn">Return to My Dashboard</a>
      </div>
    </body>
    </html>
  `);
};

/**
 * @desc    Download project securely with one-time token, IP lock, device lock, and 5-download limit
 * @route   GET /api/projects/download-secure
 * @access  Public (Token verified)
 */
export const downloadProjectSecure = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return renderSecurityError(res, 'Download Token Missing', 'No valid download token was provided in the request.', 400);
    }

    let decoded = null;
    try {
      decoded = verifyJwt(token);
    } catch (jwtErr) {
      return renderSecurityError(
        res,
        'Link Expired or Invalid',
        'This download link has expired (15-minute window) or is invalid. Please visit your account dashboard to generate a fresh download link.',
        403
      );
    }

    if (!decoded || !decoded.userId || !decoded.projectId) {
      return renderSecurityError(res, 'Invalid Token Payload', 'The download signature token is malformed or unauthorized.', 400);
    }

    // 1. Fetch or create DownloadLog record
    let downloadLog = await DownloadLog.findOne({
      user: decoded.userId,
      project: decoded.projectId,
      ...(decoded.orderId ? { order: decoded.orderId } : {}),
    });

    if (!downloadLog && decoded.orderId) {
      downloadLog = await DownloadLog.create({
        user: decoded.userId,
        project: decoded.projectId,
        order: decoded.orderId,
        downloadCount: 0,
        maxDownloadsAllowed: 5,
      });
    }

    // RULE 3: STRICT 5-DOWNLOADS COUNTER ENFORCEMENT
    if (downloadLog && downloadLog.downloadCount >= downloadLog.maxDownloadsAllowed) {
      return renderSecurityError(
        res,
        'Download Limit Exceeded (5/5)',
        `You have already completed the maximum allowed downloads (${downloadLog.maxDownloadsAllowed} times) for this project purchase. Please contact support if you require assistance.`
      );
    }

    // RULE 1: ONE-TIME SELF-DESTRUCT TOKEN ENFORCEMENT
    if (decoded.jti && downloadLog) {
      const isAlreadyUsed = downloadLog.usedTokens?.some((t) => t.tokenHash === decoded.jti);
      if (isAlreadyUsed) {
        return renderSecurityError(
          res,
          'Link Already Used',
          'This download link was already used and has self-destructed for security. Each link is single-use only. Please generate a fresh link from your dashboard if you have downloads remaining.'
        );
      }
    }

    // RULE 2: IP & DEVICE LOCK ENFORCEMENT
    const currentIp = normalizeIpAddress(req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    const currentUa = req.headers['user-agent'] || '';
    const currentDeviceHash = getDeviceFingerprint(currentUa);

    // IP check (allowing localhost variations)
    if (decoded.clientIp && currentIp) {
      const isLocal = ['127.0.0.1', '::1', 'localhost'].includes(decoded.clientIp) &&
                      ['127.0.0.1', '::1', 'localhost'].includes(currentIp);
      if (!isLocal && decoded.clientIp !== currentIp) {
        return renderSecurityError(
          res,
          'IP Address Mismatch',
          `Security Alert: This download link is locked to the original purchaser network (IP: ${decoded.clientIp}). It cannot be opened or shared across different IP networks.`
        );
      }
    }

    // Device fingerprint check
    if (decoded.deviceHash && currentDeviceHash) {
      if (decoded.deviceHash !== currentDeviceHash) {
        return renderSecurityError(
          res,
          'Unauthorized Device Detected',
          'Security Alert: This download link is locked to the browser and device that requested it. Sharing links between different devices is blocked.'
        );
      }
    }

    // IF ALL CHECKS PASS: RECORD DOWNLOAD AND MARK TOKEN USED
    if (downloadLog) {
      downloadLog.downloadCount = (downloadLog.downloadCount || 0) + 1;
      downloadLog.lastDownloadedAt = new Date();

      if (decoded.jti) {
        if (!downloadLog.usedTokens) downloadLog.usedTokens = [];
        downloadLog.usedTokens.push({
          tokenHash: decoded.jti,
          usedAt: new Date(),
          ip: currentIp,
          userAgent: currentUa.substring(0, 200),
        });
      }

      if (currentIp && !downloadLog.ipAddresses.includes(currentIp)) {
        downloadLog.ipAddresses.push(currentIp);
      }

      if (currentDeviceHash && !downloadLog.deviceHashes?.includes(currentDeviceHash)) {
        if (!downloadLog.deviceHashes) downloadLog.deviceHashes = [];
        downloadLog.deviceHashes.push(currentDeviceHash);
      }

      await downloadLog.save();
    }

    // Serve file securely
    if (decoded.fileKey) {
      const filePath = getSecureFilePath(decoded.fileKey);
      const fs = (await import('fs')).default;
      if (fs.existsSync(filePath)) {
        return res.download(filePath, decoded.fileName || 'download.zip');
      }
    }

    // Fallback: If external URL is configured
    if (decoded.projectId) {
      const project = await Project.findById(decoded.projectId);
      if (project && (project.externalDownloadUrl || project.fileUrl)) {
        return res.redirect(302, project.externalDownloadUrl || project.fileUrl);
      }
    }

    return renderSecurityError(res, 'File Not Found', 'The requested file could not be located in secure storage.', 404);
  } catch (error) {
    console.error('Secure download execution error:', error);
    return renderSecurityError(res, 'Server Error', 'An unexpected error occurred during file download. Please try again.', 500);
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
