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


      // Get user from Supabase using UUID
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', payload.sub)
        .single();


      if (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
      }

      if (!user) {
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

      next();
    } catch (error) {
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