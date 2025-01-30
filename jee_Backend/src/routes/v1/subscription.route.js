const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const subscriptionValidation = require('../../validations/subscription.validation');
const subscriptionController = require('../../controllers/subscription.controller');

const router = express.Router();

router
  .route('/create-order')
  .post(
    auth(),
    validate(subscriptionValidation.createOrder),
    subscriptionController.createOrder
  );

router
  .route('/verify-payment')
  .post(
    auth(),
    validate(subscriptionValidation.verifyPayment),
    subscriptionController.verifyPayment
  );

router
  .route('/status')
  .get(auth(), subscriptionController.getStatus);

router
  .route('/increment-chat')
  .post(auth(), subscriptionController.incrementChatCount);

module.exports = router; 