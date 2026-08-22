import CustomProject from '../models/CustomProject.js';
import Settings from '../models/Settings.js';
import { sendTelegramMessage } from '../config/telegram.js';
import {
  sendCustomProjectAdminAlert,
  sendCustomProjectClientConfirmation,
} from '../config/mail.js';

const DEFAULT_SETTINGS = {
  isEnabled: true,
  entryFee: 50,
  upiId: '7303354598@omni',
  upiName: 'Khushal Jangid',
  notice: 'Custom development inquiries are currently active. Turnaround response within 2-4 hours.',
};

/**
 * Helper to fetch settings from MongoDB
 */
const getSettingsFromDb = async () => {
  try {
    let doc = await Settings.findOne({
      $or: [{ key: 'custom_projects_settings' }, { key: 'custom_project_settings' }],
    });
    if (doc && doc.value) {
      return {
        isEnabled: doc.value.isEnabled !== undefined ? Boolean(doc.value.isEnabled) : true,
        entryFee: doc.value.entryFee !== undefined ? Number(doc.value.entryFee) : 50,
        upiId: doc.value.upiId || '7303354598@omni',
        upiName: doc.value.upiName || 'Khushal Jangid',
        notice: doc.value.notice || '',
      };
    }
  } catch (err) {
    console.warn('[CustomProjectSettings] Notice:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
};

/**
 * @desc    Get custom project submission settings
 * @route   GET /api/custom-projects/settings
 * @access  Public
 */
export const getCustomProjectSettings = async (req, res) => {
  try {
    const settings = await getSettingsFromDb();
    return res.json({
      success: true,
      settings,
    });
  } catch (error) {
    return res.json({
      success: true,
      settings: DEFAULT_SETTINGS,
    });
  }
};

/**
 * @desc    Update custom project submission settings (Admin only)
 * @route   PUT /api/custom-projects/settings
 * @access  Private/Admin
 */
export const updateCustomProjectSettings = async (req, res) => {
  try {
    const { isEnabled, entryFee, upiId, upiName, notice } = req.body;
    const current = await getSettingsFromDb();

    const updatedValue = {
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : current.isEnabled,
      entryFee: entryFee !== undefined ? Math.max(0, Number(entryFee)) : current.entryFee,
      upiId: upiId ? upiId.trim() : current.upiId,
      upiName: upiName ? upiName.trim() : current.upiName,
      notice: notice !== undefined ? notice : current.notice,
    };

    let doc = await Settings.findOne({
      $or: [{ key: 'custom_projects_settings' }, { key: 'custom_project_settings' }],
    });

    if (doc) {
      doc.value = updatedValue;
      await doc.save();
    } else {
      await Settings.create({
        key: 'custom_projects_settings',
        value: updatedValue,
      });
    }

    return res.json({
      success: true,
      message: `Custom project submissions are now ${updatedValue.isEnabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'} with ₹${updatedValue.entryFee} entry fee.`,
      settings: updatedValue,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Submit a new custom project request + ₹50 UPI payment proof
 * @route   POST /api/custom-projects/submit
 * @access  Public
 */
export const submitCustomProject = async (req, res) => {
  try {
    const settings = await getSettingsFromDb();

    const {
      name,
      email,
      phone,
      title,
      category,
      techStack,
      targetBudget,
      deadline,
      referenceLinks,
      description,
      payoutUpiId,
      clientUpiId,
      utrNumber,
    } = req.body;

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();
    const cleanPayoutUpi = (payoutUpiId || clientUpiId || 'N/A').trim();
    const cleanUtr = (utrNumber || 'N/A').trim().toUpperCase();

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@') || !cleanPhone || !cleanTitle || !cleanDesc) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields: Name, Email, WhatsApp Phone, Project Title, and Scope Description.',
      });
    }

    const fee = settings.entryFee || 50;

    const projectData = {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      title: cleanTitle,
      category: category || 'Full-Stack Web App',
      techStack: techStack || 'Not Specified',
      targetBudget: Number(targetBudget) || 0,
      deadline: deadline || 'Flexible',
      referenceLinks: referenceLinks || '',
      description: cleanDesc,
      payoutUpiId: cleanPayoutUpi,
      clientUpiId: cleanPayoutUpi,
      entryFee: fee,
      utrNumber: cleanUtr,
      paymentStatus: 'pending_verification',
      status: 'pending',
    };

    // Save directly to MongoDB Atlas
    const savedProject = await CustomProject.create(projectData);
    console.log(`[Custom Project Submitted] ID: ${savedProject._id}, Title: ${cleanTitle}, Client: ${cleanName} (${cleanEmail})`);

    // 1. Dispatch Instant Telegram Alert to Admin
    const telegramText = `⚡ <b>NEW CUSTOM PROJECT SUBMISSION (₹${fee} PAID)</b> ⚡\n\n` +
      `👤 <b>Client/Creator:</b> ${projectData.name}\n` +
      `📧 <b>Email:</b> ${projectData.email}\n` +
      `📱 <b>WhatsApp / Phone:</b> ${projectData.phone}\n\n` +
      `💼 <b>Project Title:</b> ${projectData.title}\n` +
      `🏷️ <b>Category:</b> ${projectData.category}\n` +
      `🛠️ <b>Tech Stack:</b> ${projectData.techStack}\n` +
      `💰 <b>Proposed Budget:</b> ₹${projectData.targetBudget}\n` +
      `💸 <b>Client Payout UPI:</b> <code>${cleanPayoutUpi}</code>\n` +
      `${projectData.referenceLinks ? `📁 <b>Links:</b> ${projectData.referenceLinks}\n` : ''}\n` +
      `📝 <b>Requirements:</b>\n${projectData.description}\n\n` +
      `💳 <b>Entry Fee Paid:</b> ₹${fee}\n` +
      `🧾 <b>UPI UTR:</b> <code>${cleanUtr}</code>`;

    sendTelegramMessage(telegramText).catch((err) => {
      console.warn('Telegram notification notice:', err.message);
    });

    // 2. Dispatch Email Alerts
    sendCustomProjectAdminAlert(projectData).catch(() => {});
    sendCustomProjectClientConfirmation(projectData).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Your custom project requirements & ₹50 entry fee have been received! Our team will contact you on WhatsApp/Email shortly.',
      project: savedProject,
    });
  } catch (error) {
    console.error('Submit custom project error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit request' });
  }
};

/**
 * @desc    Get all custom project submissions (Admin only)
 * @route   GET /api/custom-projects
 * @access  Private/Admin
 */
export const getAllCustomProjects = async (req, res) => {
  try {
    const projects = await CustomProject.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error('Get all custom projects error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update status or payment status of a custom project request (Admin only)
 * @route   PATCH /api/custom-projects/:id/status
 * @access  Private/Admin
 */
export const updateCustomProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, adminNotes } = req.body;

    const project = await CustomProject.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (status) project.status = status;
    if (paymentStatus) project.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) project.adminNotes = adminNotes;

    await project.save();
    return res.json({ success: true, message: 'Status updated successfully', project });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete custom project request (Admin only)
 * @route   DELETE /api/custom-projects/:id
 * @access  Private/Admin
 */
export const deleteCustomProject = async (req, res) => {
  try {
    const { id } = req.params;
    await CustomProject.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Custom project request deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Request early access / notify when custom project submissions paused
 * @route   POST /api/custom-projects/request-access
 * @access  Public
 */
export const requestCustomProjectAccess = async (req, res) => {
  try {
    const { email, name, phone, idea } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const clientEmail = email.trim().toLowerCase();
    const clientName = (name || 'Prospective Client').trim();
    const clientPhone = (phone || 'Not Provided').trim();
    const projectIdea = (idea || 'Custom Development Inquiry').trim();

    const telegramText = `🔔 <b>CLIENT REQUESTED CUSTOM PROJECT PRIORITY ACCESS</b> 🔔\n\n` +
      `👤 <b>Client Name:</b> ${clientName}\n` +
      `📧 <b>Email:</b> ${clientEmail}\n` +
      `📱 <b>WhatsApp / Phone:</b> ${clientPhone}\n` +
      `💡 <b>Project Concept:</b>\n${projectIdea}`;

    sendTelegramMessage(telegramText).catch(() => {});

    return res.json({
      success: true,
      message: 'Your priority access request has been sent! We will contact you directly.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getCustomProjectSettings,
  updateCustomProjectSettings,
  submitCustomProject,
  getAllCustomProjects,
  updateCustomProjectStatus,
  deleteCustomProject,
  requestCustomProjectAccess,
};
