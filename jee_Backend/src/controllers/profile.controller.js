const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { createProfile, getProfileById, updateProfile, deleteProfile, getAllProfiles } = require('../services/profile.service');

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
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Log the incoming data for debugging
    console.log('Updating profile with data:', updateData);

    const profile = await updateProfile(userId, updateData);

    res.status(httpStatus.OK).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Profile update controller error:', error);
    res.status(httpStatus.BAD_REQUEST).json({
      status: 'error',
      message: error.message || 'Failed to update profile',
    });
  }
});

const deleteProfileController = catchAsync(async (req, res) => {
  await deleteProfile(req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const getAllProfilesController = catchAsync(async (req, res) => {
  const profiles = await getAllProfiles();
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Profiles retrieved successfully',
    data: profiles
  });
});

module.exports = {
  createProfileController,
  getProfileController,
  updateProfileController,
  deleteProfileController,
  getAllProfilesController
}; 