const { User } = require("../models/users.model");
const Bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const httpStatus = require("http-status");

const createUsers = async (req) => {
  let body = req.body;
  const { password } = body;
  const salt = await Bcrypt.genSalt(10);
  const hash = await Bcrypt.hash(password, salt);
  const datas = { ...body, ...{ password: hash } };
  const creation = await User.create(datas);
  return creation;
};

const login = async (req) => {
  let body = req.body;
  const { password, email } = body;
  let findByEmail = await signup.findOne({ email: email });
  if (!findByEmail) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email Not Found");
  }
  let comp = await Bcrypt.compare(password, findByEmail.password);
  if (!comp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password Incorrect");
  }
};

module.exports = { createUsers, login };
