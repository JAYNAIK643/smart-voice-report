const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleware');
const imageController = require('../controllers/imageController');
const { uploadSingle, handleUploadError } = require('../middleware/upload');

/**
 * @route   POST /api/image/upload
 * @desc    Upload and validate image for complaint
 * @access  Private (requires authentication)
 */
router.post('/upload', 
  authenticateUser,
  uploadSingle,
  handleUploadError,
  imageController.uploadAndValidateImage
);

/**
 * @route   POST /api/image/validate
 * @desc    Validate base64 image without saving
 * @access  Private (requires authentication)
 */
router.post('/validate',
  authenticateUser,
  imageController.validateImageOnly
);

/**
 * @route   GET /api/image/supported-types
 * @desc    Get supported complaint types for image validation
 * @access  Public
 */
router.get('/supported-types', imageController.getSupportedTypes);

/**
 * @route   POST /api/complaints/create
 * @desc    Create complaint with STRICT image validation (Anti-cheat)
 * @access  Private
 * 
 * STRICT VALIDATION:
 * - NO object detected → REJECT
 * - Class does NOT match complaintType → REJECT
 * - Confidence < 0.65 → REJECT
 * - Duplicate image → REJECT
 */
router.post('/complaints/create',
  authenticateUser,
  uploadSingle,
  handleUploadError,
  imageController.createComplaintWithValidation
);

module.exports = router;
