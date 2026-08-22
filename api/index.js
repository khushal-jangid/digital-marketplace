import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';

// Ensure standard DNS resolvers for MongoDB Atlas SRV connection
if (dns && dns.setServers) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (_) {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'ephemeral_dev_secret_key_change_in_prod';
}
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb+srv://khushaljangra013_db_user:KJIGJtITbR4L8Yvi@cluster0.ywucg6a.mongodb.net/digital_marketplace?retryWrites=true&w=majority&appName=Cluster0';
}

// Import Routes directly from backend modules
import authRoutes from '../backend/routes/authRoutes.js';
import projectRoutes from '../backend/routes/projectRoutes.js';
import orderRoutes from '../backend/routes/orderRoutes.js';
import couponRoutes from '../backend/routes/couponRoutes.js';
import reviewRoutes from '../backend/routes/reviewRoutes.js';
import supportRoutes from '../backend/routes/supportRoutes.js';
import analyticsRoutes from '../backend/routes/analyticsRoutes.js';
import featureRequestRoutes from '../backend/routes/featureRequestRoutes.js';
import projectRequestRoutes from '../backend/routes/projectRequestRoutes.js';
import affiliateRoutes from '../backend/routes/affiliateRoutes.js';
import flashSaleRoutes from '../backend/routes/flashSaleRoutes.js';
import customProjectRoutes from '../backend/routes/customProjectRoutes.js';

import connectDB from '../backend/config/db.js';

// Initialize connection
connectDB().catch((err) => console.error('MongoDB Atlas Serverless connect error:', err.message));

const app = express();

app.use(compression());
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

// Mount Routes
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

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serverless Vercel API is operational',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Project Marketplace Serverless API is operational.',
    version: '2.0.0',
  });
});

export default app;
