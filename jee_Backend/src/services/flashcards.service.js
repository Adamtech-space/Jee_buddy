const flashcardsModel = require('../models/flashcards.model');
const ApiError = require('../utils/ApiError');

const saveFlashCard = async (userId, data) => {
  try {
    return await flashcardsModel.saveFlashCard(userId, data);
  } catch (error) {
    throw new ApiError(400, 'Failed to save flash card');
  }
};

const getFlashCards = async (userId, subject) => {
  try {
    return await flashcardsModel.getFlashCards(userId, subject);
  } catch (error) {
    throw new ApiError(400, 'Failed to fetch flash cards');
  }
};

const deleteFlashCard = async (userId, cardId) => {
  try {
    return await flashcardsModel.deleteFlashCard(userId, cardId);
  } catch (error) {
    throw new ApiError(400, 'Failed to delete flash card');
  }
};

const updateFlashCard = async (userId, cardId, data) => {
  try {
    return await flashcardsModel.updateFlashCard(userId, cardId, data);
  } catch (error) {
    throw new ApiError(400, 'Failed to update flash card');
  }
};

module.exports = {
  saveFlashCard,
  getFlashCards,
  deleteFlashCard,
  updateFlashCard
}; 