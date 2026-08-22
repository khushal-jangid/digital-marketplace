import express from 'express';
import {
  createFeatureRequest,
  getProjectFeatureRequests,
  upvoteFeatureRequest,
  getAllFeatureRequests,
  updateFeatureRequestStatus,
  deleteFeatureRequest,
} from '../controllers/featureRequestController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createFeatureRequest)
  .get(protect, admin, getAllFeatureRequests);

router.route('/:id')
  .patch(protect, admin, updateFeatureRequestStatus)
  .delete(protect, admin, deleteFeatureRequest);

router.get('/project/:projectId', getProjectFeatureRequests);
router.post('/:id/upvote', protect, upvoteFeatureRequest);

export default router;
