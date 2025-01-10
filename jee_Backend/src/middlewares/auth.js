const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config/config');
const { User } = require('../models/users.model');
const ApiError = require('../utils/ApiError');
const { Token } = require('../models/auth.model');

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

      const user = await User.findById(payload.sub);
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
      }

      // Check if token is blacklisted
      const tokenDoc = await Token.findOne({
        token,
        type: 'access',
        user: user._id,
        blacklisted: true,
      });

      if (tokenDoc) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Token has been blacklisted');
      }

      req.user = user;
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