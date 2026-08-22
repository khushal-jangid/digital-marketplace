import express from 'express';
import {
  getAffiliateStats,
  requestAffiliatePayout,
  getAllAffiliatePayouts,
} from '../controllers/affiliateController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getAffiliateStats);
router.post('/payout-request', protect, requestAffiliatePayout);
router.get('/payouts', protect, admin, getAllAffiliatePayouts);

export default router;
