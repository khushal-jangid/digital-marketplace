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
      default: 5,
    },
    usedTokens: [
      {
        tokenHash: {
          type: String,
          required: true,
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
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

downloadLogSchema.index({ user: 1, project: 1, order: 1 }, { unique: true });

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);
export default DownloadLog;
