import mongoose from 'mongoose';

/**
 * TipAction Mongoose Schema
 * Collection: tipActions
 * Tracks student interactions with saving tips (pinned or dismissed).
 */
const tipActionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tip',
      required: true
    },
    action: {
      type: String,
      enum: ['pinned', 'dismissed'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

tipActionSchema.index({ user: 1, tip: 1 }, { unique: true });

export const TipAction = mongoose.model('TipAction', tipActionSchema);
