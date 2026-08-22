import express from 'express';
import {
  syncCart,
  getAbandonedCarts,
  sendCartReminder,
  deleteAbandonedCart,
} from '../controllers/cartRecoveryController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public cart sync route (used by frontend CartContext)
router.post('/sync', syncCart);

// Admin-only abandoned cart management routes
router.get('/', protect, admin, getAbandonedCarts);
router.post('/:id/send-reminder', protect, admin, sendCartReminder);
router.delete('/:id', protect, admin, deleteAbandonedCart);

export default router;
