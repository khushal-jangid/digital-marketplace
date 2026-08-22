import express from 'express';
import {
  addReview,
  getProjectReviews,
  deleteReview,
  getAllReviews,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getAllReviews)
  .post(protect, addReview);
router.get('/project/:projectId', getProjectReviews);
router.delete('/:id', protect, deleteReview);

export default router;
