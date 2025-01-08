const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { subscriptionService } = require('../services/subscription.service');
const ApiError = require('../utils/ApiError');

const createOrder = catchAsync(async (req, res) => {
  const order = await subscriptionService.createOrder(req.user);
  res.status(httpStatus.CREATED).send(order);
});

const verifyPayment = catchAsync(async (req, res) => {
  const isValid = subscriptionService.verifyPaymentSignature(req.body);
  if (!isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment signature');
  }

  // Activate subscription
  await subscriptionService.activateSubscription(req.user.id);
  res.status(httpStatus.OK).send({ message: 'Payment verified and subscription activated' });
});

const checkSubscriptionStatus = catchAsync(async (req, res) => {
  const isSubscribed = await subscriptionService.checkSubscription(req.user.id);
  res.status(httpStatus.OK).send({ isSubscribed });
});

module.exports = {
  createOrder,
  verifyPayment,
  checkSubscriptionStatus,
}; 