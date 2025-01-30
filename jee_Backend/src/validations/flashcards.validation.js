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
    subject: Joi.string()
  })
};

const updateFlashCard = {
  params: Joi.object().keys({
    cardId: Joi.string().required()
  }),
  body: Joi.object().keys({
    subject: Joi.string(),
    topic: Joi.string(),
    content: Joi.string()
  }).min(1)
};

const deleteFlashCard = {
  params: Joi.object().keys({
    cardId: Joi.string().required()
  })
};

module.exports = {
  createFlashCard,
  getFlashCards,
  updateFlashCard,
  deleteFlashCard
}; 