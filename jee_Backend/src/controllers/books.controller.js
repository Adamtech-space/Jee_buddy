const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { getBooks, getBook } = require('../services/books.service');
const ApiError = require('../utils/ApiError');

const getBooksList = catchAsync(async (req, res) => {
  try {
    const filters = {
      subject: req.query.subject,
      topic: req.query.topic
    };
    

    
    const books = await getBooks(filters);
    
    if (!books || books.length === 0) {
      return res.status(httpStatus.OK).json({
        message: `No books found for subject: ${filters.subject}${filters.topic ? ` and topic: ${filters.topic}` : ''}`,
        data: []
      });
    }
    
    res.status(httpStatus.OK).json({
      message: 'Books retrieved successfully',
      data: books
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching books');
  }
});

const getBookById = catchAsync(async (req, res) => {
  try {
    const book = await getBook(req.params.bookId);
    
    if (!book) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Book not found');
    }
    
    res.status(httpStatus.OK).json({
      message: 'Book retrieved successfully',
      data: book
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching book');
  }
});

module.exports = {
  getBooksList,
  getBookById,
}; 