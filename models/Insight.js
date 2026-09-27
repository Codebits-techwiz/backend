import mongoose from 'mongoose';

/**
 * Insight Mongoose Schema
 * Collection: insights
 * Stores AI-generated or template-fallback monthly spending narrative summaries.
 */
const insightSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Format YYYY-MM
    month: {
      type: String,
      required: true,
      trim: true
    },
    summaryText: {
      type: String,
      required: true
    },
    tipText: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['llm', 'template'],
      default: 'template'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

insightSchema.index({ user: 1, month: 1 }, { unique: true });

export const Insight = mongoose.model('Insight', insightSchema);
