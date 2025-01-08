const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const subscriptionValidation = require('../../validations/subscription.validation');
const subscriptionController = require('../../controllers/subscription.controller');

const router = express.Router();

router
  .route('/order')
  .post(auth(), subscriptionController.createOrder);

router
  .route('/verify')
  .post(
    auth(),
    validate(subscriptionValidation.verifyPayment),
    subscriptionController.verifyPayment
  );

router
  .route('/status')
  .get(auth(), subscriptionController.checkSubscriptionStatus);

module.exports = router; 