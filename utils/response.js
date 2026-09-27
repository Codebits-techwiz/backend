export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};
export const sendError = (res, statusCode, message, errors = null) => {
  if (message && message.includes('Cast to ObjectId failed')) {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  res.status(statusCode).json({ success: false, error: message, errors });
};