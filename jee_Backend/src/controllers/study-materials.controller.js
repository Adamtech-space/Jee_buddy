const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const studyMaterialsService = require('../services/study-materials.service');
const multer = require('multer');
const path = require('path');
const studyMaterialsValidation = require('../validations/study-materials.validation');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Add allowed file types here
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
}).single('file');

const createFolder = catchAsync(async (req, res) => {
  const folder = await studyMaterialsService.createFolder(req.user.id, {
    name: req.body.name,
    parentId: req.body.parentId,
    subject: req.body.subject,
  });

  res.status(httpStatus.CREATED).json({
    status: 'success',
    message: 'Folder created successfully',
    data: folder,
  });
});

const uploadFile = catchAsync(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    // Validate required fields after multer processes the request
    const { error } = studyMaterialsValidation.uploadFile.body.validate(req.body);
    if (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: 'error',
        message: error.details[0].message,
      });
    }

    const file = await studyMaterialsService.uploadFile(req.user.id, {
      name: req.file.originalname,
      parentId: req.body.parentId,
      file: req.file.buffer,
      size: req.file.size,
      mimeType: req.file.mimetype,
      subject: req.body.subject,
    });

    res.status(httpStatus.CREATED).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: file,
    });
  });
});

const getItems = catchAsync(async (req, res) => {
  // Debug: Log the request details
  console.log('getItems controller:', {
    userId: req.user.id,
    queryParams: req.query,
    user: req.user
  });

  // Validate required parameters
  if (!req.user?.id) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: 'error',
      message: 'User ID is required'
    });
  }

  if (!req.query.subject) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: 'error',
      message: 'Subject is required'
    });
  }

  const items = await studyMaterialsService.getItems(
    req.user.id,
    req.query.parentId || null,
    req.query.subject
  );

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Items retrieved successfully',
    data: items,
  });
});

const deleteItem = catchAsync(async (req, res) => {
  await studyMaterialsService.deleteItem(req.user.id, req.params.itemId);

  res.status(httpStatus.NO_CONTENT).send();
});

const renameItem = catchAsync(async (req, res) => {
  const item = await studyMaterialsService.renameItem(
    req.user.id,
    req.params.itemId,
    req.body.name
  );

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Item renamed successfully',
    data: item,
  });
});

const getDownloadUrl = catchAsync(async (req, res) => {
  const downloadData = await studyMaterialsService.getDownloadUrl(
    req.user.id,
    req.params.itemId
  );

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Download URL generated successfully',
    data: downloadData,
  });
});

module.exports = {
  createFolder,
  uploadFile,
  getItems,
  deleteItem,
  renameItem,
  getDownloadUrl,
}; 