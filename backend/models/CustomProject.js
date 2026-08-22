import mongoose from 'mongoose';

const customProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide your WhatsApp/phone number'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide project title or idea name'],
      trim: true,
    },
    category: {
      type: String,
      default: 'Full-Stack Web App',
    },
    techStack: {
      type: String,
      default: 'Not Specified',
    },
    targetBudget: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: String,
      default: 'Flexible',
    },
    referenceLinks: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Please provide detailed project requirements'],
    },
    payoutUpiId: {
      type: String,
      required: [true, 'Please provide your UPI ID to receive payments/payouts into your account'],
      trim: true,
    },
    entryFee: {
      type: Number,
      default: 50,
    },
    clientUpiId: {
      type: String,
      default: '',
      trim: true,
    },
    utrNumber: {
      type: String,
      required: [true, 'Please enter the 12-digit UPI Transaction/UTR ID for ₹50 fee'],
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending_verification', 'paid', 'rejected'],
      default: 'pending_verification',
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'accepted', 'in_progress', 'completed', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const CustomProject = mongoose.model('CustomProject', customProjectSchema);
export default CustomProject;
