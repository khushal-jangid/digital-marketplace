import mongoose from 'mongoose';

/**
 * Check if mongoose is actively connected (readyState === 1).
 * Always reflects the real connection state — there is no way to force
 * fake/mock data on, in any environment. Since server.js now refuses to
 * start at all when the real database can't be reached, this will be
 * true whenever the app is actually running.
 */
export const isDbConnected = () => mongoose.connection.readyState === 1;

export const mockProjects = [
  {
    _id: 'demo_ai_saas_project',
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
    createdBy: 'dev_admin_id',
    ratings: { average: 5.0, count: 1 },
    downloadCount: 14,
    createdAt: new Date(),
    versions: [
      {
        version: 'v1.0.0',
        fileKey: 'ai-saas-starter.zip',
        fileName: 'ai-saas-starter-v1.zip',
        releaseNotes: 'Initial release',
      },
    ],
  },
];

// In-Memory state for development/testing sandbox operations only
export const mockDb = {
  users: [],
  projects: [...mockProjects],
  orders: [],
  coupons: [
    {
      _id: 'coupon_flash35',
      code: 'FLASH35',
      discountType: 'percentage',
      discountValue: 35,
      minOrderAmount: 0,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usedCount: 0,
      usageLimit: null,
      isActive: true,
      targetProject: null,
      targetProjectTitle: 'All Projects',
    },
    {
      _id: 'coupon_diwali40',
      code: 'DIWALI40',
      discountType: 'percentage',
      discountValue: 40,
      minOrderAmount: 0,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usedCount: 0,
      usageLimit: null,
      isActive: true,
      targetProject: null,
      targetProjectTitle: 'All Projects',
    },
    {
      _id: 'coupon_welcome30',
      code: 'WELCOME30',
      discountType: 'percentage',
      discountValue: 30,
      minOrderAmount: 200,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usedCount: 0,
      usageLimit: 100,
      isActive: true,
    },
    {
      _id: 'coupon_cart10',
      code: 'CART10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usedCount: 0,
      usageLimit: 1000,
      isActive: true,
    },
  ],
  reviews: [],
  support: [],
  downloads: [],
  featureRequests: [],
};

export default mockDb;
