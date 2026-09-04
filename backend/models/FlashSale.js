import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: 'Get Flat 35% OFF on all Full-Stack & Developer Templates!',
    },
    subtitle: {
      type: String,
      default: 'Use coupon code at checkout for instant discount across the entire catalog.',
    },
    promoCode: {
      type: String,
      default: 'FLASH35',
      uppercase: true,
      trim: true,
    },
    discountPercentage: {
      type: Number,
      default: 35,
      min: 1,
      max: 100,
    },
    endTime: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    targetProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    targetProjectTitle: {
      type: String,
      default: 'All Projects',
    },
    badge: {
      type: String,
      default: '⚡ FLASH DEAL',
      trim: true,
    },
    festivalTheme: {
      type: String,
      default: 'flash', // 'diwali', 'holi', 'republic_day', 'independence_day', 'new_year', 'eid', 'flash', 'custom'
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);
export default FlashSale;
