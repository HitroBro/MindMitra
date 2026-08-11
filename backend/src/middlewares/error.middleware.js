const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // Normalize Mongoose / JWT / unexpected errors into ApiError shape
    const statusCode =
      error.statusCode || (error.name === 'ValidationError' ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  if (error.statusCode >= 500) {
    logger.error(error.message, { path: req.originalUrl, stack: error.stack });
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    ...(env.nodeEnv === 'development' ? { stack: error.stack } : {}),
  });
};

module.exports = errorMiddleware;
