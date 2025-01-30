const express = require('express');
const { validate } = require('../../middlewares/validate');
const { authValidation } = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const { auth } = require('../../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Protected routes (require authentication)
router.post('/logout', auth(), authController.logout);

module.exports = router; 