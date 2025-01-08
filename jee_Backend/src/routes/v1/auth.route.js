const express = require('express');
const auth = require('../../middlewares/auth');
const authController = require('../../controllers/auth.controller');
const { authLimiter } = require('../../middlewares/rateLimiter');

const router = express.Router();

// Apply rate limiting to auth endpoints
router.use(authLimiter);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleSignIn);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', auth, authController.logout);

module.exports = router; 