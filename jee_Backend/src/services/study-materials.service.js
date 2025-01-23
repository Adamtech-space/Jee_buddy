const studyMaterialsModel = require('../models/study-materials.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const createFolder = async (userId, data) => {
  try {
    return await studyMaterialsModel.createFolder(userId, data);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to create folder');
  }
};

const uploadFile = async (userId, data) => {
  try {
    return await studyMaterialsModel.uploadFile(userId, data);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload file');
  }
};

const getItems = async (userId, parentId, subject) => {
  try {
    // Debug: Log service layer parameters
    console.log('Service getItems called with:', { userId, parentId, subject });
    const items = await studyMaterialsModel.getItems(userId, parentId, subject);
    return items;
  } catch (error) {
    console.error('Service layer error:', error);
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    // Otherwise, wrap it in an ApiError
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.message || 'Failed to fetch items'
    );
  }
};

const deleteItem = async (userId, itemId) => {
  try {
    return await studyMaterialsModel.deleteItem(userId, itemId);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete item');
  }
};

const renameItem = async (userId, itemId, newName) => {
  try {
    return await studyMaterialsModel.renameItem(userId, itemId, newName);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to rename item');
  }
};

const getDownloadUrl = async (userId, itemId) => {
  try {
    return await studyMaterialsModel.getDownloadUrl(userId, itemId);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to get download URL');
  }
};

module.exports = {
  createFolder,
  uploadFile,
  getItems,
  deleteItem,
  renameItem,
  getDownloadUrl
}; 