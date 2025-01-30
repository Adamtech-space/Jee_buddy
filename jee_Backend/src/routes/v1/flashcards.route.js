const express = require('express');
const { auth } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const flashcardValidation = require('../../validations/flashcard.validation');
const { 
  saveFlashCardController, 
  getFlashCardsController, 
  updateFlashCardController, 
  deleteFlashCardController 
} = require('../../controllers/flashcards.controller');

const router = express.Router();

router
  .route('/saveFlashCard')
  .post(auth(), validate(flashcardValidation.createFlashCard), saveFlashCardController);

router
  .route('/getFlashCards')
  .get(auth(), validate(flashcardValidation.getFlashCards), getFlashCardsController);

router
  .route('/updateFlashCard/:id')
  .put(auth(), validate(flashcardValidation.updateFlashCard), updateFlashCardController);

router
  .route('/deleteFlashCard/:id')
  .delete(auth(), validate(flashcardValidation.deleteFlashCard), deleteFlashCardController);

module.exports = router; 