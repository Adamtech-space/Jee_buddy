const express = require('express');
const questionBankController = require('../../controllers/questionbank.controller');
const { auth } = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .get(auth({ required: false }), questionBankController.getQuestionBankList);

module.exports = router;
