const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const roboflowService = require('../services/roboflowService');
const imageValidationService = require('../services/imageValidationService');
const { readFileAsBase64, cleanupFile, uploadsDir } = require('../middleware/upload');

/**
 * @desc    Upload video for complaint
 * @route   POST /api/video/upload
 * @access  Private
 */
const uploadVideo = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided. Please upload a video.',
        errorType: 'NO_FILE'
      });
    }
    
    // Generate URL for the video
    const videoUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${req.file.filename}`;
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoUrl: videoUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
    
  } catch (error) {
    console.error('❌ Video upload error:', error);
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing the video.',
      errorType: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Upload and validate image for complaint
 * @route   POST /api/image/upload
 * @access  Private
 */
const uploadAndValidateImage = async (req, res) => {
  let filePath = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please upload an image.',
        errorType: 'NO_FILE'
      });
    }
    
    filePath = req.file.path;
    const { complaintType } = req.body;
    
    // Validate complaint type
    if (!complaintType) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Complaint type is required.',
        errorType: 'MISSING_COMPLAINT_TYPE'
      });
    }
    
    // Read file as base64
    const base64Image = readFileAsBase64(filePath);
    
    if (!base64Image) {
      cleanupFile(filePath);
      return res.status(500).json({
        success: false,
        message: 'Failed to process image file.',
        errorType: 'FILE_READ_ERROR'
      });
    }
    
    // Step 1: Basic image validation (fake image detection, size check, etc.)
    console.log(`🔍 Validating image for complaint type: ${complaintType}`);
    
    const fakeCheck = imageValidationService.detectFakeImage(`data:image/jpeg;base64,${base64Image}`);
    if (!fakeCheck.isValid) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: fakeCheck.reason,
        errorType: 'INVALID_IMAGE'
      });
    }
    
    // Step 2: Check for duplicate images
    const imageHash = imageValidationService.generateImageHash(`data:image/jpeg;base64,${base64Image}`);
    if (imageHash) {
      const duplicate = await imageValidationService.checkDuplicateImage(imageHash);
      if (duplicate) {
        cleanupFile(filePath);
        return res.status(400).json({
          success: false,
          message: `Duplicate image detected. This image was already used in complaint ${duplicate.complaintId}`,
          errorType: 'DUPLICATE_IMAGE'
        });
      }
    }
    
    // Step 3: Roboflow object detection validation
    const roboflowResult = await roboflowService.validateImageWithRoboflow(base64Image, complaintType);
    
    if (!roboflowResult.isValid) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: roboflowResult.errors[0] || 'Image validation failed',
        errorType: 'IMAGE_MISMATCH',
        details: {
          detectedObjects: roboflowResult.detectedObjects,
          confidence: roboflowResult.confidence
        }
      });
    }
    
    // Image is valid - generate URL for storage
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Image validated successfully',
      data: {
        imageUrl: imageUrl,
        filename: req.file.filename,
        imageHash: imageHash,
        validation: {
          isValid: true,
          detectedObjects: roboflowResult.detectedObjects,
          matchedObjects: roboflowResult.matchedObjects,
          confidence: roboflowResult.confidence,
          warnings: roboflowResult.warnings
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    // Clean up file on error
    if (filePath) {
      cleanupFile(filePath);
    }
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing the image.',
      errorType: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Validate base64 image without saving to disk
 * @route   POST /api/image/validate
 * @access  Private
 */
const validateImageOnly = async (req, res) => {
  try {
    const { imageBase64, complaintType } = req.body;
    
    // Validate required fields
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image data (base64) is required.',
        errorType: 'NO_IMAGE_DATA'
      });
    }
    
    if (!complaintType) {
      return res.status(400).json({
        success: false,
        message: 'Complaint type is required.',
        errorType: 'MISSING_COMPLAINT_TYPE'
      });
    }
    
    // Step 1: Basic image validation
    const fakeCheck = imageValidationService.detectFakeImage(imageBase64);
    if (!fakeCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: fakeCheck.reason,
        errorType: 'INVALID_IMAGE'
      });
    }
    
    // Step 2: Check for duplicate
    const imageHash = imageValidationService.generateImageHash(imageBase64);
    if (imageHash) {
      const duplicate = await imageValidationService.checkDuplicateImage(imageHash);
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Duplicate image detected. This image was already used in complaint ${duplicate.complaintId}`,
          errorType: 'DUPLICATE_IMAGE'
        });
      }
    }
    
    // Step 3: Roboflow validation
    const roboflowResult = await roboflowService.validateImageWithRoboflow(imageBase64, complaintType);
    
    if (!roboflowResult.isValid) {
      return res.status(400).json({
        success: false,
        message: roboflowResult.errors[0] || 'Image validation failed',
        errorType: 'IMAGE_MISMATCH',
        details: {
          detectedObjects: roboflowResult.detectedObjects,
          confidence: roboflowResult.confidence
        }
      });
    }
    
    // Return validation result
    res.status(200).json({
      success: true,
      message: 'Image validated successfully',
      data: {
        imageHash: imageHash,
        validation: {
          isValid: true,
          detectedObjects: roboflowResult.detectedObjects,
          matchedObjects: roboflowResult.matchedObjects,
          confidence: roboflowResult.confidence,
          warnings: roboflowResult.warnings
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Image validation error:', error);
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while validating the image.',
      errorType: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get supported complaint types for image validation
 * @route   GET /api/image/supported-types
 * @access  Public
 */
const getSupportedTypes = (req, res) => {
  const types = Object.keys(roboflowService.COMPLAINT_TYPE_MAPPING).map(type => ({
    type,
    keywords: roboflowService.COMPLAINT_TYPE_MAPPING[type]
  }));
  
  res.status(200).json({
    success: true,
    data: {
      complaintTypes: types,
      minConfidence: roboflowService.MIN_CONFIDENCE
    }
  });
};

/**
 * @desc    Create complaint with STRICT image validation (Anti-cheat)
 * @route   POST /api/complaints/create
 * @access  Private
 * 
 * STRICT VALIDATION RULES:
 * - NO object detected → REJECT
 * - Detected class does NOT match complaintType → REJECT
 * - Confidence < 0.65 → REJECT
 * - Duplicate image (same hash) → REJECT
 * - Only image mime types allowed
 * - Max size 5MB
 */
const createComplaintWithValidation = async (req, res) => {
  let filePath = null;
  
  try {
    const { complaintType, description, title, address, ward } = req.body;
    
    // ========== VALIDATE REQUIRED FIELDS ==========
    if (!complaintType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Complaint type and description are required.'
      });
    }
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Complaint title is required.'
      });
    }
    
    // ========== VALIDATE IMAGE FILE ==========
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required for complaint submission.'
      });
    }
    
    filePath = req.file.path;
    
    // Validate file type (only images allowed)
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
      });
    }
    
    // Validate file size (5MB max)
    if (req.file.size > 5 * 1024 * 1024) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Image file too large. Maximum size is 5MB.'
      });
    }
    
    // ========== READ AND VALIDATE IMAGE ==========
    const base64Image = readFileAsBase64(filePath);
    
    if (!base64Image) {
      cleanupFile(filePath);
      return res.status(500).json({
        success: false,
        message: 'Failed to process image file.'
      });
    }
    
    console.log(`\n🔒 STRICT IMAGE VALIDATION for complaint type: ${complaintType}`);
    
    // Step 1: Basic image validation (fake image detection)
    const fakeCheck = imageValidationService.detectFakeImage(`data:image/jpeg;base64,${base64Image}`);
    if (!fakeCheck.isValid) {
      console.log(`   ❌ Fake image detected: ${fakeCheck.reason}`);
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: fakeCheck.reason
      });
    }
    
    // Step 2: Generate image hash for duplicate detection
    const imageHash = crypto.createHash('sha256').update(base64Image).digest('hex');
    console.log(`   Image hash: ${imageHash.substring(0, 16)}...`);
    
    // Step 3: Check for duplicate images in MongoDB
    const Grievance = require('../models/Grievance');
    const existingComplaint = await Grievance.findOne({ imageHash: imageHash });
    
    if (existingComplaint) {
      console.log(`   ❌ DUPLICATE IMAGE detected in complaint ${existingComplaint.complaintId}`);
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'Duplicate image detected. This image was already used in another complaint.'
      });
    }
    
    // Step 4: STRICT Roboflow validation (anti-cheat)
    // Skip validation for 'Other' category
    if (complaintType !== 'Other') {
      console.log(`   🔍 Sending to Roboflow API for object detection...`);
      
      const roboflowResult = await roboflowService.validateImageWithRoboflow(base64Image, complaintType);
      
      console.log(`   Detected objects: ${JSON.stringify(roboflowResult.detectedObjects?.map(o => `${o.class}(${(o.confidence*100).toFixed(0)}%)`))}`);
      console.log(`   Matched objects: ${JSON.stringify(roboflowResult.matchedObjects?.map(o => `${o.class}(${(o.confidence*100).toFixed(0)}%)`))}`);
      
      // STRICT: Reject if validation fails
      if (!roboflowResult.isValid) {
        console.log(`   ❌ VALIDATION FAILED: ${roboflowResult.errors[0]}`);
        cleanupFile(filePath);
        return res.status(400).json({
          success: false,
          message: roboflowResult.errors[0] || 'Invalid complaint image.'
        });
      }
      
      console.log(`   ✅ VALIDATION PASSED - Confidence: ${(roboflowResult.confidence * 100).toFixed(0)}%`);
    } else {
      console.log(`   ⏭️ Skipped validation for 'Other' category`);
    }
    
    // ========== ALL VALIDATIONS PASSED - CREATE COMPLAINT ==========
    // Generate image URL for storage
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Return success - caller will save to database
    console.log(`   ✅ COMPLAINT VALIDATED SUCCESSFULLY\n`);
    
    res.status(200).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        imageUrl,
        imageHash,
        filename: req.file.filename,
        complaintType,
        title,
        description,
        address,
        ward,
        userId: req.user?.id
      }
    });
    
  } catch (error) {
    console.error('❌ Complaint creation error:', error);
    
    if (filePath) {
      cleanupFile(filePath);
    }
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing the complaint.'
    });
  }
};

module.exports = {
  uploadVideo,
  uploadAndValidateImage,
  validateImageOnly,
  getSupportedTypes,
  createComplaintWithValidation
};
