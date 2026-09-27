import mongoose from 'mongoose';

/**
 * Category Mongoose Schema
 * Collection: categories
 * Serves both system default categories (owner = null, isDefault = true)
 * and user-created custom categories (owner = User ID, isDefault = false).
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Category type must be either income or expense']
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null for system defaults available to all users
    },
    icon: {
      type: String,
      default: 'tag'
    },
    color: {
      type: String,
      default: '#4F46E5'
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying by user owner & defaults
categorySchema.index({ owner: 1, type: 1 });
categorySchema.index({ isDefault: 1 });

export const Category = mongoose.model('Category', categorySchema);
