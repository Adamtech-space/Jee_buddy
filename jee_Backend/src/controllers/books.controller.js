const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { getBooks, getBook } = require('../services/books.service');

const getBooksList = catchAsync(async (req, res) => {
  const filters = {
    subject: req.query.subject,
    topic: req.query.topic
  };
  const books = await getBooks(filters);
  res.status(httpStatus.OK).send(books);
});

const getBookById = catchAsync(async (req, res) => {
  const book = await getBook(req.params.bookId);
  res.status(httpStatus.OK).send(book);
});

module.exports = {
  getBooksList,
  getBookById,
}; 