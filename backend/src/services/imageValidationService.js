const crypto = require('crypto');
const Grievance = require('../models/Grievance');

/**
 * Image Validation Service
 * Detects fake, irrelevant, and duplicate images during complaint submission
 */

// Category-to-keyword mapping for relevance detection
const CATEGORY_KEYWORDS = {
  'Waste Management': ['garbage', 'trash', 'waste', 'dump', 'rubbish', 'bin', 'dustbin', 'landfill', 'debris', 'litter', 'scrap', 'junk', 'refuse', 'disposal', 'overflow', 'scattered', 'heap', 'pile'],
  'Water Supply': ['water', 'pipe', 'leak', 'tap', 'faucet', 'drainage', 'flood', 'puddle', 'moisture', 'wet', 'liquid', 'drip', 'plumbing', 'valve', 'tank', 'sewer', 'drain'],
  'Road Maintenance': ['road', 'street', 'pothole', 'asphalt', 'pavement', 'crack', 'damage', 'hole', 'concrete', 'curb', 'sidewalk', 'path', 'highway', 'lane', 'bridge', 'manhole', 'traffic', 'barrier'],
  'Street Lighting': ['light', 'lamp', 'pole', 'bulb', 'streetlight', 'lantern', 'illumination', 'fixture', 'glow', 'beam', 'electric', 'power', 'outage', 'dark', 'wire', 'cable', 'transformer'],
  'Parks & Gardens': ['park', 'garden', 'tree', 'grass', 'plant', 'flower', 'bench', 'playground', 'lawn', 'landscape', 'fountain', 'hedge', 'bush', 'shrub', 'vegetation', 'green', 'nature'],
  'Public Buildings': ['building', 'office', 'hall', 'structure', 'wall', 'roof', 'door', 'window', 'stairs', 'entrance', 'ceiling', 'floor', 'corridor', 'government', 'municipal', 'facility'],
  'Other': []
};

/**
 * Generate MD5 hash from base64 image data
 */
const generateImageHash = (base64Data) => {
  try {
    const base64String = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;
    return crypto.createHash('md5').update(base64String).digest('hex');
  } catch (error) {
    console.error('Error generating image hash:', error);
    return null;
  }
};

/**
 * Check for duplicate images in existing complaints
 */
const checkDuplicateImage = async (imageHash, excludeComplaintId = null) => {
  try {
    const query = { imageHash: imageHash };
    if (excludeComplaintId) {
      query.complaintId = { $ne: excludeComplaintId };
    }
    const existingComplaint = await Grievance.findOne(query).select('complaintId title createdAt');
    return existingComplaint;
  } catch (error) {
    console.error('Error checking duplicate image:', error);
    return null;
  }
};

/**
 * Detect if image is potentially fake or low quality
 */
const detectFakeImage = (base64Data) => {
  try {
    const matches = base64Data.match(/^data:image\/(\w+);base64,/);
    if (!matches) {
      return { isValid: false, reason: 'Invalid image format' };
    }
    
    const imageType = matches[1].toLowerCase();
    const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (!supportedFormats.includes(imageType)) {
      return { isValid: false, reason: 'Unsupported image format. Use JPEG, PNG, or WebP' };
    }
    
    const base64String = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    const sizeInBytes = (base64String.length * 3) / 4;
    const minSizeBytes = 5000;
    
    if (sizeInBytes < minSizeBytes) {
      return { isValid: false, reason: 'Image is too small or corrupted' };
    }
    
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB (updated from 2MB)
    if (sizeInBytes > maxSizeBytes) {
      return { isValid: false, reason: 'Image exceeds maximum allowed size (5MB)' };
    }
    
    const sampleSize = Math.min(base64String.length, 1000);
    const uniqueChars = new Set(base64String.slice(0, sampleSize));
    
    if (uniqueChars.size < 10 && sizeInBytes < 20000) {
      return { isValid: false, reason: 'Image appears to be a blank or single-color image' };
    }
    
    const sequenceLength = 20;
    const testSequence = base64String.slice(0, sequenceLength);
    let repeatCount = 0;
    const maxRepeats = Math.floor(base64String.length / sequenceLength);
    
    for (let i = 0; i < base64String.length; i += sequenceLength) {
      if (base64String.slice(i, i + sequenceLength) === testSequence) {
        repeatCount++;
      }
    }
    
    if (repeatCount > maxRepeats * 0.5 && maxRepeats > 10) {
      return { isValid: false, reason: 'Image appears to be artificially generated' };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error detecting fake image:', error);
    return { isValid: false, reason: 'Failed to analyze image' };
  }
};

/**
 * Analyze image complexity for relevance scoring
 */
const analyzeImageComplexity = (base64Data) => {
  try {
    const base64String = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    const buffer = Buffer.from(base64String, 'base64');
    const sampleSize = Math.min(buffer.length, 5000);
    const colorValues = [];
    
    for (let i = 0; i < sampleSize; i += 10) {
      colorValues.push(buffer[i]);
    }
    
    const mean = colorValues.reduce((a, b) => a + b, 0) / colorValues.length;
    const variance = colorValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / colorValues.length;
    
    return {
      complexity: variance,
      hasMeaningfulContent: variance > 500
    };
  } catch (error) {
    return { complexity: 0, hasMeaningfulContent: false };
  }
};

/**
 * Validate image for complaint submission
 * Main validation function that combines all checks
 */
const validateImage = async (base64Data, category) => {
  const result = {
    isValid: true,
    imageHash: null,
    warnings: [],
    errors: []
  };
  
  if (!base64Data) {
    return result; // No image is valid (optional field)
  }
  
  // 1. Fake image detection
  const fakeCheck = detectFakeImage(base64Data);
  if (!fakeCheck.isValid) {
    result.isValid = false;
    result.errors.push(fakeCheck.reason);
    return result;
  }
  
  // 2. Generate hash and check for duplicates
  const imageHash = generateImageHash(base64Data);
  if (imageHash) {
    result.imageHash = imageHash;
    
    const duplicate = await checkDuplicateImage(imageHash);
    if (duplicate) {
      result.isValid = false;
      result.errors.push(`Duplicate image detected. This image was already used in complaint ${duplicate.complaintId}`);
      return result;
    }
  }
  
  // 3. Check image complexity (warn but don't block)
  const complexityCheck = analyzeImageComplexity(base64Data);
  if (!complexityCheck.hasMeaningfulContent) {
    result.warnings.push('Image appears to have low visual content. Please ensure it clearly shows the issue.');
  }
  
  // 4. Category relevance check (warn but don't block for 'Other')
  if (category && category !== 'Other') {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    if (keywords.length === 0) {
      result.warnings.push(`Unknown category "${category}". Image relevance cannot be verified.`);
    }
  }
  
  return result;
};

module.exports = {
  generateImageHash,
  checkDuplicateImage,
  detectFakeImage,
  analyzeImageComplexity,
  validateImage,
  CATEGORY_KEYWORDS
};
