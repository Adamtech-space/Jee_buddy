const Joi = require('joi');

const createFlashCard = {
  body: Joi.object().keys({
    subject: Joi.string().required(),
    topic: Joi.string().required(),
    content: Joi.string().required(),
    source: Joi.string().required()
  })
};

const getFlashCards = {
  query: Joi.object().keys({
    subject: Joi.string().optional()
  })
};

const updateFlashCard = {
  params: Joi.object().keys({
    id: Joi.string().required()
  }),
  body: Joi.object().keys({
    subject: Joi.string().optional(),
    topic: Joi.string().optional(),
    content: Joi.string().optional()
  })
};

const deleteFlashCard = {
  params: Joi.object().keys({
    id: Joi.string().required()
  })
};

module.exports = {
  createFlashCard,
  getFlashCards,
  updateFlashCard,
  deleteFlashCard
}; 