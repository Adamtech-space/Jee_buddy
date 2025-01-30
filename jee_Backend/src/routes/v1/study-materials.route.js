const express = require('express');
const { auth } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const studyMaterialsValidation = require('../../validations/study-materials.validation');
const studyMaterialsController = require('../../controllers/study-materials.controller');

const router = express.Router();

// All routes require authentication
router.use(auth());

router
  .route('/folders')
  .post(validate(studyMaterialsValidation.createFolder), studyMaterialsController.createFolder);

// Move validation after multer for file upload
router
  .route('/files')
  .post(studyMaterialsController.uploadFile);

router
  .route('/')
  .get(validate(studyMaterialsValidation.getItems), studyMaterialsController.getItems);

router
  .route('/:itemId')
  .delete(validate(studyMaterialsValidation.deleteItem), studyMaterialsController.deleteItem)
  .put(validate(studyMaterialsValidation.renameItem), studyMaterialsController.renameItem);

router
  .route('/files/:itemId/download')
  .get(validate(studyMaterialsValidation.getDownloadUrl), studyMaterialsController.getDownloadUrl);

module.exports = router; 