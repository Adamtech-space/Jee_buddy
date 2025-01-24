const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { getQuestionBank } = require('../services/questionBank.service');
const ApiError = require('../utils/ApiError');

const getQuestionBankList = catchAsync(async (req, res) => {
  try {
    const { subject } = req.query;

    if (!subject) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Subject is required');
    }

    const questions = await getQuestionBank(subject);

    if (!questions || questions.length === 0) {
      return res.status(httpStatus.OK).json({
        message: `No questions found for subject: ${subject}`,
        data: [],
      });
    }

    res.status(httpStatus.OK).json({
      message: 'Question bank retrieved successfully',
      data: questions,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching question bank'
    );
  }
});

module.exports = {
  getQuestionBankList,
};
