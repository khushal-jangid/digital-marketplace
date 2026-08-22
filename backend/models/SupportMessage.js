import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
    },
    isAdminReply: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
export default SupportMessage;
