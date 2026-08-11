const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');

/**
 * Restricts access to the given roles. Must run AFTER verifyJWT.
 * This is the ONLY source of truth for authorization — frontend
 * route guards are UX convenience only and are never trusted.
 *
 * Usage: router.get('/admin/x', verifyJWT, authorizeRoles('admin'), handler)
 */
const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');
  }
  if (!allowedRoles.includes(req.user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = authorizeRoles;
