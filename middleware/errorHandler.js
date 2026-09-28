/**
 * Map technical errors to plain English before sending to the client.
 */
const FRIENDLY_MAP = {
  'Invalid ID format': 'Something went wrong with that request. Please refresh and try again.',
  'Server Error': 'Something went wrong on our side. Please try again in a moment.',
  'CastError': 'Something went wrong with that request. Please refresh and try again.',
};

const PATTERN_REPLACEMENTS = [
  [
    /^Category "(.+)" already exists$/i,
    'A category with that name already exists. Please choose another name.'
  ],
  [
    /^Cannot delete category "(.+)" because it has (\d+) active transaction/i,
    'This category still has transactions. Move them to another category first, then try deleting again.'
  ],
  [
    /^Cannot delete: (\d+) transaction\(s\) reference this category/i,
    'This category is still used by some transactions. Move those transactions first, then delete it.'
  ],
  [
    /Permission denied\. System default categories cannot be modified\./i,
    'Built-in categories can’t be edited. You can create your own instead.'
  ],
  [
    /Permission denied\. System default categories cannot be deleted\./i,
    'Built-in categories can’t be deleted.'
  ],
  [
    /^Invalid category ID/i,
    'Please choose a category from the list.'
  ],
  [
    /^CSV parsing failed/i,
    'We couldn’t read that CSV file. Please check the format and try again.'
  ],
  [
    /not found or does not belong to you/i,
    'We couldn’t find that item, or it doesn’t belong to your account.'
  ],
];

export function toFriendlyApiError(message) {
  if (!message || typeof message !== 'string') {
    return 'Something went wrong. Please try again.';
  }

  const trimmed = message.trim();
  if (FRIENDLY_MAP[trimmed]) return FRIENDLY_MAP[trimmed];

  for (const [pattern, replacement] of PATTERN_REPLACEMENTS) {
    if (pattern.test(trimmed)) return replacement;
  }

  return trimmed;
}

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: toFriendlyApiError('Invalid ID format')
    });
  }

  const status = err.statusCode || 500;
  const raw = err.message || 'Server Error';
  const friendly =
    status >= 500 && (!err.statusCode || raw === 'Server Error')
      ? toFriendlyApiError('Server Error')
      : toFriendlyApiError(raw);

  res.status(status).json({ success: false, error: friendly });
};
