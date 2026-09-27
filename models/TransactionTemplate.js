import mongoose from 'mongoose';

/**
 * TransactionTemplate (formerly "Bookmark")
 * Quick-entry reusable transaction templates saved by students.
 * Kept as an extra feature alongside the SRS Bookmark feature.
 */
const transactionTemplateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true, // stored in cents
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  description: {
    type: String,
    default: '',
  }
}, { timestamps: true });

export default mongoose.model('TransactionTemplate', transactionTemplateSchema);
