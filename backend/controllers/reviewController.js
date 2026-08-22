import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Project from '../models/Project.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

/**
 * @desc    Add review for a project
 * @route   POST /api/reviews
 * @access  Private
 */
export const addReview = async (req, res) => {
  const { projectId, rating, comment } = req.body;
  const userId = req.user._id;

  try {
    if (!isDbConnected()) {
      const project = mockDb.projects.find(p => p._id === projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Allow default user John Doe to review pre-unlocked items automatically, or check purchase
      const hasPurchased = req.user.email === 'user@marketplace.com' || mockDb.orders.some(
        (o) => o.user === userId && o.paymentStatus === 'paid' && o.items.some((i) => i.project === projectId)
      );

      if (!hasPurchased) {
        return res.status(403).json({
          success: false,
          message: 'Only users who purchased this project can leave a review.',
        });
      }

      const reviewExists = mockDb.reviews.some(r => r.user?._id === userId && r.project === projectId);
      if (reviewExists) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this project' });
      }

      const review = {
        _id: `rev_mock_${Date.now()}`,
        user: { _id: userId, name: req.user.name },
        project: projectId,
        rating: Number(rating),
        comment,
        createdAt: new Date()
      };

      mockDb.reviews.push(review);

      // Recalculate average rating in-memory
      const projectReviews = mockDb.reviews.filter(r => r.project === projectId);
      const avg = projectReviews.reduce((acc, curr) => acc + curr.rating, 0) / projectReviews.length;
      project.ratings = {
        average: Math.round(avg * 10) / 10,
        count: projectReviews.length
      };

      return res.status(201).json({ success: true, review });
    }

    // 1. Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 2. Verify user purchased this project
    const hasPurchased = await Order.findOne({
      user: userId,
      paymentStatus: 'paid',
      'items.project': projectId,
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Only users who purchased this project can leave a review.',
      });
    }

    // 3. Verify user hasn't already reviewed this project
    const reviewExists = await Review.findOne({ user: userId, project: projectId });
    if (reviewExists) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this project' });
    }

    // 4. Create review
    const review = await Review.create({
      user: userId,
      project: projectId,
      rating: Number(rating),
      comment,
    });

    // 5. Recalculate average rating and update Project
    const projectReviews = await Review.find({ project: projectId });
    const count = projectReviews.length;
    const avg = projectReviews.reduce((acc, curr) => acc + curr.rating, 0) / count;
    
    project.ratings = {
      average: Math.round(avg * 10) / 10,
      count: count,
    };
    await project.save();

    const populatedReview = await review.populate('user', 'name');

    res.status(201).json({ success: true, review: populatedReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all reviews for a project
 * @route   GET /api/reviews/project/:projectId
 * @access  Public
 */
export const getProjectReviews = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const reviews = mockDb.reviews.filter(r => r.project === req.params.projectId);
      return res.json({ success: true, count: reviews.length, reviews });
    }

    const reviews = await Review.find({ project: req.params.projectId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = async (req, res) => {
  try {
    if (!isDbConnected()) {
      mockDb.reviews = mockDb.reviews.filter(r => r._id !== req.params.id);
      return res.json({ success: true, message: 'Review deleted successfully' });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    const projectId = review.project;
    await review.deleteOne();

    // Recalculate average rating and update Project
    const projectReviews = await Review.find({ project: projectId });
    const count = projectReviews.length;
    let average = 0;
    if (count > 0) {
      const avg = projectReviews.reduce((acc, curr) => acc + curr.rating, 0) / count;
      average = Math.round(avg * 10) / 10;
    }
    
    await Project.findByIdAndUpdate(projectId, {
      ratings: { average, count }
    });

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all reviews across all projects (Admin only)
 * @route   GET /api/reviews
 * @access  Private/Admin
 */
export const getAllReviews = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, count: mockDb.reviews.length, reviews: mockDb.reviews });
    }

    const reviews = await Review.find()
      .populate('project', 'title')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
