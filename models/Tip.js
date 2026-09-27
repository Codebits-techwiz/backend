import mongoose from 'mongoose';

/**
 * Tip Mongoose Schema
 * Collection: tips
 * Stores rule-based personalized saving tips generated for students.
 */
const tipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    ruleType: {
      type: String,
      enum: ['spending_spike', 'budget_warning', 'savings_goal_at_risk'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    // Money stored as INTEGER cents
    potentialSavings: {
      type: Number,
      default: 0
    },
    month: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

export const Tip = mongoose.model('Tip', tipSchema);
