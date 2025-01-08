const catchAsync = require("../utils/catchAsync");
const userService = require("../services/user.service");

const CreateUsers = catchAsync(async (req, res) => {
  const data = await userService.createUsers(req);
  res.status(201).send(data);
});

module.exports = {
  CreateUsers,
};
