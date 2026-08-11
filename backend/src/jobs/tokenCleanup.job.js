const cron = require('node-cron');
const User = require('../models/User.model');
const logger = require('../utils/logger');

// Runs daily at 3 AM — clears expired password reset / email verification tokens
const startTokenCleanupJob = () => {
  cron.schedule('0 3 * * *', async () => {
    try {
      const result = await User.updateMany(
        { passwordResetExpiry: { $lt: new Date() } },
        { $unset: { passwordResetToken: 1, passwordResetExpiry: 1 } }
      );
      logger.info(`Token cleanup job: cleared ${result.modifiedCount} expired reset tokens`);
    } catch (err) {
      logger.error('Token cleanup job failed', err.message);
    }
  });
};

module.exports = startTokenCleanupJob;
