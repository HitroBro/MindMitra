const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');

// Runs after an express-validator chain; converts validation errors into ApiError
const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Validation failed', errors.array());
  }
  next();
};

module.exports = validateRequest;
