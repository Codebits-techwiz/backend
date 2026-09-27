import mongoose from 'mongoose';

/**
 * Budget Mongoose Schema
 * Collection: budgets
 * Data Rule: Store limitAmount as INTEGER in cents.
 * Data Rule: Budgets use a month string "YYYY-MM".
 * Index Rule: Unique index on { user: 1, category: 1, month: 1 }
 */
const budgetSchema = new mongoose.Schema(
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
    // Format: "YYYY-MM" (e.g. "2026-09")
    month: {
      type: String,
      required: true,
      trim: true
    },
    // Money limit stored as INTEGER cents
    limitAmount: {
      type: Number,
      required: [true, 'Budget limit amount is required'],
      min: [1, 'Limit amount must be greater than 0']
    }
  },
  {
    timestamps: true
  }
);

// Enforce single budget per user per category per month
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
