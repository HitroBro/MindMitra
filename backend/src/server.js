const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { initSocket } = require('./socket');
const startTokenCleanupJob = require('./jobs/tokenCleanup.job');
const autoCompleteJob = require('./jobs/autoCompleteAppointments.job');

const httpServer = http.createServer(app);
initSocket(httpServer);

const start = async () => {
  await connectDB();
  startTokenCleanupJob();
  autoCompleteJob.start();

  httpServer.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.port} is already in use. Exiting.`);
      process.exit(1);
    }
    logger.error('HTTP server error', err);
  });

  httpServer.listen(env.port, () => {
    logger.info(`MindMitra API listening on port ${env.port} [${env.nodeEnv}]`);
  });
};

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

start();

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down server');
  httpServer.close(() => process.exit(0));
});
