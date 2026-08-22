import express from 'express';
import {
  getCustomProjectSettings,
  updateCustomProjectSettings,
  submitCustomProject,
  requestCustomProjectAccess,
  getAllCustomProjects,
  updateCustomProjectStatus,
  deleteCustomProject,
} from '../controllers/customProjectController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/settings', getCustomProjectSettings);
router.post('/submit', submitCustomProject);
router.post('/request-access', requestCustomProjectAccess);

// Admin-only management routes
router.put('/settings', protect, admin, updateCustomProjectSettings);
router.get('/', protect, admin, getAllCustomProjects);
router.patch('/:id/status', protect, admin, updateCustomProjectStatus);
router.delete('/:id', protect, admin, deleteCustomProject);

export default router;
