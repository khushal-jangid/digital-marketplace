import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, admin, getDashboardAnalytics);

export default router;
