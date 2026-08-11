const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

const smtpPort = Number(env.smtp.port) || 587;

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: smtpPort,
  // Port 465 requires implicit TLS from the first byte of the connection.
  // Hardcoding this to `false` (as it was) makes nodemailer try STARTTLS on
  // a port that expects TLS immediately, so the handshake never completes —
  // the socket just sits open until it eventually times out. Ports 587/25
  // use STARTTLS (secure: false), so infer this from the port instead of
  // hardcoding it.
  secure: smtpPort === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  // Previously unset, which meant a firewalled/unreachable/misconfigured
  // SMTP host (e.g. Render blocking the port, wrong host, bad creds that
  // hang on AUTH) would hang the socket close to indefinitely. Fail fast
  // instead so callers get a rejected promise, not a stuck connection.
  connectionTimeout: 10_000, // time to establish the TCP connection
  greetingTimeout: 10_000, // time to receive the SMTP greeting
  socketTimeout: 15_000, // time for the whole exchange to complete
});

// Verify the SMTP connection once at boot (non-blocking) so misconfiguration
// shows up clearly in Render logs instead of silently failing on first use.
if (env.smtp.user) {
  transporter
    .verify()
    .then(() => logger.info('SMTP transporter verified and ready to send email'))
    .catch((err) => logger.error('SMTP transporter verification failed:', err.message));
} else {
  logger.warn('SMTP not configured (SMTP_USER missing) — emails will be skipped');
}

const sendEmail = async ({ to, subject, html }) => {
  if (!env.smtp.user) {
    // SMTP not configured yet (fine for local dev) — log instead of throwing
    logger.warn(`SMTP not configured. Skipping email to ${to}: ${subject}`);
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
    return { sent: true };
  } catch (err) {
    // Never let an email failure throw an unhandled rejection into a caller
    // that might be awaiting this inline on a request path — log it and
    // report failure back to the caller so it can decide what to do.
    logger.error(`Failed to send email to ${to} (${subject}):`, err.message);
    return { sent: false, reason: err.message };
  }
};

const sendVerificationEmail = (to, verifyUrl) =>
  sendEmail({
    to,
    subject: 'Verify your MindMitra account',
    html: `<p>Welcome to MindMitra. Please verify your email by clicking the link below:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>This link expires in 24 hours.</p>`,
  });

const sendPasswordResetEmail = (to, resetUrl) =>
  sendEmail({
    to,
    subject: 'Reset your MindMitra password',
    html: `<p>You requested a password reset. Click the link below to set a new password:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
  });

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
