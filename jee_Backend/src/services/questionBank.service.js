const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { getQuestionBankList } = require('../models/questionBank.model');

const getQuestionBank = async (subject) => {
  try {
    if (!subject) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Subject is required');
    }

    const questions = await getQuestionBankList(subject);
    return questions;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching question bank'
    );
  }
};

module.exports = {
  getQuestionBank,
};
