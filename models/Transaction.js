import mongoose from 'mongoose';

/**
 * Transaction Mongoose Schema
 * Collection: transactions
 * Data Rule: Amount stored as INTEGER in cents/paisa.
 * Data Rule: Soft delete using `deletedAt`. Queries filter `deletedAt: null`.
 * Indexes: { user: 1, date: -1 }, { user: 1, category: 1, date: -1 }
 */
const transactionSchema = new mongoose.Schema(
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
    // Money stored as INTEGER cents (e.g. $15.50 -> 1550)
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [1, 'Amount must be greater than 0']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringRule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringRule',
      default: null
    },
    aiSuggestedCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: {
      type: String,
      default: ''
    },
    deletedAt: {
      type: Date,
      default: null, // Soft delete field. null means active transaction.
      index: true
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

// Performance compound indexes required by specification
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
