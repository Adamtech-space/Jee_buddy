const express = require('express');
const auth = require('../../middlewares/auth');
const booksController = require('../../controllers/books.controller');

const router = express.Router();

router
  .route('/')
  .get(auth(), booksController.getBooksList);

router
  .route('/:bookId')
  .get(auth(), booksController.getBookById);

module.exports = router; 