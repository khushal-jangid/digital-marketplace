import express from 'express';
import {
  validateCoupon,
  createCoupon,
  getCoupons,
  deleteCoupon,
  getLatestActiveCoupon,
  generateBugReward,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';
import { couponLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/latest-active', getLatestActiveCoupon);
router.post('/validate', validateCoupon);
router.post('/generate-bug-reward', couponLimiter, generateBugReward);

router.route('/')
  .get(protect, admin, getCoupons)
  .post(protect, admin, createCoupon);

router.route('/:id')
  .delete(protect, admin, deleteCoupon);

export default router;
