import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Coupon from '../models/Coupon.js';
import FlashSale from '../models/FlashSale.js';
import Review from '../models/Review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedDevelopmentDatabase = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_SEED) {
    console.error('FATAL: Seeding is disabled in production to protect production data.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/project_marketplace';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to database for development seeding...');

    const adminEmail = process.env.DEV_ADMIN_EMAIL || 'dev-admin@example.com';
    const adminPassword = process.env.DEV_ADMIN_PASSWORD || 'DevAdmin@12345';

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Development Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      console.log(`Created Development Admin: ${adminEmail}`);
    }

    const testUserEmail = process.env.DEV_USER_EMAIL || 'dev-user@example.com';
    let regularUser = await User.findOne({ email: testUserEmail });
    if (!regularUser) {
      regularUser = await User.create({
        name: 'Test Customer',
        email: testUserEmail,
        password: process.env.DEV_USER_PASSWORD || 'DevUser@12345',
        role: 'user',
      });
      console.log(`Created Development User: ${testUserEmail}`);
    }

    // Demo Project
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      const demoProject = await Project.create({
        title: 'Full-Stack AI SaaS Starter Kit (Next.js 14 + Tailwind + Stripe + Gemini AI)',
        description: `Production-ready AI SaaS starter boilerplate built with Next.js 14 App Router, TypeScript, Tailwind CSS, Stripe Subscriptions & Webhooks, and Google Gemini AI Pro integration.`,
        price: 299,
        originalPrice: 599,
        category: 'source-code',
        techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Gemini AI', 'Stripe', 'Node.js'],
        previewUrls: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        ],
        fileKey: 'ai-saas-starter.zip',
        fileName: 'ai-saas-starter-v1.zip',
        fileSize: '3.4 MB',
        createdBy: adminUser._id,
        ratings: { average: 5.0, count: 1 },
        downloadCount: 14,
        versions: [
          {
            version: 'v1.0.0',
            fileKey: 'ai-saas-starter.zip',
            fileName: 'ai-saas-starter-v1.zip',
            releaseNotes: 'Initial development release',
          },
        ],
      });

      const securePath = path.join(__dirname, '..', 'uploads', 'secure', 'ai-saas-starter.zip');
      if (!fs.existsSync(path.dirname(securePath))) {
        fs.mkdirSync(path.dirname(securePath), { recursive: true });
      }
      fs.writeFileSync(securePath, 'Development Mock Source Code for Full-Stack AI SaaS Starter Kit');

      await Review.create({
        user: regularUser._id,
        project: demoProject._id,
        rating: 5,
        comment: 'Great development starter kit!',
      });
    }

    // Coupons
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      await Coupon.create({
        code: 'WELCOME30',
        discountType: 'percentage',
        discountValue: 30,
        minOrderAmount: 200,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 100,
      });

      await Coupon.create({
        code: 'FLASH35',
        discountType: 'percentage',
        discountValue: 35,
        minOrderAmount: 150,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
      });
    }

    console.log('Development seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDevelopmentDatabase();
