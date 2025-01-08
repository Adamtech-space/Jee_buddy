const supabase = require('../config/supabaseClient');
const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth; 