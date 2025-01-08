const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.smtp.auth.user,
    pass: config.email.smtp.auth.pass,
  },
  tls: {
    rejectUnauthorized: false
  }
});

/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch((error) => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env', error));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = {
    from: config.email.from,
    to,
    subject,
    text,
    html: text.replace(/\n/g, '<br>'),
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password - JEE Buddy';
  const resetPasswordUrl = `http://localhost:5173/reset-password?token=${token}`;
  const text = `
    Dear user,
    
    You have requested to reset your password for your JEE Buddy account.
    Please click on the following link to reset your password:
    
    ${resetPasswordUrl}
    
    This link will expire in 10 minutes.
    
    If you did not request a password reset, please ignore this email.
    
    Best regards,
    JEE Buddy Team
  `;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification - JEE Buddy';
  const verificationEmailUrl = `http://localhost:5173/verify-email?token=${token}`;
  const text = `
    Dear user,
    
    Thank you for registering with JEE Buddy!
    Please click on the following link to verify your email address:
    
    ${verificationEmailUrl}
    
    This link will expire in 10 minutes.
    
    If you did not create an account, please ignore this email.
    
    Best regards,
    JEE Buddy Team
  `;
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
}; 