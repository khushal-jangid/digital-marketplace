/**
 * Centralized API Error Handling Middleware
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `API Route Not Found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'SERVER_ERROR';

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
    code = 'INVALID_ID_FORMAT';
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    code = 'VALIDATION_ERROR';
  }

  // Handle Mongo Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A resource with this ${field} already exists.`;
    code = 'DUPLICATE_KEY_ERROR';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authorization token';
    code = 'INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authorization token has expired';
    code = 'TOKEN_EXPIRED';
  }

  // Log server errors for internal monitoring (omitting sensitive headers)
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err.stack || err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    code,
    message: statusCode >= 500 && isProduction ? 'An unexpected server error occurred.' : message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

export default {
  notFoundHandler,
  errorHandler,
};
