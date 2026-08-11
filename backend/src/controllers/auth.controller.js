const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const logger = require('../utils/logger');
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

  // Auto-login on registration: mint the same access/refresh tokens and
  // cookies that login() issues, so the frontend can store the token,
  // update auth state, and redirect straight to the dashboard without
  // forcing the user through a separate login step.
  const { accessToken } = await generateTokensForUser(user);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Fire the verification email in the background instead of awaiting it
  // before responding. SMTP calls can be slow or hang (bad host/port,
  // network restrictions, wrong creds); blocking the response on it means
  // the user is already in Mongo but the frontend request — and therefore
  // the loading spinner — never resolves. Registration must succeed
  // (requirement 10) regardless of whether the email goes out.
  const verifyUrl = `${env.clientUrl}/verify-email/${verifyRawToken}`;
  const emailQueued = true;
  sendVerificationEmail(user.email, verifyUrl)
    .then((result) => {
      if (!result?.sent) {
        logger.warn(`Verification email not sent for ${user.email}: ${result?.reason}`);
      }
    })
    .catch((err) => {
      // sendVerificationEmail/sendEmail already catches internally, but this
      // guards against any future change reintroducing an unhandled rejection.
      logger.error(`Unexpected error sending verification email to ${user.email}:`, err.message);
    });

  return res
    .status(StatusCodes.CREATED)
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', user.refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        { user: sanitizeUser(user), accessToken, emailQueued },
        'Account created successfully.'
      )
    );
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
