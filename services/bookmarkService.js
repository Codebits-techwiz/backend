import { Bookmark } from '../models/Bookmark.js';
import { Tip } from '../models/Tip.js';
import { Insight } from '../models/Insight.js';

/**
 * Resolve the model class and populate path for a given refType.
 * WHY: We use two separate collections (tips / insights), so we need to
 * know which one to query before saving and which to populate on read.
 */
const resolveRef = (refType) => {
  if (refType === 'tip') return { Model: Tip, populatePath: 'tip' };
  if (refType === 'insight') return { Model: Insight, populatePath: 'insight' };
  throw new Error('Invalid refType');
};

/**
 * Get all bookmarks for the authenticated student.
 * Populates the referenced tip or insight inline.
 */
export const getBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({ user: userId }).sort({ createdAt: -1 }).lean();

  // Manually populate: tips and insights are in different collections
  const populated = await Promise.all(
    bookmarks.map(async (bm) => {
      const { Model, populatePath } = resolveRef(bm.refType);
      const ref = await Model.findOne({ _id: bm.refId, user: userId }).lean();
      return { ...bm, ref, [populatePath]: ref }; // embed under both 'ref' and 'tip'/'insight'
    })
  );

  return populated;
};

/**
 * Create a new bookmark.
 * SECURITY: Verifies the referenced tip/insight belongs to req.user before saving.
 */
export const createBookmark = async (userId, data) => {
  const { refType, refId, note } = data;
  const { Model } = resolveRef(refType);

  // Ownership check — the tip/insight must belong to this user
  const refDoc = await Model.findOne({ _id: refId, user: userId });
  if (!refDoc) {
    const err = new Error(`${refType.charAt(0).toUpperCase() + refType.slice(1)} not found or does not belong to you`);
    err.statusCode = 404;
    throw err;
  }

  // unique index on {user, refType, refId} will throw if duplicate
  const bookmark = await Bookmark.create({ user: userId, refType, refId, note });
  return { ...bookmark.toObject(), ref: refDoc };
};

/**
 * Update the note field of an existing bookmark.
 * Only the owner can update their bookmark.
 */
export const updateBookmark = async (userId, bookmarkId, note) => {
  const bookmark = await Bookmark.findOneAndUpdate(
    { _id: bookmarkId, user: userId },
    { note },
    { new: true, runValidators: true }
  );
  if (!bookmark) {
    const err = new Error('Bookmark not found');
    err.statusCode = 404;
    throw err;
  }
  return bookmark;
};

/**
 * Delete a bookmark. Owner-only.
 */
export const deleteBookmark = async (userId, bookmarkId) => {
  const bookmark = await Bookmark.findOneAndDelete({ _id: bookmarkId, user: userId });
  if (!bookmark) {
    const err = new Error('Bookmark not found');
    err.statusCode = 404;
    throw err;
  }
};
