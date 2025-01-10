const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { saveFlashCard, getFlashCards, updateFlashCard, deleteFlashCard } = require('../models/flashcards.model');
const ApiError = require('../utils/ApiError');

const saveFlashCardController = catchAsync(async (req, res) => {
  const flashcard = await saveFlashCard(req.user.id, req.body);
  res.status(httpStatus.CREATED).json({
    status: 'success',
    message: 'Flash card created successfully',
    data: flashcard
  });
});

const getFlashCardsController = catchAsync(async (req, res) => {
  const { subject } = req.query;
  const flashcards = await getFlashCards(req.user.id, subject);
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Flash cards retrieved successfully',
    data: flashcards
  });
});

const updateFlashCardController = catchAsync(async (req, res) => {
  const flashcard = await updateFlashCard(req.user.id, req.params.id, req.body);
  if (!flashcard) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Flash card not found');
  }
  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Flash card updated successfully',
    data: flashcard
  });
});

const deleteFlashCardController = catchAsync(async (req, res) => {
  const result = await deleteFlashCard(req.user.id, req.params.id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Flash card not found');
  }
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  saveFlashCardController,
  getFlashCardsController,
  updateFlashCardController,
  deleteFlashCardController
}; 