const profileModel = require('../models/profile.model');
const ApiError = require('../utils/ApiError');

const createProfile = async (profileData) => {
  try {
    return await profileModel.createProfile(profileData);
  } catch (error) {
    throw new ApiError(400, 'Failed to create profile');
  }
};

const getProfileById = async (profileId) => {
  try {
    const profile = await profileModel.getProfileById(profileId);
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }
    return profile;
  } catch (error) {
    throw new ApiError(400, 'Failed to fetch profile');
  }
};

const updateProfile = async (profileId, updateData) => {
  try {
    const profile = await profileModel.updateProfile(profileId, updateData);
    if (!profile) {
      throw new ApiError(404, 'Profile not found');
    }
    return profile;
  } catch (error) {
    throw new ApiError(400, 'Failed to update profile');
  }
};

const deleteProfile = async (profileId) => {
  try {
    const result = await profileModel.deleteProfile(profileId);
    if (!result) {
      throw new ApiError(404, 'Profile not found');
    }
    return result;
  } catch (error) {
    throw new ApiError(400, 'Failed to delete profile');
  }
};

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile
}; 