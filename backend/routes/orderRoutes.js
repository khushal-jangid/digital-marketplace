import express from 'express';
import {
  checkout,
  verifyPayment,
  getMyPurchasedProjects,
  getDownloadHistory,
  getAllOrders,
  getOrderById,
  createQrOrder,
  freeDownloadOrder,
  verifyUtrOrder,
  rejectUtrOrder,
  refundOrder,
  deleteOrder,
  telegramWebhook,
  saveAbandonedLead,
  sendRecoveryEmails,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';
import { checkoutLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/checkout', protect, checkoutLimiter, checkout);
router.post('/verify', protect, checkoutLimiter, verifyPayment);
router.post('/qr-checkout', checkoutLimiter, createQrOrder);
router.post('/free-download', checkoutLimiter, freeDownloadOrder);
router.post('/abandoned-lead', saveAbandonedLead);
router.post('/send-recovery-emails', protect, admin, sendRecoveryEmails);
router.post('/telegram-webhook', telegramWebhook);
router.post('/verify-utr/:id', protect, admin, verifyUtrOrder);
router.post('/reject-utr/:id', protect, admin, rejectUtrOrder);
router.post('/refund/:id', protect, admin, refundOrder);
router.get('/my-orders', protect, getMyPurchasedProjects);
router.get('/my-purchases', protect, getMyPurchasedProjects);
router.get('/download-history', protect, getDownloadHistory);
router.get('/:id', protect, getOrderById);
router.get('/', protect, admin, getAllOrders);
router.delete('/:id', protect, admin, deleteOrder);

export default router;
