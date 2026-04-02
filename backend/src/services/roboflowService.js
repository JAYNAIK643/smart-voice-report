const axios = require('axios');

/**
 * Roboflow Image Validation Service
 * Integrates with Roboflow API for object detection to validate complaint images
 */

// Roboflow API Configuration - DO NOT MODIFY
const ROBOFLOW_CONFIG = {
  api_url: 'https://serverless.roboflow.com',
  api_key: 'xPf2Jg9EuXDz4lxMr8lg',
  // Model endpoints for different complaint types
  models: {
    garbage: 'garbage-detection-model', // Replace with actual model ID if different
    road: 'pothole-detection-model',     // Replace with actual model ID if different
  }
};

// Minimum confidence threshold for predictions (STRICT)
const MIN_CONFIDENCE = 0.65;

// Complaint type to detection class mapping (STRICT VALIDATION)
const COMPLAINT_TYPE_MAPPING = {
  'garbage': ['garbage', 'trash', 'waste', 'dump', 'rubbish', 'litter', 'debris'],
  'road': ['pothole', 'road damage', 'crack', 'road', 'asphalt', 'pavement', 'damage'],
  'water': ['water leakage', 'pipe leak', 'water', 'leak', 'pipe', 'flood', 'puddle'],
  // Legacy mappings for existing complaint types
  'Waste Management': ['garbage', 'trash', 'waste', 'dump', 'rubbish', 'litter', 'debris'],
  'Road Maintenance': ['pothole', 'road damage', 'crack', 'road', 'asphalt', 'pavement', 'damage'],
  'Water Supply': ['water leakage', 'pipe leak', 'water', 'leak', 'pipe', 'flood', 'puddle'],
  'Street Lighting': ['light', 'lamp', 'pole', 'streetlight', 'bulb', 'fixture', 'outage'],
  'Parks & Gardens': ['tree', 'grass', 'plant', 'park', 'garden', 'bench', 'vegetation'],
  'Public Buildings': ['building', 'wall', 'roof', 'door', 'window', 'structure', 'damage'],
  'Other': [] // No validation for Other
};

/**
 * Detect objects in image using Roboflow API
 * @param {string} imageBase64 - Base64 encoded image (without data URI prefix)
 * @param {string} modelId - Optional specific model ID to use
 * @returns {Promise<Object>} - Detection results
 */
const detectObjects = async (imageBase64, modelId = null) => {
  try {
    // Use provided model or default to a general model
    const model = modelId || 'inference-model-id'; // Replace with your actual model ID
    
    // Construct Roboflow API URL
    const apiUrl = `${ROBOFLOW_CONFIG.api_url}/${model}`;
    
    console.log(`🔍 Roboflow API: Sending request to ${apiUrl}`);
    
    // Send POST request to Roboflow
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      params: {
        api_key: ROBOFLOW_CONFIG.api_key
      },
      data: imageBase64,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log(`✅ Roboflow API: Response received`);
    
    return {
      success: true,
      predictions: response.data.predictions || [],
      image: response.data.image || {},
      raw: response.data
    };
  } catch (error) {
    console.error('❌ Roboflow API Error:', error.message);
    
    // Handle specific error cases
    if (error.response) {
      // API returned an error response
      return {
        success: false,
        error: error.response.data?.message || 'API request failed',
        statusCode: error.response.status,
        predictions: []
      };
    } else if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout - API took too long to respond',
        predictions: []
      };
    } else {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        predictions: []
      };
    }
  }
};

/**
 * Validate image against complaint type using Roboflow detection
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} complaintType - Type of complaint (category)
 * @returns {Promise<Object>} - Validation result
 */
const validateImageWithRoboflow = async (imageBase64, complaintType) => {
  const result = {
    isValid: true,
    confidence: 0,
    detectedObjects: [],
    matchedObjects: [],
    errors: [],
    warnings: []
  };
  
  // Skip validation for 'Other' category
  if (complaintType === 'Other') {
    result.warnings.push('Image validation skipped for "Other" category');
    return result;
  }
  
  // Clean base64 string (remove data URI prefix if present)
  const cleanBase64 = imageBase64.includes(',') 
    ? imageBase64.split(',')[1] 
    : imageBase64;
  
  // Get allowed classes for this complaint type
  const allowedClasses = COMPLAINT_TYPE_MAPPING[complaintType] || [];
  
  if (allowedClasses.length === 0) {
    result.warnings.push(`No detection mapping for complaint type: ${complaintType}`);
    return result;
  }
  
  // Call Roboflow API
  const detection = await detectObjects(cleanBase64);
    
  // STRICT: If API fails, REJECT (no graceful degradation for anti-cheat)
  if (!detection.success) {
    result.isValid = false;
    result.errors.push(`Image validation failed: ${detection.error}. Please try again.`);
    return result;
  }
    
  result.detectedObjects = detection.predictions.map(p => ({
    class: p.class || p.label,
    confidence: p.confidence,
    bbox: p.bbox || { x: p.x, y: p.y, width: p.width, height: p.height }
  }));
    
  // STRICT: If NO objects detected → REJECT
  if (result.detectedObjects.length === 0) {
    result.isValid = false;
    result.errors.push('No objects detected in the image. Please upload a clear image showing the issue.');
    return result;
  }
    
  // Find matching objects above confidence threshold
  result.matchedObjects = result.detectedObjects.filter(obj => {
    const confidence = Number(obj.confidence);
    if (confidence < MIN_CONFIDENCE) return false;
      
    // Check if detected class matches allowed classes for complaint type
    const objClass = obj.class.toLowerCase();
    return allowedClasses.some(allowed =>
      objClass.includes(allowed.toLowerCase()) || 
      allowed.toLowerCase().includes(objClass)
    );
  });
    
  // Calculate max confidence
  result.confidence = result.detectedObjects.length > 0
    ? Math.max(...result.detectedObjects.map(o => Number(o.confidence)))
    : 0;
    
  // STRICT VALIDATION: Only accept if prediction MATCHES complaintType AND confidence >= 0.65
  if (result.matchedObjects.length === 0) {
    result.isValid = false;
      
    // Check if detections exist but below confidence threshold
    const maxDetectedConfidence = Math.max(...result.detectedObjects.map(o => Number(o.confidence)));
      
    if (maxDetectedConfidence < MIN_CONFIDENCE) {
      result.errors.push(
        `Image confidence too low (${(maxDetectedConfidence * 100).toFixed(0)}% < 65%). ` +
        `Please upload a clearer image of the issue.`
      );
    } else {
      // Detected objects don't match complaint type
      const detectedClasses = [...new Set(result.detectedObjects.map(o => o.class))].join(', ');
      result.errors.push(
        `Invalid complaint image. Detected: ${detectedClasses}. ` +
        `Image does not match complaint type "${complaintType}".`
      );
    }
    return result;
  }
    
  // SUCCESS: Valid match found with sufficient confidence
  const bestMatch = result.matchedObjects.reduce((best, obj) => 
    Number(obj.confidence) > Number(best.confidence) ? obj : best
  );
  result.confidence = Number(bestMatch.confidence);
  result.matchedClass = bestMatch.class;
    
  return result;
};

/**
 * Quick image validation check (lightweight)
 * Returns boolean for fast validation
 */
const quickValidateImage = async (imageBase64, complaintType) => {
  const result = await validateImageWithRoboflow(imageBase64, complaintType);
  return {
    isValid: result.isValid,
    confidence: result.confidence,
    error: result.errors[0] || null
  };
};

module.exports = {
  detectObjects,
  validateImageWithRoboflow,
  quickValidateImage,
  COMPLAINT_TYPE_MAPPING,
  MIN_CONFIDENCE,
  ROBOFLOW_CONFIG
};
