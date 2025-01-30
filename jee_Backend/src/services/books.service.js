const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { getBooksMetadata, getBookById } = require('../models/books.model');

/**
 * Get books by subject and topic
 * @param {Object} filters
 * @param {string} filters.subject
 * @param {string} filters.topic
 * @returns {Promise<Array>}
 */
const getBooks = async (filters) => {
  try {
    const books = await getBooksMetadata(filters);
    return books;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching books');
  }
};

/**
 * Get book by id
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getBook = async (id) => {
  try {
    const book = await getBookById(id);
    if (!book) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Book not found');
    }
    return book;
  } catch (error) {
    if (error.statusCode === httpStatus.NOT_FOUND) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching book');
  }
};

module.exports = {
  getBooks,
  getBook,
}; 