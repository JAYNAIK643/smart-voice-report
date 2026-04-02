const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
const videosDir = path.join(uploadsDir, 'videos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Configure multer storage for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `complaint-${uniqueSuffix}${ext}`);
  }
});

// Configure multer storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  // Allowed mime types
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

// File filter for videos only
const videoFilter = (req, file, cb) => {
  // Allowed video mime types
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, WebM, and QuickTime videos are allowed.'), false);
  }
};

// Configure upload middleware for images
const upload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Configure upload middleware for videos
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size for videos
  }
});

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Middleware for single video upload
const uploadVideoSingle = uploadVideo.single('video');

// Middleware for handling upload errors (works for both image and video)
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      const isVideo = req.file && req.file.mimetype && req.file.mimetype.startsWith('video/');
      const maxSize = isVideo ? '20MB' : '5MB';
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${maxSize}.`,
        errorType: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Use "image" or "video" as the field name.',
        errorType: 'INVALID_FIELD'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      errorType: 'UPLOAD_ERROR'
    });
  } else if (err) {
    // Other errors
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
      errorType: 'UPLOAD_ERROR'
    });
  }
  next();
};

// Read file as base64
const readFileAsBase64 = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
};

// Clean up uploaded file
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

module.exports = {
  upload,
  uploadVideo,
  uploadSingle,
  uploadVideoSingle,
  handleUploadError,
  readFileAsBase64,
  cleanupFile,
  uploadsDir,
  videosDir
};
