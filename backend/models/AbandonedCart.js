import mongoose from 'mongoose';

const abandonedCartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    email: {
      type: String,
      required: [true, 'Email is required for abandoned cart tracking'],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: 'Developer',
    },
    items: [
      {
        projectId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        licenseType: { type: String, default: 'personal' },
        category: { type: String, default: 'source-code' },
      },
    ],
    cartTotal: {
      type: Number,
      required: true,
    },
    recoveryEmailSent: {
      type: Boolean,
      default: false,
    },
    recoveryEmailSentAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['abandoned', 'recovered', 'expired'],
      default: 'abandoned',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const AbandonedCart = mongoose.model('AbandonedCart', abandonedCartSchema);
export default AbandonedCart;
