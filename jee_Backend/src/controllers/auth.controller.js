const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  const user = await authService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  res.send(user);
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.generateResetPasswordToken(email);
  res.status(httpStatus.OK).send({ message: 'Password reset email sent successfully' });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.status(httpStatus.OK).send({ message: 'Password reset successful' });
});

const googleAuth = catchAsync(async (req, res) => {
  const url = await authService.getGoogleOAuthUrl();
  res.send({ url });
});

const googleCallback = catchAsync(async (req, res) => {
  const { code } = req.query;
  const { user, tokens } = await authService.handleGoogleCallback(code);
  res.send({ user, tokens });
});

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleCallback,
}; 