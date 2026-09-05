import express from 'express';
import { getPublicSettings, getAllSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/public', getPublicSettings);
router.get('/', protect, admin, getAllSettings);
router.post('/', protect, admin, updateSettings);

export default router;
