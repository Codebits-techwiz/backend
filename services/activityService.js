import { ActivityLog } from '../models/ActivityLog.js';
import { Transaction } from '../models/Transaction.js';

/**
 * Write one activity entry.
 * Fire-and-forget: caller should NOT await this in the request path,
 * so a logging failure never breaks the real response.
 *
 * @param {string} userId   – the authenticated student's _id
 * @param {string} action   – 'view' | 'create' | 'edit'
 * @param {string} entityId – the Transaction _id
 */
export const logActivity = async (userId, action, entityId) => {
  try {
    await ActivityLog.create({ user: userId, action, entity: 'transaction', entityId, at: new Date() });
  } catch (err) {
    // Swallow logging errors – they must never fail the real request
    console.error('[ActivityLog] write error:', err.message);
  }
};

/**
 * Return the user's last 10 DISTINCT recently-touched transactions, newest first.
 *
 * Algorithm:
 *  1. Fetch the user's last 50 raw log rows (we over-fetch so we can deduplicate).
 *  2. Walk the array and keep only the first occurrence of each entityId (newest win).
 *  3. Stop once we have 10 unique entities.
 *  4. For each unique entityId, load the live Transaction document.
 *     Skip any that have been soft-deleted (deletedAt != null) or truly deleted.
 */
export const getRecentActivity = async (userId) => {
  // Fetch more than 10 so we still have 10 after dedup + deleted-tx filtering
  const logs = await ActivityLog.find({ user: userId })
    .sort({ at: -1 })
    .limit(50)
    .lean();

  // Deduplicate: keep the most recent log row per entityId
  const seen = new Set();
  const unique = [];
  for (const log of logs) {
    const key = log.entityId.toString();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(log);
    }
    if (unique.length === 10) break; // we only need 10 unique items
  }

  // Load the live transaction for each unique log entry
  const results = [];
  for (const log of unique) {
    const tx = await Transaction.findOne({ _id: log.entityId, user: userId, deletedAt: null })
      .populate('category', 'name icon color type')
      .lean();

    // Skip if the transaction was soft-deleted or hard-deleted since last view
    if (!tx) continue;

    results.push({
      logId: log._id,
      action: log.action,   // 'view' | 'create' | 'edit'
      at: log.at,
      transaction: tx,
    });
  }

  return results;
};
