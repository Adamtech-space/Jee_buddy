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
    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    // Update the profile
    const updatedProfile = await profileModel.updateProfile(profileId, {
      ...cleanedData,
      updated_at: new Date().toISOString(),
    });

    if (!updatedProfile) {
      throw new ApiError(404, 'Profile not found');
    }

    return updatedProfile;
  } catch (error) {
    console.error('Profile update error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, 'Failed to update profile: ' + error.message);
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

const getAllProfiles = async () => {
  try {
    return await profileModel.getAllProfiles();
  } catch (error) {
    throw new ApiError(400, 'Failed to fetch profiles');
  }
};

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  getAllProfiles
}; 