const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const userService = require('../services/user.service');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const data = await userService.login(email, password);
  res.send(data);
});

const googleSignIn = catchAsync(async (req, res) => {
  const data = await userService.googleSignIn();
  res.send(data);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const response = await userService.forgotPassword(email);
  res.send(response);
});

const resetPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  const response = await userService.resetPassword(password);
  res.send(response);
});

const logout = catchAsync(async (req, res) => {
  const response = await userService.logout();
  res.send(response);
});

module.exports = {
  register,
  login,
  googleSignIn,
  forgotPassword,
  resetPassword,
  logout
}; 