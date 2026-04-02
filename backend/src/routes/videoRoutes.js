const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const imageController = require('../controllers/imageController');
const { uploadVideoSingle, handleUploadError } = require('../middleware/upload');

/**
 * @route   POST /api/video/upload
 * @desc    Upload video for complaint
 * @access  Private (requires authentication)
 */
router.post('/upload', 
  authenticateUser,
  uploadVideoSingle,
  handleUploadError,
  imageController.uploadVideo
);

module.exports = router;
