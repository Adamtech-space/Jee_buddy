const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/config');
const { supabase } = require('../config/supabaseClient');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret
});

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in paise
 * @returns {Promise<Object>} Razorpay order
 */
const createOrder = async (amount) => {
  const options = {
    amount,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  return razorpay.orders.create(options);
};

/**
 * Verify Razorpay payment
 * @param {Object} params - Payment verification params
 * @returns {boolean} - Whether payment is valid
 */
const verifyPayment = (params) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = params;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(sign.toString())
    .digest("hex");

  return expectedSign === razorpay_signature;
};

/**
 * Get user's subscription status and chat count
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Subscription status and chat count
 */
const getSubscriptionStatus = async (userId) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('chat_count, is_subscribed')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Failed to get subscription status');
  }

  return {
    chatCount: profile.chat_count || 0,
    isSubscribed: profile.is_subscribed || false
  };
};

/**
 * Update user's subscription status
 * @param {string} userId - User ID
 * @param {boolean} isSubscribed - New subscription status
 */
const updateSubscriptionStatus = async (userId) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_subscribed: true,
      subscription_date: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error('Failed to update subscription status');
  }
};

/**
 * Increment user's chat count
 * @param {string} userId - User ID
 * @returns {Promise<number>} New chat count
 */
const incrementChatCount = async (userId) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('chat_count, is_subscribed')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Failed to get chat count');
  }

  // If subscribed, don't increment
  if (profile.is_subscribed) {
    return profile.chat_count;
  }

  const newCount = (profile.chat_count || 0) + 1;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ chat_count: newCount })
    .eq('id', userId);

  if (updateError) {
    throw new Error('Failed to update chat count');
  }

  return newCount;
};

module.exports = {
  createOrder,
  verifyPayment,
  getSubscriptionStatus,
  updateSubscriptionStatus,
  incrementChatCount
}; 