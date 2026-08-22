import FeatureRequest from '../models/FeatureRequest.js';
import Order from '../models/Order.js';
import Project from '../models/Project.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

/**
 * @desc    Submit a new feature extension request
 * @route   POST /api/feature-requests
 * @access  Private
 */
export const createFeatureRequest = async (req, res) => {
  const { projectId, title, description, bidAmount } = req.body;
  const userId = req.user._id;

  try {
    if (!isDbConnected()) {
      const project = mockDb.projects.find(p => p._id === projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      // Verify purchase in mock database
      const hasPurchased = req.user.email === 'user@marketplace.com' || mockDb.orders.some(
        (o) => o.user === userId && o.paymentStatus === 'paid' && o.items.some((i) => i.project === projectId)
      );

      if (!hasPurchased) {
        return res.status(403).json({
          success: false,
          message: 'Only verified buyers can request custom feature extensions.',
        });
      }

      const requestObj = {
        _id: `req_mock_${Date.now()}`,
        project: projectId,
        user: { _id: userId, name: req.user.name },
        title,
        description,
        bidAmount: Number(bidAmount),
        upvotes: [],
        status: 'pending',
        createdAt: new Date(),
      };

      mockDb.featureRequests.push(requestObj);
      return res.status(201).json({ success: true, featureRequest: requestObj });
    }

    // DB Mode
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify purchase
    const hasPurchased = await Order.findOne({
      user: userId,
      paymentStatus: 'paid',
      'items.project': projectId,
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Only verified buyers can request custom feature extensions.',
      });
    }

    const featureRequest = await FeatureRequest.create({
      project: projectId,
      user: userId,
      title,
      description,
      bidAmount: Number(bidAmount),
      upvotes: [],
    });

    const populatedRequest = await featureRequest.populate('user', 'name');

    res.status(201).json({ success: true, featureRequest: populatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all feature requests for a project
 * @route   GET /api/feature-requests/project/:projectId
 * @access  Public
 */
export const getProjectFeatureRequests = async (req, res) => {
  const { projectId } = req.params;

  try {
    if (!isDbConnected()) {
      const requests = mockDb.featureRequests
        .filter((r) => r.project === projectId)
        .sort((a, b) => b.upvotes.length - a.upvotes.length);

      return res.json({ success: true, count: requests.length, featureRequests: requests });
    }

    const requests = await FeatureRequest.find({ project: projectId })
      .populate('user', 'name')
      .sort({ upvotes: -1, createdAt: -1 });

    // Since upvotes field is an array, MongoDB sort by upvotes field will sort by size.
    // However, JS sort handles it more predictably just in case:
    requests.sort((a, b) => b.upvotes.length - a.upvotes.length);

    res.json({ success: true, count: requests.length, featureRequests: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle upvote for a feature request
 * @route   POST /api/feature-requests/:id/upvote
 * @access  Private
 */
export const upvoteFeatureRequest = async (req, res) => {
  const requestId = req.params.id;
  const userId = req.user._id;

  try {
    if (!isDbConnected()) {
      const requestObj = mockDb.featureRequests.find((r) => r._id === requestId);
      if (!requestObj) {
        return res.status(404).json({ success: false, message: 'Feature request not found' });
      }

      const upvoteIndex = requestObj.upvotes.indexOf(userId);
      if (upvoteIndex > -1) {
        requestObj.upvotes.splice(upvoteIndex, 1); // remove upvote
      } else {
        requestObj.upvotes.push(userId); // add upvote
      }

      return res.json({ success: true, featureRequest: requestObj });
    }

    // DB Mode
    const featureRequest = await FeatureRequest.findById(requestId);
    if (!featureRequest) {
      return res.status(404).json({ success: false, message: 'Feature request not found' });
    }

    const upvoteIndex = featureRequest.upvotes.indexOf(userId);
    if (upvoteIndex > -1) {
      featureRequest.upvotes.splice(upvoteIndex, 1);
    } else {
      featureRequest.upvotes.push(userId);
    }

    await featureRequest.save();
    const populatedRequest = await featureRequest.populate('user', 'name');

    res.json({ success: true, featureRequest: populatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all feature requests (Admin only)
 * @route   GET /api/feature-requests
 * @access  Private/Admin
 */
export const getAllFeatureRequests = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, count: mockDb.featureRequests.length, featureRequests: mockDb.featureRequests });
    }

    const requests = await FeatureRequest.find()
      .populate('user', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, featureRequests: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update feature request status (Admin only)
 * @route   PATCH /api/feature-requests/:id
 * @access  Private/Admin
 */
export const updateFeatureRequestStatus = async (req, res) => {
  const { status } = req.body;

  try {
    if (!isDbConnected()) {
      const requestObj = mockDb.featureRequests.find((r) => r._id === req.params.id);
      if (!requestObj) {
        return res.status(404).json({ success: false, message: 'Feature request not found' });
      }
      requestObj.status = status;
      return res.json({ success: true, featureRequest: requestObj });
    }

    const requestObj = await FeatureRequest.findById(req.params.id);
    if (!requestObj) {
      return res.status(404).json({ success: false, message: 'Feature request not found' });
    }

    requestObj.status = status;
    await requestObj.save();

    const populated = await requestObj.populate([
      { path: 'user', select: 'name email' },
      { path: 'project', select: 'title' }
    ]);

    res.json({ success: true, featureRequest: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a feature request (Admin only)
 * @route   DELETE /api/feature-requests/:id
 * @access  Private/Admin
 */
export const deleteFeatureRequest = async (req, res) => {
  const { id } = req.params;

  try {
    if (!isDbConnected()) {
      mockDb.featureRequests = mockDb.featureRequests.filter((r) => r._id !== id);
      return res.json({ success: true, message: 'Feature request deleted successfully' });
    }

    const requestObj = await FeatureRequest.findById(id);
    if (!requestObj) {
      return res.status(404).json({ success: false, message: 'Feature request not found' });
    }

    await requestObj.deleteOne();
    res.json({ success: true, message: 'Feature request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

