const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { accessTokenCookieOptions, refreshTokenCookieOptions, generateTokensForUser } = require('../services/token.service');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpiry;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  return obj;
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'An account with this email already exists');
  }

  // Admin accounts are never created through public registration
  const safeRole = ['student', 'volunteer', 'counselor'].includes(role) ? role : 'student';

  const user = new User({ name, email, passwordHash: password, role: safeRole });
  const verifyRawToken = user.generateEmailVerificationToken();
  await user.save();

  const verifyUrl = `${env.clientUrl}/verify-email/${verifyRawToken}`;
  await sendVerificationEmail(user.email, verifyUrl);

  return res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, sanitizeUser(user), 'Account created. Please check your email to verify your account.'));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }
  if (user.isBanned || !user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'This account has been suspended');
  }

  const { accessToken, refreshToken } = await generateTokensForUser(user);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { user: sanitizeUser(user), accessToken }, 'Login successful'));
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res
    .clearCookie('accessToken', accessTokenCookieOptions)
    .clearCookie('refreshToken', refreshTokenCookieOptions)
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, 'Logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingToken, env.refreshTokenSecret);
  } catch (err) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== incomingToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is invalid or has been revoked');
  }

  const { accessToken, refreshToken } = await generateTokensForUser(user);

  res
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { accessToken }, 'Access token refreshed'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way to avoid leaking whether an email is registered
  if (user) {
    const rawToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, null, 'If that email is registered, a reset link has been sent.'));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpiry');

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password reset link is invalid or has expired');
  }

  user.passwordHash = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshToken = undefined; // force re-login everywhere
  await user.save();

  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Password has been reset. Please log in.'));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpiry');

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Verification link is invalid or has expired');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, null, 'Email verified successfully'));
});

const getMe = asyncHandler(async (req, res) => {
  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, sanitizeUser(req.user), 'Current user fetched'));
});

module.exports = {
  register,
  login,
  logout,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  sanitizeUser,
};
