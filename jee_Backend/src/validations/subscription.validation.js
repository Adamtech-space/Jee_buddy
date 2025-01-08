const Joi = require('joi');

const verifyPayment = {
  body: Joi.object().keys({
    razorpay_payment_id: Joi.string().required(),
    razorpay_order_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
  }),
};

module.exports = {
  verifyPayment,
}; 