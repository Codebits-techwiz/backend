import * as bookmarkService from '../services/bookmarkService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createBookmarkSchema, updateBookmarkSchema } from '../validators/bookmarkValidator.js';

/**
 * GET /api/bookmarks
 * Returns all bookmarks for the logged-in student, with populated ref.
 */
export const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await bookmarkService.getBookmarks(req.user.id);
    sendSuccess(res, 'Bookmarks retrieved successfully', bookmarks);
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message);
  }
};

/**
 * POST /api/bookmarks
 * Create a new bookmark. Validates ownership of the referenced tip/insight.
 */
export const createBookmark = async (req, res) => {
  try {
    const data = createBookmarkSchema.parse(req.body);
    const bookmark = await bookmarkService.createBookmark(req.user.id, data);
    sendSuccess(res, 'Bookmark created successfully', bookmark, 201);
  } catch (error) {
    // Zod errors have .errors array; duplicate key from Mongo has code 11000
    if (error.name === 'ZodError') return sendError(res, 400, 'Validation failed', error.errors);
    if (error.code === 11000) return sendError(res, 409, 'You have already bookmarked this item');
    sendError(res, error.statusCode || 500, error.message);
  }
};

/**
 * PATCH /api/bookmarks/:id
 * Edit the note on an existing bookmark (owner only).
 */
export const updateBookmark = async (req, res) => {
  try {
    const data = updateBookmarkSchema.parse(req.body);
    const bookmark = await bookmarkService.updateBookmark(req.user.id, req.params.id, data.note);
    sendSuccess(res, 'Bookmark updated successfully', bookmark);
  } catch (error) {
    if (error.name === 'ZodError') return sendError(res, 400, 'Validation failed', error.errors);
    sendError(res, error.statusCode || 500, error.message);
  }
};

/**
 * DELETE /api/bookmarks/:id
 * Delete a bookmark (owner only).
 */
export const deleteBookmark = async (req, res) => {
  try {
    await bookmarkService.deleteBookmark(req.user.id, req.params.id);
    sendSuccess(res, 'Bookmark deleted successfully');
  } catch (error) {
    sendError(res, error.statusCode || 404, error.message);
  }
};
