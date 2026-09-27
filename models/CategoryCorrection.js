import mongoose from 'mongoose';

/**
 * CategoryCorrection Mongoose Schema
 * Collection: categoryCorrections
 * Stores user-defined category overrides to train the Naive Bayes / keyword categorization engine.
 */
const categoryCorrectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    descriptionKeyword: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    correctedCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    count: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

categoryCorrectionSchema.index({ user: 1, descriptionKeyword: 1 }, { unique: true });

export const CategoryCorrection = mongoose.model('CategoryCorrection', categoryCorrectionSchema);
