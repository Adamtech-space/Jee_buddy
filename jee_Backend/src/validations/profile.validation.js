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
    days_remaining: Joi.number().default(0)
  })
};

const updateProfile = {
  body: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    phone_number: Joi.string().allow(null),
    payment_status: Joi.string(),
    total_tokens: Joi.number(),
    current_plan_id: Joi.string().allow(null),
    next_billing_date: Joi.date().allow(null),
    days_remaining: Joi.number()
  })
};

module.exports = {
  createProfile,
  updateProfile
}; 