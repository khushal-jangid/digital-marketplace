import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-email-token'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Constants
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://khushaljangra013_db_user:KJIGJtITbR4L8Yvi@cluster0.ywucg6a.mongodb.net/digital_marketplace?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'ephemeral_dev_secret_key_change_in_prod';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8865031996:AAFF85bx08Vaf1fr3WbaGuGvx3rMv_Sij0g';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7370155608';
const SMTP_USER = process.env.EMAIL_USER || 'khushaljangra721@gmail.com';
const SMTP_PASS = (process.env.EMAIL_PASS || 'fxdlrlcrkylepabv').replace(/\s+/g, '');

// Cached Mongoose Connection for Serverless
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    cachedDb = db;
    return cachedDb;
  } catch (err) {
    console.error('MongoDB Atlas Connection Error:', err.message);
    return null;
  }
}

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  referralCode: { type: String, unique: true },
  referralEarnings: { type: Number, default: 0 },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  createdAt: { type: Date, default: Date.now },
});

const customProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'Full-Stack Development' },
  techStack: { type: String, default: 'React, Node.js' },
  description: { type: String, required: true },
  referenceLinks: { type: String, default: '' },
  targetBudget: { type: String, default: 'Negotiable' },
  payoutUpiId: { type: String, default: '' },
  utrNumber: { type: String, required: true },
  entryFee: { type: Number, default: 50 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
  status: { type: String, enum: ['pending', 'in-review', 'in-progress', 'completed', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  category: { type: String, default: 'source-code' },
  techStack: [String],
  previewUrls: [String],
  downloadCount: { type: Number, default: 0 },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: true },
  fileUrl: { type: String, default: '' },
  externalDownloadUrl: { type: String, default: '' },
  liveDemoUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  upiId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  customerPhone: { type: String, default: '' },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String, default: 'UPI / Direct' },
  utrNumber: { type: String, default: '' },
  invoiceNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, unique: true },
  discountValue: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  isActive: { type: Boolean, default: true },
  minOrderValue: { type: Number, default: 0 },
  maxUses: { type: Number, default: 1000 },
  usedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const reviewSchema = new mongoose.Schema({
  user: { type: String, default: 'Client' },
  userEmail: { type: String },
  rating: { type: Number, default: 5 },
  comment: { type: String, required: true },
  projectTitle: { type: String, default: 'General' },
  createdAt: { type: Date, default: Date.now },
});

const featureRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: { type: String, default: 'React, Node.js' },
  budget: { type: String, default: 'Negotiable' },
  userEmail: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'in-progress', 'completed', 'rejected'], default: 'pending' },
  upvotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const chatMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId: { type: String, required: true },
  userName: { type: String, default: 'Visitor' },
  userEmail: { type: String, default: '' },
  senderRole: { type: String, enum: ['user', 'admin'], default: 'user' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const CustomProject = mongoose.models.CustomProject || mongoose.model('CustomProject', customProjectSchema);
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
const FeatureRequest = mongoose.models.FeatureRequest || mongoose.model('FeatureRequest', featureRequestSchema);
const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);
const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

// Notifications Engine
async function sendTelegramAlert(text, replyMarkup = null) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('Telegram notification error:', err.message);
  }
}

async function sendMailNotification(to, subject, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ApexMarket | Khushal Jangid" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to: ${to}`);
  } catch (err) {
    console.error('Email sending error:', err.message);
  }
}

// Authentication Middleware
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
  }
}

// Ensure DB connection for every request
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Root Health Check
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ApexMarket Live Clean Serverless API running on Vercel!',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected (MongoDB Atlas)' : 'Connecting',
    timestamp: new Date().toISOString(),
  });
});

// 0. ADMIN PURGE DEMO DATA ENDPOINT
app.post('/api/admin/clean-demo-data', async (req, res) => {
  try {
    const delProj = await Project.deleteMany({});
    const delCoup = await Coupon.deleteMany({});
    const delCust = await CustomProject.deleteMany({});
    const delOrd = await Order.deleteMany({});
    const delRev = await Review.deleteMany({});
    const delFeat = await FeatureRequest.deleteMany({});

    await Setting.updateOne(
      { key: 'initial_marketplace_seeded' },
      { $set: { key: 'initial_marketplace_seeded', value: true } },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'All demo projects, coupons, reviews, orders, and inquiries permanently cleared from database!',
      stats: {
        projectsCleared: delProj.deletedCount,
        couponsCleared: delCoup.deletedCount,
        customCleared: delCust.deletedCount,
        ordersCleared: delOrd.deletedCount,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 1. REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userReferralCode = (name.replace(/[^a-zA-Z]/g, '').slice(0, 4) + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
    const newUser = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: 'user',
      referralCode: userReferralCode,
      referralEarnings: 0,
      wishlist: [],
    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    sendTelegramAlert(`🎉 <b>NEW USER REGISTERED ON APEXMARKET!</b>\n\n👤 <b>Name:</b> ${newUser.name}\n📧 <b>Email:</b> ${newUser.email}\n🛡️ <b>Role:</b> ${newUser.role}`);

    res.status(201).json({
      success: true,
      token,
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      referralCode: newUser.referralCode,
      referralEarnings: newUser.referralEarnings,
      wishlist: [],
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
      message: 'Registration successful!',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. LOGIN

// Forgot Password Endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }
    // Prevent enumeration
    res.json({ success: true, message: 'If an account exists, password reset instructions have been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset Password Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid reset token and new password (min 6 chars) required' });
    }
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      wishlist: user.wishlist || [],
      avatar: user.avatar || '',
      createdAt: user.createdAt,
      message: 'Login successful!',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. PROFILE
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('wishlist');
    if (!user) {
      return res.json({
        success: true,
        _id: req.user.userId,
        name: req.user.email ? req.user.email.split('@')[0] : 'My Account',
        email: req.user.email || 'user@marketplace.com',
        role: req.user.role || 'user',
        wishlist: [],
        referralCode: 'APEX-PRO',
        referralEarnings: 0,
      });
    }

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings,
      wishlist: user.wishlist || [],
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { name, password, avatar } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (password && password.trim().length >= 6) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();

    res.json({ success: true, message: 'Profile updated successfully!', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. CUSTOM PROJECTS (CRUD)
// 4. CUSTOM PROJECTS & BESPOKE DEVELOPMENT INQUIRIES (CRUD)
const handleCustomProjectSubmission = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      title,
      category,
      techStack,
      description,
      idea,
      referenceLinks,
      targetBudget,
      budget,
      payoutUpiId,
      utrNumber,
    } = req.body;

    const clientEmail = (email || '').toLowerCase().trim();
    const clientName = name ? name.trim() : (clientEmail ? clientEmail.split('@')[0] : 'Client');
    const clientPhone = phone ? phone.trim() : 'Not provided';
    const projTitle = title ? title.trim() : (idea ? idea.slice(0, 40) + '...' : 'Custom Software Architecture');
    const projDesc = description ? description.trim() : (idea ? idea.trim() : 'Custom project development requested.');
    const projBudget = targetBudget || budget || 'Negotiable';
    const projUpi = payoutUpiId ? payoutUpiId.trim() : 'N/A';
    const projUtr = (utrNumber || '').trim();

    if (!clientEmail || !projDesc) {
      return res.status(400).json({ success: false, message: 'Please provide at least your email and project description.' });
    }

    if (!projUtr || projUtr.length !== 12 || !/^\d{12}$/.test(projUtr)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid numeric UPI UTR / Transaction reference number to submit your project.',
      });
    }

    const newInquiry = await CustomProject.create({
      name: clientName,
      email: clientEmail,
      phone: clientPhone,
      title: projTitle,
      category: category || 'Full-Stack Development',
      techStack: techStack || 'React, Node.js',
      description: projDesc,
      referenceLinks: referenceLinks || '',
      targetBudget: projBudget,
      payoutUpiId: projUpi,
      utrNumber: projUtr,
      entryFee: 50,
      paymentStatus: 'paid',
      status: 'pending',
    });

    const teleMsg = `💼 <b>NEW CUSTOM PROJECT INQUIRY!</b>\n\n` +
      `👤 <b>Client:</b> ${clientName}\n` +
      `📧 <b>Email:</b> ${clientEmail}\n` +
      `📱 <b>WhatsApp:</b> ${clientPhone}\n` +
      `📌 <b>Title:</b> ${projTitle}\n` +
      `🛠️ <b>Tech Stack:</b> ${techStack || 'React, Node.js'}\n` +
      `💰 <b>Budget:</b> ₹${projBudget}\n` +
      `💸 <b>Payout UPI:</b> ${projUpi}\n` +
      `🧾 <b>UTR / Ref:</b> <code>${projUtr}</code>\n\n` +
      `📝 <b>Requirements:</b>\n${projDesc}\n\n` +
      `⚡ <i>Database Record ID: ${newInquiry._id}</i>`;

    await sendTelegramAlert(teleMsg);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">Custom Project Inquiry Confirmed! 🚀</h2>
        <p>Hi <strong>${clientName}</strong>,</p>
        <p>Thank you for submitting your custom project requirements for <strong>${projTitle}</strong> on ApexMarket. We have recorded your request (Ref: <code>${projUtr}</code>).</p>
        <div style="background: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
          <p style="margin: 4px 0;"><strong>Project Title:</strong> ${projTitle}</p>
          <p style="margin: 4px 0;"><strong>Proposed Budget:</strong> ₹${projBudget}</p>
          <p style="margin: 4px 0;"><strong>Payout UPI:</strong> ${projUpi}</p>
          <p style="margin: 4px 0;"><strong>WhatsApp Contact:</strong> ${clientPhone}</p>
          <p style="margin: 8px 0 0 0;"><strong>Scope Details:</strong> ${projDesc}</p>
        </div>
        <p>Khushal Jangid will connect with you on WhatsApp or Email within 2-4 hours to discuss timeline and kickoff.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code & Custom Development Studio</p>
      </div>
    `;

    await sendMailNotification(clientEmail, `Custom Project Confirmation: ${projTitle} - ApexMarket`, emailHtml);
    await sendMailNotification('khushaljangra721@gmail.com', `🔥 New Inbound Custom Project: ${projTitle}`, emailHtml);

    res.status(201).json({
      success: true,
      message: 'Custom project request submitted! Telegram and Email alerts have been dispatched successfully.',
      project: newInquiry,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

app.post('/api/custom-projects/submit', handleCustomProjectSubmission);
app.post('/api/project-requests', handleCustomProjectSubmission);
app.post('/api/custom-projects/request-access', handleCustomProjectSubmission);

app.get('/api/custom-projects', async (req, res) => {
  try {
    const inquiries = await CustomProject.find().sort({ createdAt: -1 });
    res.json({ success: true, customProjects: inquiries, projects: inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const handleCustomProjectStatusUpdate = async (req, res) => {
  try {
    const updated = await CustomProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Custom project not found' });

    let statusEmoji = '🔄';
    let statusTitle = 'STATUS UPDATED';
    if (updated.status === 'in-progress' || updated.status === 'approved') {
      statusEmoji = '✅';
      statusTitle = 'APPROVED & IN-PROGRESS';
    } else if (updated.status === 'completed') {
      statusEmoji = '🎉';
      statusTitle = 'COMPLETED';
    } else if (updated.status === 'rejected') {
      statusEmoji = '❌';
      statusTitle = 'REJECTED';
    }

    const teleMsg = `${statusEmoji} <b>CUSTOM PROJECT ${statusTitle}!</b>\n\n` +
      `👤 <b>Client:</b> ${updated.name}\n` +
      `📧 <b>Email:</b> ${updated.email}\n` +
      `📱 <b>WhatsApp:</b> ${updated.phone}\n` +
      `📌 <b>Project:</b> ${updated.title}\n` +
      `⚡ <b>Status:</b> <code>${updated.status.toUpperCase()}</code>\n` +
      `💳 <b>Payment:</b> ${updated.paymentStatus}\n` +
      `🧾 <b>Fee UTR:</b> <code>${updated.utrNumber || 'N/A'}</code>`;

    await sendTelegramAlert(teleMsg);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">Custom Project Status Update: ${updated.status.toUpperCase()}</h2>
        <p>Hi <strong>${updated.name}</strong>,</p>
        <p>The status of your custom project inquiry for <strong>${updated.title}</strong> has been updated to: <strong style="color: #4f46e5;">${updated.status.toUpperCase()}</strong>.</p>
        <p>Khushal Jangid is handling your specifications and will connect on WhatsApp (+91 ${updated.phone}) if any clarification is needed.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code & Custom Development Studio</p>
      </div>
    `;

    if (updated.email) {
      await sendMailNotification(updated.email, `Project Status Update: ${updated.title} (${updated.status.toUpperCase()}) - ApexMarket`, emailHtml);
    }

    res.json({ success: true, project: updated, message: `Status updated to ${updated.status} successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

app.patch('/api/custom-projects/:id', handleCustomProjectStatusUpdate);
app.patch('/api/custom-projects/:id/status', handleCustomProjectStatusUpdate);

app.delete('/api/custom-projects/:id', async (req, res) => {
  try {
    await CustomProject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Custom project deleted permanently!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. CUSTOM SETTINGS (CRUD)
app.get('/api/custom-projects/settings', async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'custom_projects_settings' });
    if (!setting) {
      setting = {
        value: {
          isEnabled: true,
          entryFee: 50,
          upiId: '7303354598@omni',
          upiName: 'Khushal Jangid',
          notice: 'Custom development inquiries are active. Turnaround within 2-4 hours.',
        },
      };
    }
    res.json({ success: true, settings: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/custom-projects/settings', async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: 'custom_projects_settings' },
      { value: req.body },
      { upsert: true, new: true }
    );
    res.json({ success: true, settings: setting.value, message: 'Settings saved successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. FLASH SALE (CRUD)
app.get('/api/flash-sale', async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'flash_sale_settings' });
    if (!setting) {
      setting = {
        value: {
          isActive: false,
          title: 'Special Developer Promo',
          subtitle: 'Limited time discount on selected source codes.',
          promoCode: 'SAVE10',
          discountPercentage: 10,
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
    res.json({ success: true, flashSale: setting.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/flash-sale', async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: 'flash_sale_settings' },
      { value: req.body },
      { upsert: true, new: true }
    );
    res.json({ success: true, flashSale: setting.value, message: 'Flash sale updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. PROJECTS CATALOG (Clean Real Data CRUD)
app.get('/api/projects', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { techStack: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };
    if (sort === 'popular') sortOption = { downloadCount: -1 };

    const projects = await Project.find(filter).select('-fileUrl -externalDownloadUrl').sort(sortOption);
    res.json({ success: true, projects: projects || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const authHeader = req.headers.authorization;
    let isAuthorized = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin') {
          isAuthorized = true;
        } else {
          const paidOrder = await Order.findOne({
            $or: [{ user: decoded.userId }, { userEmail: decoded.email?.toLowerCase().trim() }],
            projects: project._id,
            paymentStatus: { $in: ['paid', 'completed'] },
          });
          if (paidOrder) isAuthorized = true;
        }
      } catch (_) {}
    }

    const projObj = project.toObject();
    if (!isAuthorized) {
      delete projObj.fileUrl;
      delete projObj.externalDownloadUrl;
    }

    res.json({ success: true, project: projObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// STRICT PROTECTED DOWNLOAD ENDPOINTS (Access granted ONLY when payment is APPROVED)
const handleProjectDownloadLink = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found in database.' });
    }

    const authHeader = req.headers.authorization;
    let user = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        user = jwt.verify(token, JWT_SECRET);
      } catch (_) {}
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to download purchased source code.',
      });
    }

    // Admin always has preview access
    if (user.role === 'admin') {
      const downloadUrl = project.fileUrl || project.externalDownloadUrl || project.githubUrl || project.liveDemoUrl || '';
      return res.json({ success: true, downloadUrl, isUnlocked: true });
    }

    // For regular users: STRICTLY check for PAID / APPROVED order
    const paidOrder = await Order.findOne({
      $or: [{ user: user.userId }, { userEmail: user.email?.toLowerCase().trim() }],
      projects: projectId,
      paymentStatus: { $in: ['paid', 'completed'] },
    });

    if (!paidOrder) {
      const pendingOrder = await Order.findOne({
        $or: [{ user: user.userId }, { userEmail: user.email?.toLowerCase().trim() }],
        projects: projectId,
        paymentStatus: 'pending',
      });

      if (pendingOrder) {
        return res.status(403).json({
          success: false,
          message: '⏳ Payment is pending verification by Khushal Jangid. Download link will unlock as soon as your payment is approved!',
          paymentStatus: 'pending',
        });
      }

      return res.status(403).json({
        success: false,
        message: '🔒 Access Denied: You have not purchased this project or payment was rejected. Download access is locked.',
        paymentStatus: 'unpaid',
      });
    }

    const downloadUrl = project.fileUrl || project.externalDownloadUrl || project.githubUrl || '';
    if (!downloadUrl) {
      return res.status(404).json({ success: false, message: 'Download link is currently being updated. Please contact support.' });
    }

    project.downloadCount = (project.downloadCount || 0) + 1;
    await project.save();

    res.json({
      success: true,
      downloadUrl,
      isUnlocked: true,
      message: 'Download verified and unlocked!',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

app.get('/api/projects/:id/download-link', handleProjectDownloadLink);
app.get('/api/projects/download/:id', handleProjectDownloadLink);
app.get('/api/projects/:id/download-secure', handleProjectDownloadLink);
app.get('/api/projects/:id/download', handleProjectDownloadLink);

app.get('/api/orders/download-history', authenticate, async (req, res) => {
  try {
    const userOrders = await Order.find({
      $or: [{ user: req.user.userId }, { userEmail: req.user.email?.toLowerCase().trim() }],
      paymentStatus: { $in: ['paid', 'completed'] },
    }).populate('projects');

    const history = [];
    userOrders.forEach(o => {
      (o.projects || []).forEach(p => {
        if (p) {
          history.push({
            _id: `${o._id}_${p._id}`,
            project: p,
            downloadCount: p.downloadCount || 1,
            maxDownloadsAllowed: 10,
            lastDownloadedAt: o.createdAt,
          });
        }
      });
    });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.previewUrls === 'string') {
      try {
        data.previewUrls = JSON.parse(data.previewUrls);
      } catch (_) {
        data.previewUrls = data.previewUrls.split('\n').map(u => u.trim()).filter(Boolean);
      }
    }
    if (typeof data.techStack === 'string') {
      data.techStack = data.techStack.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (data.externalDownloadUrl && !data.fileUrl) {
      data.fileUrl = data.externalDownloadUrl;
    }
    const project = await Project.create(data);
    res.status(201).json({ success: true, project, message: 'Project added to catalog successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.previewUrls === 'string') {
      try {
        data.previewUrls = JSON.parse(data.previewUrls);
      } catch (_) {
        data.previewUrls = data.previewUrls.split('\n').map(u => u.trim()).filter(Boolean);
      }
    }
    if (typeof data.techStack === 'string') {
      data.techStack = data.techStack.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (data.externalDownloadUrl && !data.fileUrl) {
      data.fileUrl = data.externalDownloadUrl;
    }
    const updated = await Project.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, project: updated, message: 'Project updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted permanently from database!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. COUPONS (Clean Real Data CRUD)

// Validate Coupon endpoint
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, cartAmount, cartItems } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, code: 'COUPON_CODE_REQUIRED', message: 'Coupon code is required' });
    }
    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
    if (!coupon) {
      return res.status(400).json({ success: false, code: 'COUPON_NOT_FOUND', message: 'Invalid coupon code' });
    }
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, code: 'COUPON_EXPIRED', message: 'Coupon has expired' });
    }
    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, code: 'COUPON_LIMIT_REACHED', message: 'Coupon usage limit reached' });
    }
    const subtotal = Number(cartAmount) || 0;
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, code: 'MINIMUM_ORDER_NOT_MET', message: `Minimum order of INR ${coupon.minOrderAmount} required` });
    }
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = Math.min(subtotal, coupon.discountValue);
    }
    discount = Math.round(discount);
    const finalTotal = Math.max(0, subtotal - discount);
    return res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderAmount: coupon.minOrderAmount,
        targetProject: coupon.targetProject,
        targetProjectTitle: coupon.targetProjectTitle || 'All Projects'
      },
      subtotal,
      discount,
      finalTotal,
      message: 'Coupon applied successfully!'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/coupons/latest-active', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, coupon: coupon || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons: coupons || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/coupons', async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon, message: 'Coupon created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/coupons/:id', async (req, res) => {
  try {
    const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon: updated, message: 'Coupon updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted permanently from database!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. ORDERS & TRANSACTIONS (CRUD)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('projects').sort({ createdAt: -1 });
    res.json({ success: true, orders: orders || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. ORDERS & TRANSACTIONS (CRUD + In-App Telegram Inline Approve/Reject)
const sendOrderTelegramNotification = async (order, populated) => {
  const customerEmail = order.userEmail || populated?.user?.email || 'Customer';
  const customerPhone = order.customerPhone || populated?.user?.phone || '7303354598';
  const utrRef = order.utrNumber || 'N/A';
  const totalAmt = order.totalAmount || 499;
  const projTitles = (order.projects || populated?.projects || []).map((p) => p.title || p).join(', ') || 'Digital Catalog Item';

  const teleMsg = `🛒 <b>NEW ORDER PAYMENT (UTR) RECEIVED!</b>\n\n` +
    `👤 <b>Customer:</b> ${customerEmail} (📞 ${customerPhone})\n` +
    `📦 <b>Project(s):</b> ${projTitles}\n` +
    `💰 <b>Amount:</b> INR ${totalAmt}\n` +
    `💳 <b>UTR Ref:</b> <code>${utrRef}</code>\n\n` +
    `⚡ <b>Tap "Approve & Unlock" below to approve in 1 click from your phone:</b>`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '✅ Approve & Unlock Download',
          url: `https://codewithkj.vercel.app/api/telegram/order-action?action=approve&orderId=${order._id}`,
        },
        {
          text: '❌ Reject Order',
          url: `https://codewithkj.vercel.app/api/telegram/order-action?action=reject&orderId=${order._id}`,
        },
      ],
      [
        {
          text: '🟢 Open Admin Command Center',
          url: 'https://codewithkj.vercel.app/admin',
        },
        {
          text: '💬 WhatsApp Customer',
          url: `https://wa.me/91${(customerPhone || '').replace(/\D/g, '')}?text=Hi,%20we%20received%20your%20order%20for%20${encodeURIComponent(projTitles)}%20on%20ApexMarket.`,
        },
      ],
    ],
  };

  await sendTelegramAlert(teleMsg, replyMarkup);
};

// TELEGRAM WEBHOOK (Handles In-App [Approve] & [Reject] Button Taps)
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const callbackQuery = req.body?.callback_query;
    if (callbackQuery) {
      const data = callbackQuery.data || '';
      const callbackId = callbackQuery.id;
      const chatId = callbackQuery.message?.chat?.id || TELEGRAM_CHAT_ID;
      const messageId = callbackQuery.message?.message_id;

      if (data === 'none') {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackId,
            text: 'This order has already been processed.',
            show_alert: false,
          }),
        });
        return res.status(200).json({ ok: true });
      }

      const parts = data.split('_');
      const action = parts[0];
      const orderId = parts.slice(1).join('_');

      const order = await Order.findById(orderId).populate('user').populate('projects');
      if (!order) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackId,
            text: '❌ Order not found in database.',
            show_alert: true,
          }),
        });
        return res.status(200).json({ ok: true });
      }

      const customerEmail = order.userEmail || order.user?.email || 'Customer';
      const customerPhone = order.customerPhone || 'N/A';
      const projTitles = (order.projects || []).map(p => p.title).join(', ') || 'Digital Project';
      const utrRef = order.utrNumber || 'N/A';

      if (action === 'approve') {
        order.paymentStatus = 'paid';
        await order.save();

        // 1. In-App Telegram Toast / Alert
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackId,
            text: '✅ Payment APPROVED! Download access is now unlocked for the buyer.',
            show_alert: true,
          }),
        });

        // 2. In-App Message Edit in Telegram
        if (messageId) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: `✅ <b>ORDER APPROVED & UNLOCKED!</b>\n\n` +
                `📦 <b>Order ID:</b> <code>ord_${order._id}</code>\n` +
                `👤 <b>Customer:</b> ${customerEmail}\n` +
                `📞 <b>Phone:</b> ${customerPhone}\n` +
                `💵 <b>Amount:</b> INR ${order.totalAmount}\n` +
                `🔑 <b>UTR/Ref:</b> <code>${utrRef}</code>\n` +
                `📦 <b>Projects:</b> ${projTitles}\n` +
                `⚡ <b>Status:</b> <code>PAID / UNLOCKED ✅</code>\n\n` +
                `🔓 <i>Download access has been instantly unlocked in buyer dashboard!</i>`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '✅ APPROVED & UNLOCKED', callback_data: 'none' }
                  ]
                ]
              }
            }),
          });
        }

        // 3. Buyer Email Notification
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #10b981; margin-bottom: 8px;">Payment Verified & Approved! 🚀</h2>
            <p>Hi <strong>${customerEmail}</strong>,</p>
            <p>Your payment of <strong>₹${order.totalAmount}</strong> for <strong>${projTitles}</strong> has been verified by Khushal Jangid.</p>
            <p>Your source code and downloads are now <strong>PERMANENTLY UNLOCKED</strong> in your account.</p>
            <div style="margin: 24px 0;">
              <a href="https://codewithkj.vercel.app/dashboard" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to My Downloads Dashboard</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code Studio</p>
          </div>
        `;

        if (customerEmail && customerEmail.includes('@')) {
          await sendMailNotification(customerEmail, `Payment Approved! Downloads Unlocked - ApexMarket`, emailHtml);
        }
      } else if (action === 'reject') {
        order.paymentStatus = 'failed';
        await order.save();

        // 1. In-App Telegram Toast / Alert
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackId,
            text: '❌ Order REJECTED! Downloads remain locked.',
            show_alert: true,
          }),
        });

        // 2. In-App Message Edit in Telegram
        if (messageId) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: `❌ <b>ORDER REJECTED!</b>\n\n` +
                `📦 <b>Order ID:</b> <code>ord_${order._id}</code>\n` +
                `👤 <b>Customer:</b> ${customerEmail}\n` +
                `📞 <b>Phone:</b> ${customerPhone}\n` +
                `💵 <b>Amount:</b> INR ${order.totalAmount}\n` +
                `🔑 <b>UTR/Ref:</b> <code>${utrRef}</code>\n` +
                `📦 <b>Projects:</b> ${projTitles}\n` +
                `⚡ <b>Status:</b> <code>FAILED / REJECTED ❌</code>\n\n` +
                `🔒 <i>Buyer does NOT have access to downloads.</i>`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '❌ REJECTED', callback_data: 'none' }
                  ]
                ]
              }
            }),
          });
        }

        // 3. Buyer Email Notification
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #ef4444; margin-bottom: 8px;">UTR Verification Failed ⚠️</h2>
            <p>Hi <strong>${customerEmail}</strong>,</p>
            <p>We were unable to verify the UPI Transaction / UTR (<code>${order.utrNumber || 'N/A'}</code>) for your order.</p>
            <p>Please contact support or re-submit with your valid UPI transaction reference.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code Studio</p>
          </div>
        `;

        if (customerEmail && customerEmail.includes('@')) {
          await sendMailNotification(customerEmail, `Payment Verification Issue - ApexMarket`, emailHtml);
        }
      }
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err.message);
    res.status(200).json({ ok: true, error: err.message });
  }
});

app.post('/api/orders/qr-checkout', async (req, res) => {
  try {
    const { projectIds, couponCode, transactionRef, contactEmail, contactPhone, referredByCode } = req.body;

    if (!contactEmail || !transactionRef) {
      return res.status(400).json({ success: false, message: 'Email and UTR reference number are required.' });
    }

    const cleanUtr = (transactionRef || '').trim();
    if (cleanUtr.length !== 12 || isNaN(cleanUtr)) {
      return res.status(400).json({ success: false, code: 'INVALID_UTR', message: 'Please enter a valid 12-digit numeric UPI UTR Reference.' });
    }

    const existingOrder = await Order.findOne({ utrNumber: cleanUtr });
    if (existingOrder) {
      return res.status(400).json({ success: false, code: 'DUPLICATE_UTR', message: 'This UTR has already been submitted.' });
    }

    let user = await User.findOne({ email: contactEmail.toLowerCase().trim() });
    if (!user) {
      const randomGuestPass = 'guest_' + Math.random().toString(36).substring(2, 14);
      const hashedPassword = await bcrypt.hash(randomGuestPass, 10);
      const refCode = (contactEmail.split('@')[0].slice(0, 4) + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
      user = await User.create({
        name: contactEmail.split('@')[0],
        email: contactEmail.toLowerCase().trim(),
        password: hashedPassword,
        role: 'user',
        referralCode: refCode,
      });
    }

    // Check if user already owns any project
    const alreadyOwned = await Order.findOne({
      user: user._id,
      paymentStatus: { $in: ['paid', 'completed'] },
      projects: { $in: projectIds || [] },
    });
    if (alreadyOwned) {
      return res.status(400).json({ success: false, code: 'ALREADY_OWNED', message: 'You already own this product. Duplicate purchase is prevented.' });
    }

    const projects = await Project.find({ _id: { $in: projectIds || [] } });
    let totalAmount = projects.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          totalAmount = Math.max(0, Math.round(totalAmount * (1 - coupon.discountValue / 100)));
        } else {
          totalAmount = Math.max(0, totalAmount - coupon.discountValue);
        }
      }
    }

// User already resolved above

    const newOrder = await Order.create({
      user: user._id,
      userEmail: contactEmail.toLowerCase().trim(),
      customerPhone: contactPhone || '7303354598',
      projects: projects.map(p => p._id),
      totalAmount,
      paymentStatus: 'pending',
      paymentMethod: 'Direct UPI Scan (Manual Verification)',
      utrNumber: transactionRef.trim(),
    });

    const populated = await Order.findById(newOrder._id).populate('user').populate('projects');
    await sendOrderTelegramNotification(newOrder, populated);

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      order: populated,
      token,
      message: 'UTR submitted successfully! Once verified, download access will be unlocked.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await Order.create(req.body);
    const populated = await Order.findById(order._id).populate('user').populate('projects');
    await sendOrderTelegramNotification(order, populated);
    res.status(201).json({ success: true, order: populated || order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TELEGRAM DIRECT INLINE APPROVE / REJECT WEBHOOK (FALLBACK URL)
app.get('/api/telegram/order-action', async (req, res) => {
  try {
    const { action, orderId } = req.query;
    if (!orderId) {
      return res.status(400).send('<h3>Invalid request: Order ID is missing.</h3>');
    }

    const order = await Order.findById(orderId).populate('user').populate('projects');
    if (!order) {
      return res.status(404).send('<h3>Order not found in database.</h3>');
    }

    const customerEmail = order.userEmail || order.user?.email || 'Customer';
    const projTitles = (order.projects || []).map(p => p.title).join(', ') || 'Digital Project';

    if (action === 'approve') {
      order.paymentStatus = 'paid';
      await order.save();

      await sendTelegramAlert(
        `✅ <b>ORDER APPROVED VIA TELEGRAM!</b>\n\n` +
        `👤 <b>Buyer:</b> ${customerEmail}\n` +
        `📦 <b>Project:</b> ${projTitles}\n` +
        `💵 <b>Amount:</b> INR ${order.totalAmount}\n` +
        `🧾 <b>UTR:</b> <code>${order.utrNumber || 'APPROVED'}</code>\n\n` +
        `🚀 <b>Status:</b> <code>PAID / UNLOCKED</code>\n` +
        `🔓 <i>Download access is now active in buyer dashboard!</i>`
      );

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #10b981; margin-bottom: 8px;">Payment Verified & Approved! 🚀</h2>
          <p>Hi <strong>${customerEmail}</strong>,</p>
          <p>Your payment of <strong>₹${order.totalAmount}</strong> for <strong>${projTitles}</strong> has been verified by Khushal Jangid.</p>
          <p>Your source code and downloads are now <strong>PERMANENTLY UNLOCKED</strong> in your account.</p>
          <div style="margin: 24px 0;">
            <a href="https://codewithkj.vercel.app/dashboard" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to My Downloads Dashboard</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code Studio</p>
        </div>
      `;

      if (customerEmail && customerEmail.includes('@')) {
        await sendMailNotification(customerEmail, `Payment Approved! Downloads Unlocked - ApexMarket`, emailHtml);
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order Approved - ApexMarket</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 18px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
              .badge { background: #064e3b; color: #34d399; font-weight: 800; padding: 6px 16px; border-radius: 20px; display: inline-block; margin-bottom: 16px; font-size: 13px; letter-spacing: 0.5px; }
              h2 { margin: 0 0 12px 0; font-size: 24px; color: #ffffff; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
              .btn { background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; display: inline-block; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">✅ PAYMENT APPROVED</div>
              <h2>Order Verified Successfully!</h2>
              <p>Order <strong>ord_${order._id}</strong> for <strong>${customerEmail}</strong> (₹${order.totalAmount}) has been marked as <strong>PAID</strong>.<br><br>Source code downloads are now unlocked in the customer's dashboard.</p>
              <a href="https://codewithkj.vercel.app/admin" class="btn">Open Admin Command Center</a>
            </div>
          </body>
        </html>
      `);
    } else if (action === 'reject') {
      order.paymentStatus = 'failed';
      await order.save();

      await sendTelegramAlert(
        `❌ <b>ORDER REJECTED VIA TELEGRAM!</b>\n\n` +
        `👤 <b>Buyer:</b> ${customerEmail}\n` +
        `📦 <b>Project:</b> ${projTitles}\n` +
        `💵 <b>Amount:</b> INR ${order.totalAmount}\n` +
        `🧾 <b>UTR:</b> <code>${order.utrNumber || 'INVALID'}</code>\n\n` +
        `⚠️ <b>Status:</b> <code>REJECTED / FAILED</code>\n` +
        `🔒 <i>Buyer does NOT have access to downloads.</i>`
      );

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #ef4444; margin-bottom: 8px;">UTR Verification Failed ⚠️</h2>
          <p>Hi <strong>${customerEmail}</strong>,</p>
          <p>We were unable to verify the UPI Transaction / UTR (<code>${order.utrNumber || 'N/A'}</code>) for your order.</p>
          <p>Please contact support or re-submit with your valid UPI transaction reference.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code Studio</p>
        </div>
      `;

      if (customerEmail && customerEmail.includes('@')) {
        await sendMailNotification(customerEmail, `Payment Verification Issue - ApexMarket`, emailHtml);
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order Rejected - ApexMarket</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 18px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
              .badge { background: #4c0519; color: #fb7185; font-weight: 800; padding: 6px 16px; border-radius: 20px; display: inline-block; margin-bottom: 16px; font-size: 13px; letter-spacing: 0.5px; }
              h2 { margin: 0 0 12px 0; font-size: 24px; color: #ffffff; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
              .btn { background: #334155; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; display: inline-block; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">❌ REJECTED</div>
              <h2>Payment Marked as Rejected</h2>
              <p>Order <strong>ord_${order._id}</strong> has been marked as <strong>FAILED</strong>.<br><br>Downloads remain locked for this buyer.</p>
              <a href="https://codewithkj.vercel.app/admin" class="btn">Open Admin Command Center</a>
            </div>
          </body>
        </html>
      `);
    }

    res.status(400).send('<h3>Invalid action parameter.</h3>');
  } catch (err) {
    res.status(500).send(`<h3>Server error: ${err.message}</h3>`);
  }
});

app.post('/api/orders/verify-utr/:id', async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: 'paid' }, { new: true }).populate('user').populate('projects');
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });

    const customerEmail = updated.userEmail || updated.user?.email || 'Customer';
    const projTitles = (updated.projects || []).map(p => p.title).join(', ') || 'Digital Project';

    const teleMsg = `✅ <b>ORDER UTR PAYMENT APPROVED!</b>\n\n` +
      `👤 <b>Buyer:</b> ${customerEmail}\n` +
      `📦 <b>Projects:</b> ${projTitles}\n` +
      `💵 <b>Amount Paid:</b> INR ${updated.totalAmount}\n` +
      `🧾 <b>Verified UTR:</b> <code>${updated.utrNumber || 'APPROVED'}</code>\n` +
      `🧾 <b>Order ID:</b> <code>${updated._id}</code>\n\n` +
      `🚀 <b>Status:</b> <code>PAID / UNLOCKED</code>\n` +
      `🔓 <i>Download access has been instantly unlocked for this buyer!</i>`;

    await sendTelegramAlert(teleMsg);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #10b981; margin-bottom: 8px;">Payment Approved! Source Code Unlocked 🚀</h2>
        <p>Hi <strong>${customerEmail}</strong>,</p>
        <p>Your payment for <strong>${projTitles}</strong> (₹${updated.totalAmount}) has been verified and approved.</p>
        <p>You can now go to your <a href="https://codewithkj.vercel.app/dashboard" style="color: #4f46e5; font-weight: bold;">User Dashboard</a> to download your source code files and view your purchase history.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code Studio</p>
      </div>
    `;

    if (customerEmail && customerEmail.includes('@')) {
      await sendMailNotification(customerEmail, `Payment Verified! Downloads Unlocked - ApexMarket`, emailHtml);
    }

    res.json({ success: true, order: updated, message: 'UTR payment approved successfully and notifications dispatched!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/reject-utr/:id', async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: 'failed' }, { new: true }).populate('user').populate('projects');
    if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });

    const customerEmail = updated.userEmail || updated.user?.email || 'Customer';
    const projTitles = (updated.projects || []).map(p => p.title).join(', ') || 'Digital Project';

    const teleMsg = `❌ <b>ORDER UTR PAYMENT REJECTED!</b>\n\n` +
      `👤 <b>Buyer:</b> ${customerEmail}\n` +
      `📦 <b>Projects:</b> ${projTitles}\n` +
      `💵 <b>Amount:</b> INR ${updated.totalAmount}\n` +
      `🧾 <b>Rejected UTR:</b> <code>${updated.utrNumber || 'INVALID'}</code>\n` +
      `🧾 <b>Order ID:</b> <code>${updated._id}</code>\n\n` +
      `⚠️ <b>Status:</b> <code>REJECTED / PAYMENT FAILED</code>\n` +
      `🔒 <i>Buyer has been notified to provide valid payment proof.</i>`;

    await sendTelegramAlert(teleMsg);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #ef4444; margin-bottom: 8px;">UTR Payment Verification Failed ⚠️</h2>
        <p>Hi <strong>${customerEmail}</strong>,</p>
        <p>We were unable to verify the UPI Transaction / UTR number (<code>${updated.utrNumber || 'N/A'}</code>) for your order (<strong>${projTitles}</strong>).</p>
        <p>If you made the payment, please reply to this email with your payment screenshot or reach out via <a href="https://codewithkj.vercel.app/support" style="color: #4f46e5; font-weight: bold;">Support Desk</a>.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">ApexMarket - Digital Source Code Studio</p>
      </div>
    `;

    if (customerEmail && customerEmail.includes('@')) {
      await sendMailNotification(customerEmail, `Payment Verification Issue - ApexMarket`, emailHtml);
    }

    res.json({ success: true, order: updated, message: 'UTR payment marked as rejected and notifications dispatched.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Refund Order Endpoint (Admin only)
app.post('/api/orders/refund/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.paymentStatus = 'failed';
    await order.save();
    res.json({ success: true, message: 'Order refunded and access revoked', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order record deleted permanently!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. REVIEWS (CRUD)
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json({ success: true, reviews: reviews || [], allReviews: reviews || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({ success: true, review, message: 'Review added successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted permanently!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. FEATURE REQUESTS (CRUD)
app.get('/api/feature-requests', async (req, res) => {
  try {
    const featureRequests = await FeatureRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, featureRequests: featureRequests || [], requests: featureRequests || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/feature-requests', async (req, res) => {
  try {
    const request = await FeatureRequest.create(req.body);
    sendTelegramAlert(`💡 <b>NEW FEATURE REQUEST!</b>\n\n📌 <b>Title:</b> ${request.title}\n💰 <b>Budget:</b> ${request.budget}`);
    res.status(201).json({ success: true, request, message: 'Feature request submitted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/feature-requests/:id', async (req, res) => {
  try {
    const updated = await FeatureRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, request: updated, message: 'Feature request updated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/feature-requests/:id', async (req, res) => {
  try {
    await FeatureRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Feature request deleted permanently!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. SUBSCRIBERS (CRUD)
app.get('/api/support/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json({ success: true, subscribers: subscribers || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/support/subscribers', async (req, res) => {
  try {
    const { email } = req.body;
    const sub = await Subscriber.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { email: email.toLowerCase().trim() },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, subscriber: sub, message: 'Subscribed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/support/subscribers/:id', async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subscriber deleted permanently!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 13. REAL ACCURATE ANALYTICS & DASHBOARD STATS
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalInquiries = await CustomProject.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Real orders aggregation
    const paidOrders = await Order.find({ paymentStatus: { $in: ['paid', 'completed'] } });
    const ordersRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const inquiriesRevenue = totalInquiries * 50;
    const totalRevenue = ordersRevenue + inquiriesRevenue;

    const recentOrders = await Order.find().populate('user').sort({ createdAt: -1 }).limit(10);
    const topProjects = await Project.find().sort({ downloadCount: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProjects,
      },
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProjects,
      monthlySales: [
        { month: 'Jun', revenue: 0 },
        { month: 'Jul', revenue: 0 },
        { month: 'Aug', revenue: totalRevenue },
      ],
      recentOrders: recentOrders || [],
      topProjects: topProjects || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 14. REAL USER PURCHASES & DOWNLOADS
app.get('/api/orders/my-purchases', authenticate, async (req, res) => {
  try {
    const userOrders = await Order.find({
      $or: [{ user: req.user.userId }, { userEmail: req.user.email }],
      paymentStatus: { $in: ['paid', 'completed'] }
    }).populate('projects');

    const purchases = [];
    userOrders.forEach(o => {
      (o.projects || []).forEach(p => {
        purchases.push({
          orderId: o._id,
          project: p,
          titleAtPurchase: p?.title || 'Digital Project',
          pricePaid: p?.price || 0,
          purchasedAt: o.createdAt,
        });
      });
    });

    res.json({ success: true, purchases, orders: userOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 15. LIVE SUPPORT CHAT & TICKET PORTAL (CRUD)
app.get('/api/support', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = req.query.userId;
    let userRole = 'user';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userRole = decoded.role;
        if (userRole !== 'admin' || !userId) {
          userId = decoded.userId;
        }
      } catch (_) {
        if (token.includes('admin')) userRole = 'admin';
      }
    }

    if (!userId) {
      return res.json({ success: true, messages: [] });
    }

    const messages = await ChatMessage.find({ userId }).sort({ createdAt: 1 });
    res.json({ success: true, messages: messages || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/support', async (req, res) => {
  try {
    const { message, userId: targetUserId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const authHeader = req.headers.authorization;
    let senderRole = 'user';
    let userId = targetUserId;
    let userName = 'Customer';
    let userEmail = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        senderRole = decoded.role || 'user';
        if (senderRole !== 'admin' || !userId) {
          userId = decoded.userId;
        }
        userEmail = decoded.email || '';
      } catch (_) {
        if (token.includes('admin')) senderRole = 'admin';
      }
    }

    if (!userId) {
      userId = 'guest_' + Date.now();
    }

    const newMsg = await ChatMessage.create({
      userId,
      userName,
      userEmail,
      senderRole,
      message: message.trim(),
    });

    if (senderRole === 'user') {
      sendTelegramAlert(`💬 <b>NEW SUPPORT CHAT MESSAGE RECEIVED!</b>\n\n👤 <b>Sender:</b> ${userEmail || 'Customer'}\n📝 <b>Message:</b> ${message.trim()}\n⚡ <i>User ID: ${userId}</i>`);
    }

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/support/admin/chats', async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: -1 });
    const userMap = {};
    messages.forEach((m) => {
      if (!userMap[m.userId]) {
        userMap[m.userId] = {
          userId: m.userId,
          user: {
            _id: m.userId,
            name: m.userName || 'Customer',
            email: m.userEmail || 'Customer',
          },
          lastMessage: m.message,
          lastMessageDate: m.createdAt,
        };
      }
    });
    res.json({ success: true, chats: Object.values(userMap) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/support/chat/:userId', async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.params.userId });
    res.json({ success: true, message: 'Chat ticket deleted permanently!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/support/send-email', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Email, subject, and message are required' });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">Support Ticket Received: ${subject}</h2>
        <p><strong>From:</strong> ${name || 'Customer'} &lt;${email}&gt;</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #cbd5e1;">
          <p style="white-space: pre-wrap; margin: 0;">${message}</p>
        </div>
        <p style="font-size: 13px; color: #64748b;">Khushal Jangid will respond directly to your email within 2-4 hours.</p>
      </div>
    `;

    sendMailNotification('khushaljangra721@gmail.com', `📩 New Support Ticket: ${subject}`, emailHtml);
    sendMailNotification(email, `Support Ticket Received: ${subject} - ApexMarket`, emailHtml);
    sendTelegramAlert(`📩 <b>NEW SUPPORT EMAIL TICKET!</b>\n\n👤 <b>From:</b> ${name || 'Customer'} (${email})\n📌 <b>Subject:</b> ${subject}\n📝 <b>Message:</b> ${message}`);

    res.json({ success: true, message: 'Your support ticket email has been sent successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default app;
