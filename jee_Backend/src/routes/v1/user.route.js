const express = require("express");
const router = express.Router();
const userController = require("../../controllers/user.controller");

router.route("/").post(userController.CreateUsers);


module.exports = router