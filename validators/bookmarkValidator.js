import { z } from 'zod';

// Zod validator for creating a new bookmark
export const createBookmarkSchema = z.object({
  refType: z.enum(['tip', 'insight'], {
    required_error: 'refType must be either "tip" or "insight"',
  }),
  refId: z.string().min(1, 'refId (ObjectId of the tip or insight) is required'),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional().default(''),
});

// Zod validator for editing a bookmark's note only
export const updateBookmarkSchema = z.object({
  note: z.string().max(500, 'Note cannot exceed 500 characters'),
});
