import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: [0, 'Item price cannot be negative'],
  },
  titleAtPurchase: {
    type: String,
    required: true,
    trim: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'An order must contain at least one item.',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
    },
    couponApplied: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'pending_verification', 'paid', 'fulfilled', 'failed', 'cancelled', 'refunded'],
        message: 'Invalid payment status: {VALUE}',
      },
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'gateway',
      trim: true,
    },
    transactionRef: {
      type: String,
      default: null,
      trim: true,
      sparse: true,
    },
    utrNumber: {
      type: String,
      default: null,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      default: null,
      trim: true,
    },
    contactEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    userEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: null,
      trim: true,
    },
    customerPhone: {
      type: String,
      default: null,
      trim: true,
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    referredByCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    includeSetupAssistance: {
      type: Boolean,
      default: false,
    },
    setupAssistancePrice: {
      type: Number,
      default: 0,
      min: [0, 'Setup assistance price cannot be negative'],
    },
    affiliateCredited: {
      type: Boolean,
      default: false,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-frequency queries
orderSchema.index({ user: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ 'items.project': 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
