import express from 'express';
import {
  validateCoupon,
  createCoupon,
  updateCoupon,
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
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

export default router;
