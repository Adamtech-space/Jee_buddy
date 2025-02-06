const Joi = require('joi');

const createProfile = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone_number: Joi.string().allow(null),
    payment_status: Joi.string().default('pending'),
    total_tokens: Joi.number().default(0),
    current_plan_id: Joi.string().allow(null),
    next_billing_date: Joi.date().allow(null),
    days_remaining: Joi.number().default(0),
  }),
};
const updateProfile = {
  body: Joi.object()
    .keys({
      // Only allow the essential fields for subscription update
      payment_status: Joi.string()
        .valid('pending', 'completed', 'failed')
        .required(),
      current_plan_id: Joi.string().required(),
      days_remaining: Joi.number().min(0).required(),
    })
    .required()
    // Prevent any additional fields from being sent
    .unknown(false),
};

module.exports = {
  createProfile,
  updateProfile
}; 