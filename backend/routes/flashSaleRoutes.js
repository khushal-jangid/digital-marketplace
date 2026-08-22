import express from 'express';
import { getFlashSale, updateFlashSale, deleteFlashSale } from '../controllers/flashSaleController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getFlashSale);
router.put('/', protect, admin, updateFlashSale);
router.delete('/', protect, admin, deleteFlashSale);

export default router;
