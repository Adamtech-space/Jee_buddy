const Joi = require('joi');

const createFolder = {
  body: Joi.object().keys({
    name: Joi.string().required().min(1).max(255),
    parentId: Joi.string().uuid().allow(null),
    subject: Joi.string().required(),
  }),
};

const uploadFile = {
  body: Joi.object().keys({
    parentId: Joi.string().uuid().allow(null),
    subject: Joi.string().required(),
  }),
};

const getItems = {
  query: Joi.object().keys({
    parentId: Joi.string().uuid().allow(null),
    subject: Joi.string().required(),
  }),
};

const deleteItem = {
  params: Joi.object().keys({
    itemId: Joi.string().uuid().required(),
  }),
};

const renameItem = {
  params: Joi.object().keys({
    itemId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().required().min(1).max(255),
  }),
};

const getDownloadUrl = {
  params: Joi.object().keys({
    itemId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createFolder,
  uploadFile,
  getItems,
  deleteItem,
  renameItem,
  getDownloadUrl,
}; 