const userModel = require("../models/users.model");
const ApiError = require("../utils/ApiError");
const Bcrypt = require("bcryptjs");
const httpStatus = require("http-status");

const createUsers = async (req) => {
  let body = req.body;
  const { password } = body;
  const salt = await Bcrypt.genSalt(10);
  const hash = await Bcrypt.hash(password, salt);
  const datas = { ...body, ...{ password: hash } };
  const creation = await userModel.create(datas);
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
