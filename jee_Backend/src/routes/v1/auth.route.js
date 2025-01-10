const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/login', validate(authValidation.login), authController.loginHandler);
router.post('/refresh-token', validate(authValidation.refreshTokens), authController.refreshTokenHandler);
router.post('/logout', auth(), authController.logoutHandler);

module.exports = router; 