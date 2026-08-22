import mongoose from 'mongoose';

const downloadLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDownloadsAllowed: {
      type: Number,
      default: 5, // Limit downloads to 5 times per purchase
    },
    ipAddresses: [
      {
        type: String,
      },
    ],
    lastDownloadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate log tracking records per user-project-order tuple
downloadLogSchema.index({ user: 1, project: 1, order: 1 }, { unique: true });

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);
export default DownloadLog;
