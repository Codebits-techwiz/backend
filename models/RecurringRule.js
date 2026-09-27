import mongoose from 'mongoose';

/**
 * RecurringRule Mongoose Schema
 * Collection: recurringRules
 * Defines templates for automated recurring allowances and subscription charges.
 */
const recurringRuleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    // Stored as INTEGER cents
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true,
      default: 'monthly'
    },
    nextRunDate: {
      type: Date,
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const RecurringRule = mongoose.model('RecurringRule', recurringRuleSchema);
