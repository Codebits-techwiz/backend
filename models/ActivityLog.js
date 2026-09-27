import mongoose from 'mongoose';

/**
 * ActivityLog Schema
 * Collection: activitylogs
 * Tracks when a user views, creates, or edits a transaction.
 *
 * Fields:
 *   user      – who performed the action
 *   action    – 'view' | 'create' | 'edit'
 *   entity    – always 'transaction' for now (extensible later)
 *   entityId  – the Transaction ObjectId
 *   at        – when it happened (indexed for fast recency queries)
 */
const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['view', 'create', 'edit'],
    required: true,
  },
  entity: {
    type: String,
    default: 'transaction',
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index: fast lookup of a user's recent activity sorted by time
activityLogSchema.index({ user: 1, at: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
