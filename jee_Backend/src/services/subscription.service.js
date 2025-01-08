const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/config');
const { createClient } = require('@supabase/supabase-js');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Initialize Supabase client with service role key
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * Create a subscription order
 * @param {Object} user
 * @returns {Promise<Object>}
 */
const createOrder = async (user) => {
  try {
    const options = {
      amount: 49900, // amount in paise (499 INR)
      currency: 'INR',
      receipt: `order_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
      },
    };

    const order = await razorpay.orders.create(options);

    // Record the order in the database
    const { error } = await supabase
      .from('subscription_payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: options.amount,
        status: 'created'
      });

    if (error) throw error;
    return order;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create order');
  }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} params
 * @returns {boolean}
 */
const verifyPaymentSignature = (params) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = params;

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(sign)
    .digest('hex');

  return expectedSign === razorpay_signature;
};

/**
 * Activate subscription for user
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const activateSubscription = async (userId) => {
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to check subscription');
  }

  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  if (existingSubscription) {
    // Update existing subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        is_active: true,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update subscription');
  } else {
    // Create new subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        is_active: true,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (error) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create subscription');
  }

  return { success: true };
};

/**
 * Check if user has active subscription
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
const checkSubscription = async (userId) => {
  // Check if user exists
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .single();

  if (userError) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user is in trial period (1 day from registration)
  const trialEndDate = new Date(new Date(user.created_at).getTime() + 24 * 60 * 60 * 1000);
  if (new Date() < trialEndDate) {
    return true;
  }

  // Check if user has active subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (subError && subError.code !== 'PGRST116') {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to check subscription');
  }

  if (subscription) {
    const currentDate = new Date();
    if (currentDate <= new Date(subscription.end_date)) {
      return true;
    }
    // Deactivate expired subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to deactivate expired subscription:', updateError);
    }
  }

  return false;
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  activateSubscription,
  checkSubscription,
}; 