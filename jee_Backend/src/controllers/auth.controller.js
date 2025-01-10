const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { login, refreshAuth, logout } = require('../services/auth.service');

const loginHandler = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, tokens } = await login(email, password);
  res.send({ user, tokens });
});

const logoutHandler = catchAsync(async (req, res) => {
  await logout(req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokenHandler = catchAsync(async (req, res) => {
  const tokens = await refreshAuth(req.body.refreshToken);
  res.send({ tokens });
});

module.exports = {
  loginHandler,
  logoutHandler,
  refreshTokenHandler,
}; 