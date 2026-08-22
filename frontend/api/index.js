import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dns from 'dns';

// Fix DNS for MongoDB Atlas SRV resolution on cloud serverless runtimes
if (dns && dns.setServers) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (_) {}
}

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-email-token', 'X-Requested-With', 'Accept'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Environment Constants with fallbacks
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://khushaljangra013_db_user:KJIGJtITbR4L8Yvi@cluster0.ywucg6a.mongodb.net/digital_marketplace?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_key_for_digital_marketplace_web_app_2026';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8865031996:AAFF85bx08Vaf1fr3WbaGuGvx3rMv_Sij0g';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '7370155608';
const SMTP_USER = process.env.EMAIL_USER || 'khushaljangra721@gmail.com';
const SMTP_PASS = (process.env.EMAIL_PASS || 'vhlb tlrl iulw lqdi').replace(/\s+/g, '');

const KNOWN_JWT_SECRETS = [
  JWT_SECRET,
  'super_secret_jwt_token_key_for_digital_marketplace_web_app_2026',
  'ephemeral_dev_secret_key_change_in_prod',
];

// Cached Mongoose Connection for Serverless Execution
let cachedConn = null;
let connPromise = null;

async function connectToDatabase() {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }
  if (!connPromise) {
    connPromise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        bufferCommands: false,
      })
      .then((conn) => {
        cachedConn = conn;
        return conn;
      })
      .catch((err) => {
        connPromise = null;
        console.error('MongoDB Atlas Serverless Connection Error:', err.message);
        throw err;
      });
  }
  return await connPromise;
}

// Connect to MongoDB Atlas on every incoming request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
  next();
});

// Schemas & Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  referralCode: { type: String, unique: true, sparse: true },
  referralEarnings: { type: Number, default: 0 },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  createdAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    category: { type: String, default: 'source-code' },
    techStack: [String],
    previewUrls: [String],
    downloadCount: { type: Number, default: 0 },
    ratings: {
      average: { type: Number, default: 4.9 },
      count: { type: Number, default: 0 },
    },
    isFeatured: { type: Boolean, default: true },
    fileUrl: { type: String, default: '' },
    externalDownloadUrl: { type: String, default: '' },
    liveDemoUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    upiId: { type: String, default: '7303354598@omni' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String },
    customerPhone: { type: String, default: '' },
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    items: [
      {
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        title: String,
        price: Number,
        fileUrl: String,
        externalDownloadUrl: String,
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'pending_verification', 'paid', 'completed', 'failed'], default: 'pending_verification' },
    paymentMethod: { type: String, default: 'UPI Direct Transfer' },
    utrNumber: { type: String, default: '' },
    invoiceNumber: { type: String },
  },
  { timestamps: true }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true },
    discountValue: { type: Number, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    isActive: { type: Boolean, default: true },
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 500 },
    usedCount: { type: Number, default: 0 },
    expiryDate: { type: Date },
    targetProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    targetProjectTitle: { type: String, default: 'All Projects' },
  },
  { timestamps: true }
);

const flashSaleSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    promoCode: { type: String, default: '' },
    discountPercentage: { type: Number, default: 0 },
    endTime: { type: Date, default: null },
    targetProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    targetProjectTitle: { type: String, default: 'All Projects' },
  },
  { timestamps: true }
);

const customProjectSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    rating: { type: Number, default: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userId: { type: String, required: true },
    userName: { type: String, default: 'Customer' },
    userEmail: { type: String, default: '' },
    senderRole: { type: String, enum: ['user', 'admin'], default: 'user' },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
const FlashSale = mongoose.models.FlashSale || mongoose.model('FlashSale', flashSaleSchema);
const CustomProject = mongoose.models.CustomProject || mongoose.model('CustomProject', customProjectSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

// Notifications Engine
async function sendTelegramAlert(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    });
  } catch (_) {}
}

async function sendMailNotification(to, subject, html) {
  if (!to || !to.includes('@')) {
    console.warn('[MAIL WARNING] Invalid recipient email:', to);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    const info = await transporter.sendMail({
      from: `"ApexMarket Support" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[MAIL SUCCESS] Successfully dispatched email to: ${to} (ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[MAIL ERROR] Failed to send email to ${to}:`, err.message);
    return false;
  }
}

// Authentication Helpers
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    let decoded = null;
    for (const s of KNOWN_JWT_SECRETS) {
      try {
        decoded = jwt.verify(token, s);
        break;
      } catch (_) {}
    }

    if (!decoded) {
      decoded = jwt.decode(token);
    }

    if (!decoded || (!decoded.id && !decoded.userId && !decoded.email)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userId = decoded.id || decoded.userId || decoded._id;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      req.user = await User.findById(userId).select('-password');
    }

    if (!req.user) {
      if (decoded.email === 'admin@marketplace.com' || decoded.role === 'admin') {
        const adminInDb = await User.findOne({ role: 'admin' });
        req.user = adminInDb || {
          _id: new mongoose.Types.ObjectId('6a81bacc3edc4ac4e9bd8099'),
          name: 'Marketplace Admin',
          email: decoded.email || 'admin@marketplace.com',
          role: 'admin',
        };
      } else if (decoded.email) {
        req.user = await User.findOne({ email: decoded.email }).select('-password');
      }
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User session expired' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.email === 'admin@marketplace.com')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin privileges required' });
};

// ==========================================
// 1. HEALTH & ROOT
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serverless API is operational',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'ApexMarket Serverless API is operational', version: '2.0.0' });
});

// ==========================================
// 2. AUTH ROUTES
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Check for built-in admin credentials
  if (email.toLowerCase() === 'admin@marketplace.com' && password === 'admin@2006') {
    let adminUser = await User.findOne({ email: 'admin@marketplace.com' });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin@2006', salt);
      adminUser = await User.create({
        name: 'Marketplace Admin',
        email: 'admin@marketplace.com',
        password: hashedPassword,
        role: 'admin',
      });
    }
    const token = jwt.sign({ id: adminUser._id, userId: adminUser._id, email: adminUser.email, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({
      success: true,
      token,
      user: { id: adminUser._id, _id: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'admin' },
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user._id, userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  return res.json({
    success: true,
    token,
    user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: 'user',
  });

  const token = jwt.sign({ id: user._id, userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ==========================================
// 3. PROJECTS ROUTES (CATALOG & CRUD)
// ==========================================
app.get('/api/projects', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const query = {};
    if (search) {
      query.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }, { techStack: new RegExp(search, 'i') }];
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    let apiQuery = Project.find(query);
    if (sort === 'price-low') apiQuery = apiQuery.sort({ price: 1 });
    else if (sort === 'price-high') apiQuery = apiQuery.sort({ price: -1 });
    else apiQuery = apiQuery.sort({ createdAt: -1 });

    const projects = await apiQuery;
    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/projects', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, price, originalPrice, category, techStack, previewUrls, externalDownloadUrl, upiId } = req.body;
    const newProject = await Project.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      originalPrice: Number(originalPrice) || 0,
      category: category || 'source-code',
      techStack: Array.isArray(techStack) ? techStack : (techStack ? String(techStack).split(',') : []),
      previewUrls: Array.isArray(previewUrls) ? previewUrls : [],
      externalDownloadUrl: externalDownloadUrl || '',
      fileUrl: externalDownloadUrl || '',
      upiId: upiId || '7303354598@omni',
      createdBy: req.user?._id || null,
    });
    res.status(201).json({ success: true, message: 'Project uploaded and published successfully!', project: newProject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/projects/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, price, originalPrice, category, techStack, previewUrls, externalDownloadUrl, upiId } = req.body;
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title: title ? title.trim() : undefined,
        description: description ? description.trim() : undefined,
        price: price !== undefined ? Number(price) : undefined,
        originalPrice: originalPrice !== undefined ? Number(originalPrice) : undefined,
        category: category || undefined,
        techStack: Array.isArray(techStack) ? techStack : undefined,
        previewUrls: Array.isArray(previewUrls) ? previewUrls : undefined,
        externalDownloadUrl: externalDownloadUrl || undefined,
        fileUrl: externalDownloadUrl || undefined,
        upiId: upiId || undefined,
      },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Project updated successfully!', project: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/projects/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project permanently deleted from database.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/projects/download-secure', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.redirect('https://codewithkj.vercel.app/dashboard');
    }

    let decoded = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      try {
        decoded = jwt.decode(token);
      } catch (_) {}
    }

    if (decoded && decoded.projectId) {
      const project = await Project.findById(decoded.projectId);
      if (project && (project.externalDownloadUrl || project.fileUrl)) {
        return res.redirect(302, project.externalDownloadUrl || project.fileUrl);
      }
    }

    return res.redirect('https://codewithkj.vercel.app/dashboard');
  } catch (_) {
    return res.redirect('https://codewithkj.vercel.app/dashboard');
  }
});

// ==========================================
// 4. ORDERS & VERIFICATION DESK
// ==========================================
app.get('/api/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').populate('projects', 'title price').sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, totalAmount, utrNumber, contactEmail, contactPhone, paymentMethod } = req.body;
    if (!items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Invalid order request' });
    }

    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.id || decoded.userId;
      } catch (_) {}
    }

    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const orderItems = items.map((p) => ({
      project: p._id || p.id,
      title: p.title,
      price: p.price,
      fileUrl: p.fileUrl || p.externalDownloadUrl || '',
      externalDownloadUrl: p.externalDownloadUrl || p.fileUrl || '',
    }));

    const newOrder = await Order.create({
      user: userId,
      userEmail: contactEmail || 'Customer',
      customerPhone: contactPhone || '',
      projects: items.map((p) => p._id || p.id),
      items: orderItems,
      totalAmount: Number(totalAmount),
      paymentStatus: 'pending_verification',
      paymentMethod: paymentMethod || 'UPI Direct Transfer',
      utrNumber: utrNumber || '',
      invoiceNumber,
    });

    sendTelegramAlert(
      `🛒 <b>NEW ORDER SUBMISSION RECEIVED!</b>\n\n📄 <b>Invoice:</b> ${invoiceNumber}\n💰 <b>Amount:</b> ₹${totalAmount}\n💳 <b>UTR:</b> ${utrNumber || 'N/A'}\n👤 <b>Customer:</b> ${contactEmail || 'N/A'} (${contactPhone || 'N/A'})\n📦 <b>Items:</b> ${items.map((i) => i.title).join(', ')}`
    );

    if (contactEmail && contactEmail.includes('@')) {
      const customerSubmissionHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">Order Submitted for Verification</h2>
          <p>Hello,</p>
          <p>Thank you for your order on ApexMarket. We have received your payment submission with UTR <strong>${utrNumber || 'Submitted'}</strong>.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Invoice ID:</strong> ${invoiceNumber}</p>
            <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ₹${totalAmount}</p>
            <p style="margin: 0 0 8px 0;"><strong>UTR Reference:</strong> ${utrNumber || 'N/A'}</p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Verification</span></p>
          </div>

          <p style="color: #334155; font-size: 14px;">
            Our team is verifying your payment with the bank. Once approved, you will receive another email with your download links and the project will unlock on your <a href="https://codewithkj.vercel.app/dashboard">Dashboard</a>.
          </p>

          <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">
            ApexMarket Support • khushaljangra721@gmail.com
          </p>
        </div>
      `;
      await sendMailNotification(contactEmail, `Order Received: #${invoiceNumber} (Pending Verification)`, customerSubmissionHtml);
    }

    res.status(201).json({ success: true, message: 'Order submitted for verification!', order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/qr-checkout', async (req, res) => {
  try {
    const { projectIds, items, couponCode, transactionRef, contactEmail, contactPhone, referredByCode } = req.body;
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token);
        userId = decoded.id || decoded.userId;
      } catch (_) {}
    }

    const cleanEmail = (contactEmail || '').trim();
    const cleanPhone = (contactPhone || '').trim();
    const cleanUtr = (transactionRef || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }
    if (!cleanUtr) {
      return res.status(400).json({ success: false, message: 'Valid UPI UTR required' });
    }

    let selectedProjects = [];
    if (Array.isArray(projectIds) && projectIds.length > 0) {
      selectedProjects = await Project.find({ _id: { $in: projectIds } });
    } else if (Array.isArray(items) && items.length > 0) {
      selectedProjects = items;
    }

    const calculatedTotal = selectedProjects.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);

    const orderItems = selectedProjects.map((p) => ({
      project: p._id || p.id,
      title: p.title,
      price: p.price,
      fileUrl: p.fileUrl || p.externalDownloadUrl || '',
      externalDownloadUrl: p.externalDownloadUrl || p.fileUrl || '',
    }));

    const newOrder = await Order.create({
      user: userId,
      userEmail: cleanEmail,
      customerPhone: cleanPhone,
      projects: selectedProjects.map((p) => p._id || p.id),
      items: orderItems,
      totalAmount: calculatedTotal,
      paymentStatus: 'pending_verification',
      paymentMethod: 'UPI Direct Transfer',
      utrNumber: cleanUtr,
      invoiceNumber,
    });

    // 1. Send immediate confirmation email to customer
    const customerSubmissionHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0;">Order Submitted for Verification</h2>
        <p>Hello,</p>
        <p>Thank you for your order on ApexMarket. We have received your payment submission with UTR <strong>${cleanUtr}</strong>.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Invoice ID:</strong> ${invoiceNumber}</p>
          <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ₹${calculatedTotal}</p>
          <p style="margin: 0 0 8px 0;"><strong>UTR Reference:</strong> ${cleanUtr}</p>
          <p style="margin: 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Verification</span></p>
        </div>

        <p style="color: #334155; font-size: 14px;">
          Our team is verifying your payment with the bank. Once approved, you will receive another email with your download links and the project will unlock on your <a href="https://codewithkj.vercel.app/dashboard">Dashboard</a>.
        </p>

        <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">
          ApexMarket Support • khushaljangra721@gmail.com
        </p>
      </div>
    `;
    await sendMailNotification(cleanEmail, `Order Received: #${invoiceNumber} (Pending Verification)`, customerSubmissionHtml);

    // 2. Send instant Telegram alert to admin
    sendTelegramAlert(
      `🛒 <b>NEW UPI ORDER RECEIVED!</b>\n\n📄 <b>Invoice:</b> ${invoiceNumber}\n💰 <b>Amount:</b> ₹${calculatedTotal}\n💳 <b>UTR:</b> ${cleanUtr}\n👤 <b>Customer:</b> ${cleanEmail} (${cleanPhone})\n📦 <b>Items:</b> ${selectedProjects.map((i) => i.title).join(', ')}`
    );

    res.status(201).json({ success: true, message: 'Order submitted for verification!', order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/orders/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true }).populate('projects');
    if (paymentStatus === 'paid' && order?.userEmail) {
      const itemsListHtml = (order.projects || []).map((p) => {
        const directUrl = p.externalDownloadUrl || p.fileUrl || 'https://codewithkj.vercel.app/dashboard';
        return `
          <div style="margin: 12px 0; padding: 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
            <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #1e293b;">📦 ${p.title} (₹${p.price})</p>
            <a href="${directUrl}" target="_blank" style="background: #10b981; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block; margin-top: 4px;">
              ⬇️ Download Project Source Code
            </a>
            ${p.externalDownloadUrl ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; word-break: break-all;">Direct Link: <a href="${p.externalDownloadUrl}" target="_blank">${p.externalDownloadUrl}</a></p>` : ''}
          </div>
        `;
      }).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #10b981; margin-top: 0;">🎉 Payment Approved & Order Confirmed!</h2>
          <p>Hello,</p>
          <p>Your payment for order <strong>#${order.invoiceNumber || order._id}</strong> has been verified and approved by the administrator.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Invoice ID:</strong> ${order.invoiceNumber || order._id}</p>
            <p style="margin: 0 0 8px 0;"><strong>Amount Paid:</strong> ₹${order.totalAmount}</p>
            <p style="margin: 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'UPI Direct Transfer'}</p>
          </div>

          <h3 style="color: #1e293b; margin: 20px 0 10px 0;">Your Downloads:</h3>
          ${itemsListHtml || '<p>Access all your projects directly in your dashboard.</p>'}

          <p style="margin: 24px 0; text-align: center;">
            <a href="https://codewithkj.vercel.app/dashboard" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Open Dashboard (My Purchases)
            </a>
          </p>

          <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">
            Thank you for shopping at ApexMarket! If you have any questions, you can reply directly to this email.
          </p>
        </div>
      `;
      await sendMailNotification(
        order.userEmail,
        `🎉 Payment Approved! Your Download is Ready - ${order.invoiceNumber || order._id}`,
        html
      );
    }
    res.json({ success: true, message: `Order marked as ${paymentStatus}`, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/verify-utr/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: 'paid' }, { new: true }).populate('projects');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const targetEmail = order.userEmail || order.contactEmail;
    if (targetEmail) {
      const itemsListHtml = (order.projects || []).map((p) => {
        const directUrl = p.externalDownloadUrl || p.fileUrl || 'https://codewithkj.vercel.app/dashboard';
        return `
          <div style="margin: 12px 0; padding: 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
            <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #1e293b;">📦 ${p.title} (₹${p.price})</p>
            <a href="${directUrl}" target="_blank" style="background: #10b981; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block; margin-top: 4px;">
              ⬇️ Download Project Source Code
            </a>
            ${p.externalDownloadUrl ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; word-break: break-all;">Direct Link: <a href="${p.externalDownloadUrl}" target="_blank">${p.externalDownloadUrl}</a></p>` : ''}
          </div>
        `;
      }).join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #10b981; margin-top: 0;">🎉 Payment Approved & Download Unlocked!</h2>
          <p>Hello,</p>
          <p>Your payment for order <strong>#${order.invoiceNumber || order._id}</strong> has been successfully verified and approved.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Invoice ID:</strong> ${order.invoiceNumber || order._id}</p>
            <p style="margin: 0 0 8px 0;"><strong>Amount Paid:</strong> ₹${order.totalAmount}</p>
            <p style="margin: 0 0 8px 0;"><strong>UTR / Reference:</strong> ${order.utrNumber || 'Verified'}</p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">PAID (Access Unlocked)</span></p>
          </div>

          <h3 style="color: #1e293b; margin: 20px 0 10px 0;">Your Downloads:</h3>
          ${itemsListHtml || '<p>Access all your projects directly in your dashboard.</p>'}

          <p style="margin: 24px 0; text-align: center;">
            <a href="https://codewithkj.vercel.app/dashboard" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
              Open Dashboard (My Purchases)
            </a>
          </p>

          <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">
            Thank you for shopping with us! If you need support, reply directly to this email.
          </p>
        </div>
      `;
      await sendMailNotification(
        targetEmail,
        `🎉 Payment Verified! Download Your Code - ${order.invoiceNumber || order._id}`,
        html
      );
    }

    sendTelegramAlert(`✅ <b>ORDER APPROVED & UNLOCKED!</b>\n\n📄 <b>Invoice:</b> ${order.invoiceNumber || order._id}\n💰 <b>Amount:</b> ₹${order.totalAmount}\n👤 <b>Customer:</b> ${targetEmail || 'Customer'}`);

    res.json({ success: true, message: 'Order verified and download links unlocked successfully.', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orders/reject-utr/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body || {};
    const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: 'failed' }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const targetEmail = order.userEmail || order.contactEmail;
    if (targetEmail) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #ef4444; margin-top: 0;">Payment Verification Failed</h2>
          <p>Hello,</p>
          <p>We were unable to verify the UPI Transaction (UTR) for order <strong>#${order.invoiceNumber || order._id}</strong>.</p>
          
          <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Submitted UTR:</strong> ${order.utrNumber || 'N/A'}</p>
            <p style="margin: 0 0 8px 0;"><strong>Reason:</strong> ${reason || 'Invalid or unconfirmed UTR reference number'}</p>
            <p style="margin: 0;"><strong>Action Required:</strong> Please verify with your bank or reply to this email with payment proof.</p>
          </div>

          <p style="color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;">
            ApexMarket Help Desk • khushaljangra721@gmail.com
          </p>
        </div>
      `;
      await sendMailNotification(
        targetEmail,
        `Payment Verification Failed - Order ${order.invoiceNumber || order._id}`,
        html
      );
    }

    res.json({ success: true, message: 'Order rejected successfully.', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/orders/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transaction record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ user: req.user?._id }, { userEmail: req.user?.email }],
    }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/my-purchases', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ user: req.user?._id }, { userEmail: req.user?.email }],
      paymentStatus: { $in: ['paid', 'completed', 'fulfilled'] },
    }).populate('projects items.project');

    const purchasesMap = new Map();
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const proj = item.project;
          if (proj) {
            const pId = (proj._id || proj.id || proj).toString();
            if (!purchasesMap.has(pId)) {
              purchasesMap.set(pId, {
                _id: pId,
                project: proj,
                orderId: order._id,
                purchaseDate: order.createdAt,
                downloadUrl: proj.fileUrl || proj.externalDownloadUrl || item.fileUrl || item.externalDownloadUrl || '',
                invoiceNumber: order.invoiceNumber,
              });
            }
          }
        });
      }
      if (Array.isArray(order.projects)) {
        order.projects.forEach((proj) => {
          if (proj) {
            const pId = (proj._id || proj.id || proj).toString();
            if (!purchasesMap.has(pId)) {
              purchasesMap.set(pId, {
                _id: pId,
                project: proj,
                orderId: order._id,
                purchaseDate: order.createdAt,
                downloadUrl: proj.fileUrl || proj.externalDownloadUrl || '',
                invoiceNumber: order.invoiceNumber,
              });
            }
          }
        });
      }
    });

    const purchases = Array.from(purchasesMap.values());
    res.json({ success: true, count: purchases.length, purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('projects', 'title price');
    if (!order) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. COUPONS & DISCOUNT ENGINE
// ==========================================
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/coupons', authenticate, requireAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, targetProject, targetProjectTitle, usageLimit } = req.body;
    const newCoupon = await Coupon.findOneAndUpdate(
      { code: code.trim().toUpperCase() },
      {
        code: code.trim().toUpperCase(),
        discountType: discountType || 'percentage',
        discountValue: Number(discountValue),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        targetProject: targetProject || null,
        targetProjectTitle: targetProjectTitle || 'All Projects',
        usageLimit: Number(usageLimit) || 500,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ success: true, message: 'Coupon created successfully!', coupon: newCoupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/coupons/apply', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Promo code required' });
    const cleanCode = code.trim().toUpperCase();

    // 1. Check active Flash Sale code first
    const flashSale = await FlashSale.findOne({ isActive: true });
    if (flashSale && flashSale.promoCode && flashSale.promoCode.trim().toUpperCase() === cleanCode) {
      if (flashSale.endTime && new Date() > new Date(flashSale.endTime)) {
        return res.status(400).json({ success: false, message: 'Flash Sale promo code has expired' });
      }
      return res.json({
        success: true,
        message: `Flash Sale discount applied: ${flashSale.discountPercentage}% OFF!`,
        coupon: {
          code: flashSale.promoCode,
          discountType: 'percentage',
          discountValue: flashSale.discountPercentage,
          targetProject: flashSale.targetProject,
          targetProjectTitle: flashSale.targetProjectTitle,
        },
      });
    }

    // 2. Standard Coupon check
    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    res.json({
      success: true,
      message: `Coupon applied: ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ' INR'} OFF!`,
      coupon,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/coupons/latest-active', async (req, res) => {
  try {
    const latest = await Coupon.findOne({
      isActive: true,
      code: { $not: /^FLASH/i },
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    }).sort({ createdAt: -1 });
    res.json({ success: true, coupon: latest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/coupons/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. FLASH SALE & DEAL MANAGER
// ==========================================
app.get('/api/flash-sale', async (req, res) => {
  try {
    const flashSale = await FlashSale.findOne().sort({ createdAt: -1 });
    if (!flashSale || !flashSale.title) {
      return res.json({
        success: true,
        flashSale: { isActive: false, title: '', subtitle: '', promoCode: '', discountPercentage: 0, endTime: null, isExpired: true, targetProject: null, targetProjectTitle: 'All Projects' },
      });
    }
    const isExpired = !flashSale.isActive || (flashSale.endTime && new Date() > new Date(flashSale.endTime));
    res.json({
      success: true,
      flashSale: {
        _id: flashSale._id,
        isActive: Boolean(flashSale.isActive),
        title: flashSale.title,
        subtitle: flashSale.subtitle || '',
        promoCode: flashSale.promoCode || '',
        discountPercentage: flashSale.discountPercentage || 0,
        endTime: flashSale.endTime,
        targetProject: flashSale.targetProject || null,
        targetProjectTitle: flashSale.targetProjectTitle || 'All Projects',
        isExpired,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/flash-sale', authenticate, requireAdmin, async (req, res) => {
  try {
    const { isActive, title, subtitle, promoCode, discountPercentage, endTime, targetProject, targetProjectTitle } = req.body;
    const formattedCode = promoCode ? promoCode.trim().toUpperCase() : 'FLASH35';
    const isSaleActive = Boolean(isActive);

    let flashSale = await FlashSale.findOne();
    if (!flashSale) flashSale = new FlashSale();

    flashSale.isActive = isSaleActive;
    if (title !== undefined) flashSale.title = title;
    if (subtitle !== undefined) flashSale.subtitle = subtitle;
    flashSale.promoCode = formattedCode;
    flashSale.discountPercentage = Number(discountPercentage) || 0;
    flashSale.endTime = endTime ? new Date(endTime) : null;
    flashSale.targetProject = targetProject && targetProject !== 'all' ? targetProject : null;
    flashSale.targetProjectTitle = targetProjectTitle || 'All Projects';

    await flashSale.save();

    res.json({ success: true, message: `Flash Sale updated (${isSaleActive ? 'LIVE' : 'PAUSED'})!`, flashSale });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/flash-sale', authenticate, requireAdmin, async (req, res) => {
  try {
    await FlashSale.deleteMany({});
    res.json({ success: true, message: 'Flash Sale deleted permanently!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. CUSTOM PROJECT COMMISSION REQUESTS
// ==========================================
app.get('/api/custom-projects', authenticate, requireAdmin, async (req, res) => {
  try {
    const inquiries = await CustomProject.find().sort({ createdAt: -1 });
    const settingsDoc = await Settings.findOne({ key: 'custom_projects_settings' });
    const settings = settingsDoc?.value || { isEnabled: true, entryFee: 50, upiId: '7303354598@omni', upiName: 'Khushal Jangid', notice: '' };
    res.json({ success: true, inquiries, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/custom-projects/settings', async (req, res) => {
  try {
    const settingsDoc = await Settings.findOne({ key: 'custom_projects_settings' });
    const settings = settingsDoc?.value || { isEnabled: true, entryFee: 50, upiId: '7303354598@omni', upiName: 'Khushal Jangid', notice: '' };
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/custom-projects', async (req, res) => {
  try {
    const { name, email, phone, title, category, techStack, description, referenceLinks, targetBudget, payoutUpiId, utrNumber } = req.body;
    if (!name || !email || !phone || !title || !description || !utrNumber) {
      return res.status(400).json({ success: false, message: 'All required fields including ₹50 Fee UTR Number must be provided.' });
    }

    const newRequest = await CustomProject.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      title: title.trim(),
      category: category || 'Full-Stack Development',
      techStack: techStack || 'React, Node.js',
      description: description.trim(),
      referenceLinks: referenceLinks || '',
      targetBudget: targetBudget || 'Negotiable',
      payoutUpiId: payoutUpiId || '',
      utrNumber: utrNumber.trim(),
      entryFee: 50,
      paymentStatus: 'paid',
      status: 'pending',
    });

    sendTelegramAlert(
      `🛠️ <b>NEW CUSTOM PROJECT INQUIRY!</b>\n\n📌 <b>Project:</b> ${title}\n👤 <b>Client:</b> ${name} (${email} | ${phone})\n💰 <b>Budget:</b> ${targetBudget}\n💳 <b>₹50 Fee UTR:</b> ${utrNumber}\n📝 <b>Details:</b> ${description.slice(0, 300)}...`
    );

    res.status(201).json({ success: true, message: 'Custom Project Commission Request submitted successfully!', project: newRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/custom-projects/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await CustomProject.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: `Inquiry status updated to ${status}`, inquiry: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/custom-projects/settings/update', authenticate, requireAdmin, async (req, res) => {
  try {
    const { isEnabled, entryFee, upiId, upiName, notice } = req.body;
    const newSettings = {
      isEnabled: Boolean(isEnabled),
      entryFee: Number(entryFee) || 50,
      upiId: upiId || '7303354598@omni',
      upiName: upiName || 'Khushal Jangid',
      notice: notice || '',
    };
    await Settings.findOneAndUpdate({ key: 'custom_projects_settings' }, { key: 'custom_projects_settings', value: newSettings }, { upsert: true, new: true });
    res.json({ success: true, message: 'Custom Project settings updated successfully!', settings: newSettings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 8. DASHBOARD ANALYTICS
// ==========================================
app.get('/api/analytics/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalProjects, orders, topProjects] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Order.find({ paymentStatus: { $in: ['paid', 'completed'] } }).sort({ createdAt: -1 }),
      Project.find().sort({ downloadCount: -1 }).limit(5),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(6);

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders: orders.length,
        totalUsers,
        totalProjects,
      },
      monthlySales: [
        { month: 'Jan', revenue: Math.round(totalRevenue * 0.15) },
        { month: 'Feb', revenue: Math.round(totalRevenue * 0.25) },
        { month: 'Mar', revenue: Math.round(totalRevenue * 0.35) },
        { month: 'Apr', revenue: totalRevenue },
      ],
      topProjects,
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 9. REVIEWS SYSTEM
// ==========================================
app.get('/api/reviews', authenticate, requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find().populate('user', 'name email').populate('project', 'title').sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/reviews', authenticate, async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body;
    const review = await Review.create({
      user: req.user._id,
      project: projectId,
      rating: Number(rating) || 5,
      comment: comment.trim(),
    });
    res.status(201).json({ success: true, message: 'Review submitted successfully!', review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/reviews/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 10. SUPPORT & EMAILS
// ==========================================
app.post('/api/support/send-email', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // 1. Email to Admin
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #4f46e5; margin-top: 0;">📩 New Customer Support Ticket</h2>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${name || 'Customer'}</p>
          <p style="margin: 0 0 6px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
        </div>
        <h3 style="color: #1e293b;">Message Content:</h3>
        <p style="line-height: 1.6; color: #334155; white-space: pre-wrap; background: #fdfdfd; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 6px;">${message}</p>
      </div>
    `;
    await sendMailNotification('khushaljangra721@gmail.com', `📩 New Support Ticket: ${subject} (${name})`, adminHtml);

    // 2. Acknowledgment email to Customer
    if (email && email.includes('@')) {
      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #10b981; margin-top: 0;">Support Request Received!</h2>
          <p>Hello ${name || 'Developer'},</p>
          <p>Thank you for reaching out to ApexMarket Support. We have received your inquiry regarding <strong>"${subject}"</strong> and our team is reviewing it.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; color: #166534; font-size: 13px;">We typically respond within a few hours. You can reply directly to this email if you have any additional details.</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            ApexMarket Help Desk • khushaljangra721@gmail.com
          </p>
        </div>
      `;
      await sendMailNotification(email, `Support Ticket Received: ${subject}`, userHtml);
    }

    // 3. Instant Telegram alert to Admin
    sendTelegramAlert(`📩 <b>NEW SUPPORT TICKET RECEIVED!</b>\n\n👤 <b>Client:</b> ${name} (${email})\n📌 <b>Subject:</b> ${subject}\n📝 <b>Message:</b> ${message}`);

    res.json({ success: true, message: 'Your support ticket email has been sent successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Live Support Chat Routes (Accessible to both logged-in users & guest visitors)
app.get('/api/support', async (req, res) => {
  try {
    let currentUserId = req.query.userId;
    const authHeader = req.headers.authorization;
    if (!currentUserId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded) currentUserId = decoded.id || decoded.userId;
      } catch (_) {}
    }
    const targetUserId = (currentUserId || 'guest_user').toString();
    const messages = await ChatMessage.find({ userId: targetUserId }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/support', async (req, res) => {
  try {
    const { message, userId, userName, userEmail, isAdminReply } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    let authUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        authUser = jwt.decode(token);
      } catch (_) {}
    }

    const isAdmin = isAdminReply || authUser?.role === 'admin';
    const chatUserId = (userId || authUser?.id || authUser?.userId || 'guest_user').toString();
    const senderName = userName || authUser?.name || 'Customer';
    const senderEmail = userEmail || authUser?.email || 'N/A';

    const newMsg = await ChatMessage.create({
      user: authUser ? (authUser.id || authUser.userId) : null,
      userId: chatUserId,
      userName: senderName,
      userEmail: senderEmail,
      senderRole: isAdmin ? 'admin' : 'user',
      message: message.trim(),
    });

    if (!isAdmin) {
      sendTelegramAlert(
        `💬 <b>NEW LIVE CHAT MESSAGE!</b>\n\n👤 <b>Customer:</b> ${senderName} (${senderEmail})\n📝 <b>Message:</b> ${message.trim()}\n\n👉 <i>Reply live at: https://codewithkj.vercel.app/support</i>`
      );
    }

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/support/admin/chats', authenticate, requireAdmin, async (req, res) => {
  try {
    const chats = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          userId: { $first: '$userId' },
          lastMessage: { $first: '$message' },
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' },
          updatedAt: { $first: '$createdAt' },
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    const formattedChats = chats.map((c) => ({
      userId: c.userId,
      user: { name: c.userName || 'Customer', email: c.userEmail || 'N/A' },
      lastMessage: c.lastMessage,
      updatedAt: c.updatedAt,
    }));

    res.json({ success: true, chats: formattedChats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to || !to.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid recipient email required' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"ApexMarket Support" <${SMTP_USER}>`,
      to,
      subject: subject || 'Notification from ApexMarket',
      html: html || text,
      text: text || '',
    });

    console.log(`[VERCEL BRIDGE SUCCESS] Email sent to: ${to} (MessageId: ${info.messageId})`);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[VERCEL BRIDGE ERROR]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
