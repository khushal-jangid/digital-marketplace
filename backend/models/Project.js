import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    trim: true,
  },
  fileKey: {
    type: String,
    default: '',
    trim: true,
  },
  fileName: {
    type: String,
    default: 'external-link',
    trim: true,
  },
  releaseNotes: {
    type: String,
    default: 'Initial release',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Original price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['source-code', 'templates', 'pdfs', 'graphics', 'datasets', 'others'],
      default: 'source-code',
      index: true,
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    previewUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    fileKey: {
      type: String,
      default: '',
      trim: true,
    },
    fileName: {
      type: String,
      default: 'external-link',
      trim: true,
    },
    fileSize: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    externalDownloadUrl: {
      type: String,
      default: '',
      trim: true,
    },
    upiId: {
      type: String,
      default: '7303354598@axl',
      trim: true,
    },
    versions: [versionSchema],
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot be more than 5'],
      },
      count: {
        type: Number,
        default: 0,
        min: [0, 'Rating count cannot be negative'],
      },
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: [0, 'Download count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-populate createdBy if missing
projectSchema.pre('validate', async function (next) {
  if (!this.createdBy) {
    try {
      const User = mongoose.model('User');
      const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
      if (adminUser) {
        this.createdBy = adminUser._id;
      }
    } catch (_) {}
  }
  next();
});

// Indexes for search and category filtering
projectSchema.index({ title: 'text', description: 'text', category: 'text' });
projectSchema.index({ category: 1, price: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ 'versions.fileKey': 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
