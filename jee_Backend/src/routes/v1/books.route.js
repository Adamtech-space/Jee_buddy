const express = require('express');
const booksController = require('../../controllers/books.controller');

const router = express.Router();

router
  .route('/')
  .get(booksController.getBooksList);

router
  .route('/:bookId')
  .get(booksController.getBookById);

module.exports = router; 