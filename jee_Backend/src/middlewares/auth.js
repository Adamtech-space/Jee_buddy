const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const supabase = require('../config/supabaseClient');

const auth = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }

      const token = authHeader.substring(7);
      const payload = jwt.verify(token, config.jwt.secret);

      if (payload.type !== 'access') {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
      }

      console.log('Token payload:', payload); // Debug log

      // Get user from Supabase using UUID
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', payload.sub)
        .single();

      console.log('Supabase query result:', { user, error }); // Debug log

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
      }

      if (!user) {
        console.error('No user found for ID:', payload.sub);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        is_subscribed: user.is_subscribed,
        subscription_date: user.subscription_date
      };

      console.log('User data set in request:', req.user); // Debug log
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
      } else {
        next(error);
      }
    }
  };
};

module.exports = {
  auth
}; 