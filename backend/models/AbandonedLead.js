import mongoose from 'mongoose';

const abandonedLeadSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    items: [
      {
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Project',
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete leads older than 24 hours using MongoDB TTL index
abandonedLeadSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const AbandonedLead = mongoose.model('AbandonedLead', abandonedLeadSchema);
export default AbandonedLead;
