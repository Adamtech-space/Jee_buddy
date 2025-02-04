const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { createProfile, getProfileById, updateProfile, deleteProfile } = require('../services/profile.service');

const createProfileController = catchAsync(async (req, res) => {
  const profile = await createProfile(req.body);
  res.status(httpStatus.CREATED).json({
    status: 'success',
    message: 'Profile created successfully',
    data: profile
  });
});

const getProfileController = catchAsync(async (req, res) => {
  const profile = await getProfileById(req.user.id);
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Profile retrieved successfully',
    data: profile
  });
});

const updateProfileController = catchAsync(async (req, res) => {
  const profile = await updateProfile(req.user.id, req.body);
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: profile
  });
});

const deleteProfileController = catchAsync(async (req, res) => {
  await deleteProfile(req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createProfileController,
  getProfileController,
  updateProfileController,
  deleteProfileController
}; 