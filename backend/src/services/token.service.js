const env = require('../config/env');

/**
 * Cookie options for access/refresh tokens.
 * httpOnly + secure(in prod) + sameSite protect against XSS/CSRF token theft.
 */
const accessTokenCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000, // 15 min
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const generateTokensForUser = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

module.exports = { accessTokenCookieOptions, refreshTokenCookieOptions, generateTokensForUser };
