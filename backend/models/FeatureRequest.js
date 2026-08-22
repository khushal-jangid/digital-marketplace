import mongoose from 'mongoose';

const featureRequestSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a feature title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description of the custom feature'],
    },
    bidAmount: {
      type: Number,
      required: [true, 'Please add a bid amount'],
      min: [0, 'Bid amount cannot be negative'],
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const FeatureRequest = mongoose.model('FeatureRequest', featureRequestSchema);
export default FeatureRequest;
