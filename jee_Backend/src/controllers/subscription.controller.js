const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { subscriptionService } = require('../services/subscription.service');
const ApiError = require('../utils/ApiError');

const createOrder = catchAsync(async (req, res) => {
  const order = await subscriptionService.createOrder(req.body.amount);
  res.status(httpStatus.CREATED).send(order);
});

const verifyPayment = catchAsync(async (req, res) => {
  const isValid = subscriptionService.verifyPayment(req.body);
  if (!isValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment signature');
  }

  await subscriptionService.updateSubscriptionStatus(req.user.id);
  res.status(httpStatus.OK).send({ success: true });
});

const getStatus = catchAsync(async (req, res) => {
  const status = await subscriptionService.getSubscriptionStatus(req.user.id);
  res.status(httpStatus.OK).send(status);
});

const incrementChatCount = catchAsync(async (req, res) => {
  const newCount = await subscriptionService.incrementChatCount(req.user.id);
  res.status(httpStatus.OK).send({ chatCount: newCount });
});

module.exports = {
  createOrder,
  verifyPayment,
  getStatus,
  incrementChatCount,
}; 