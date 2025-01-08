const { User } = require("../models/users.model");
const ApiError = require("../utils/apiError");
const httpStatus = require("http-status");

const createUser = async (userBody) => {
  try {
    const user = await User.createUser(userBody);
    return user;
  } catch (error) {
    if (error.message.includes('already registered')) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    throw error;
  }
};

const login = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
};

const googleSignIn = async () => {
  try {
    const data = await User.googleSignIn();
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Google sign-in failed');
  }
};

const forgotPassword = async (email) => {
  try {
    await User.resetPassword(email);
    return { message: 'Password reset email sent' };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset failed');
  }
};

const resetPassword = async (newPassword) => {
  try {
    const data = await User.updatePassword(newPassword);
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset failed');
  }
};

const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { message: 'Logged out successfully' };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Logout failed');
  }
};

module.exports = {
  createUser,
  login,
  googleSignIn,
  forgotPassword,
  resetPassword,
  logout
};
