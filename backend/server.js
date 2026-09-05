import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { getJwtSecret } from './config/jwt.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import featureRequestRoutes from './routes/featureRequestRoutes.js';
import projectRequestRoutes from './routes/projectRequestRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import flashSaleRoutes from './routes/flashSaleRoutes.js';
import customProjectRoutes from './routes/customProjectRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Default connection secrets with cloud runtime fallbacks
const DEFAULT_MONGO_URI =
  'mongodb+srv://khushaljangra013_db_user:KJIGJtITbR4L8Yvi@cluster0.ywucg6a.mongodb.net/digital_marketplace?retryWrites=true&w=majority&appName=Cluster0';
const DEFAULT_JWT_SECRET = 'super_secret_jwt_token_key_for_digital_marketplace_web_app_2026';

if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = DEFAULT_MONGO_URI;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = DEFAULT_JWT_SECRET;
}

// Verify JWT configuration early during server boot
try {
  getJwtSecret();
} catch (jwtErr) {
  console.error('JWT Configuration Error:', jwtErr.message);
  if (isProduction) {
    process.exit(1);
  }
}

// Connect to Database
connectDB();

const app = express();

// Performance Optimization: Gzip HTTP Response Compression
app.use(compression());

// Security Headers & Protection Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Configure CORS
const allowedOrigins = [
  'https://codewithkj.vercel.app',
  'https://apexmarketstore.vercel.app',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((url) => url.trim()) : []),
  ...(!isProduction
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000']
    : []),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-email-token', 'X-Requested-With', 'Accept'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NOTE: SECURE UPLOADS DIRECTORY (uploads/secure/) IS STRICTLY ISOLATED
// AND NEVER EXPOSED VIA express.static(). Downloads MUST go through authenticated
// token-verified endpoint GET /api/projects/download-secure.
// Only non-sensitive public assets (if any) can be served statically.
const publicUploadsDir = path.join(__dirname, 'uploads', 'public');
app.use(
  '/public-assets',
  express.static(publicUploadsDir, {
    maxAge: '1d',
    etag: true,
  })
);

// Routes Middleware Mounting
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feature-requests', featureRequestRoutes);
app.use('/api/project-requests', projectRequestRoutes);
app.use('/api/affiliates', affiliateRoutes);
app.use('/api/flash-sale', flashSaleRoutes);
app.use('/api/custom-projects', customProjectRoutes);
app.use('/api/settings', settingsRoutes);

// Health check / Root path handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Project Marketplace API is operational.',
    version: '2.0.0',
  });
});

// Centralized 404 Route Handler
app.use(notFoundHandler);

// Centralized Global Error Handler Middleware
app.use(errorHandler);

import { startTelegramPolling } from './config/telegram.js';
import { handleTelegramCallback } from './controllers/orderController.js';

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  
  // Start Telegram bot polling for instant 1-click Approve/Reject actions on phone
  startTelegramPolling(handleTelegramCallback).catch((err) => {
    console.warn('Telegram polling notice:', err.message);
  });
});

