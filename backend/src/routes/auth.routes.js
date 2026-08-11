const express = require('express');
const authController = require('../controllers/auth.controller');
const verifyJWT = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validate.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validateRequest, authController.register);
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/logout', verifyJWT, authController.logout);
router.post('/refresh-token', authController.refreshAccessToken);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validateRequest, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/me', verifyJWT, authController.getMe);

module.exports = router;
