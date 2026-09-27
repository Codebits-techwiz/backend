export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Server Error' });
};