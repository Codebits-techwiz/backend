import mongoose from 'mongoose';

/**
 * Bookmark Mongoose Schema  (SRS requirement)
 * Collection: bookmarks
 * Allows students to bookmark a Tip or an Insight for later reference.
 * Unique index: one bookmark per user per referenced item.
 */
const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // 'tip' references Tip collection, 'insight' references Insight collection
    refType: {
      type: String,
      enum: ['tip', 'insight'],
      required: true,
    },
    // ObjectId of the referenced Tip or Insight document
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Optional student note on the bookmark
    note: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

// Prevent a user from bookmarking the same tip/insight twice
bookmarkSchema.index({ user: 1, refType: 1, refId: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
