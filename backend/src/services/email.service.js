const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: Number(env.smtp.port) || 587,
  secure: false,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

const sendEmail = async ({ to, subject, html }) => {
  if (!env.smtp.user) {
    // SMTP not configured yet (fine for local dev) — log instead of throwing
    logger.warn(`SMTP not configured. Skipping email to ${to}: ${subject}`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, html });
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
