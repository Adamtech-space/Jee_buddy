const express = require('express');
const { auth } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const profileValidation = require('../../validations/profile.validation');
const {
  createProfileController,
  getProfileController,
  updateProfileController,
  deleteProfileController
} = require('../../controllers/profile.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(profileValidation.createProfile), createProfileController)
  .get(auth(), getProfileController)
  .put(auth(), validate(profileValidation.updateProfile), updateProfileController)
  .delete(auth(), deleteProfileController);

module.exports = router; 