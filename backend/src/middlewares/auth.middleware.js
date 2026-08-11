const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User.model');

/**
 * Verifies the access token (Authorization: Bearer <token> or accessToken cookie),
 * attaches the authenticated user to req.user. Rejects if user is banned/inactive.
 */
const verifyJWT = asyncHandler(async (req, _res, next) => {
  const tokenFromHeader = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const token = req.cookies?.accessToken || tokenFromHeader;

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.accessTokenSecret);
  } catch (err) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired access token');
  }

  const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User no longer exists');
  }
  if (user.isBanned || !user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been suspended');
  }

  req.user = user;
  next();
});

module.exports = verifyJWT;
