/**
 * Enhanced AI Service - Phase 1 Implementation
 * 
 * Features:
 * 1. Multi-language NLP (Marathi/Hindi support)
 * 2. Smart Duplicate Detection Enhancement
 * 3. Auto-ward Detection from Address Text
 * 
 * Zero-Regression Strategy: New service layer, no modification to existing code
 */

const Grievance = require("../models/Grievance");

// ============================================
// MULTI-LANGUAGE NLP SUPPORT (Marathi/Hindi)
// ============================================

// Marathi keywords mapping (basic set)
const MARATHI_KEYWORDS = {
  "Water Supply": ["pani", "nali", "paip", "galti", "panipurv", "ghanerode pani", "pani taki"],
  "Road Maintenance": ["rasta", "khadda", "pavva", "sadak", "marammat", "kharab rasta"],
  "Garbage Collection": ["kachra", "safai", "dustbin", "kuchha", "svachchhata", "ghan"],
  "Street Lighting": ["diva", "light", "andhar", "bijli", "khambha"],
  "Electricity": ["bijli", "current", "transformer", "bijli band", "kalla bhag"],
  "Sewage": ["gatar", "nali", "jam", "ghane", "band nali"],
  "Public Safety": ["suraksha", "guna", "chori", "apghat", "khatra", "police"],
  "Parks & Recreation": ["udyan", "bag", "park", "maidn", "vraksh", "hire"]
};

// Hindi keywords mapping (basic set)
const HINDI_KEYWORDS = {
  "Water Supply": ["pani", "nal", "paip", "risav", "jal purti", "ganda pani", "tanki"],
  "Road Maintenance": ["sadak", "gadha", "kheench", "marammat", "kharab sadak"],
  "Garbage Collection": ["kachra", "safai", "dustbin", "kuda", "svachchhata"],
  "Street Lighting": ["light", "dip", "andhera", "bijli", "khanba"],
  "Electricity": ["bijli", "current", "transformer", "bijli band"],
  "Sewage": ["nali", "sewer", "jam", "band nali", " ganda"],
  "Public Safety": ["suraksha", "apradh", "chori", "dukhm", "khatra", "police"],
  "Parks & Recreation": ["udyan", "bagin", "park", "maidn", "ped"]
};

// ============================================
// AUTO-WARD DETECTION MAPPING
// ============================================

const WARD_PATTERNS = {
  "Ward 1": ["phase 1", "sector 1", "area 1", "zone 1", "colony 1", "gv 1", "kshetra 1", "vard 1"],
  "Ward 2": ["phase 2", "sector 2", "area 2", "zone 2", "colony 2", "gv 2", "kshetra 2", "vard 2"],
  "Ward 3": ["phase 3", "sector 3", "area 3", "zone 3", "colony 3", "gv 3", "kshetra 3", "vard 3"],
  "Ward 4": ["phase 4", "sector 4", "area 4", "zone 4", "colony 4", "gv 4", "kshetra 4", "vard 4"],
  "Ward 5": ["phase 5", "sector 5", "area 5", "zone 5", "colony 5", "gv 5", "kshetra 5", "vard 5"]
};

const LANDMARK_WARD_MAP = {
  "railway station": "Ward 1",
  "bus stand": "Ward 1", 
  "market": "Ward 2",
  "hospital": "Ward 3",
  "school": "Ward 4",
  "temple": "Ward 5",
  "police station": "Ward 1",
  "post office": "Ward 2"
};

// ============================================
// MULTI-LANGUAGE PROCESSING
// ============================================

/**
 * Detect language of input text
 * Returns: 'english', 'marathi', 'hindi', or 'mixed'
 */
function detectLanguage(text) {
  const devanagariRegex = /[\u0900-\u097F]/g;
  const devanagariMatches = text.match(devanagariRegex);
  const englishRegex = /[a-zA-Z]/g;
  const englishMatches = text.match(englishRegex);
  
  const devanagariCount = devanagariMatches ? devanagariMatches.length : 0;
  const englishCount = englishMatches ? englishMatches.length : 0;
  
  if (devanagariCount > englishCount && devanagariCount > 5) {
    return devanagariCount > 30 ? 'marathi' : 'hindi';
  } else if (englishCount > devanagariCount && englishCount > 5) {
    return 'english';
  } else if (devanagariCount > 0 && englishCount > 0) {
    return 'mixed';
  }
  
  return 'english';
}

/**
 * Classify category using multi-language support
 */
function classifyCategoryMultilingual(text) {
  const normalizedText = text.toLowerCase();
  const language = detectLanguage(text);
  
  const scores = {};
  let allKeywords = {};
  
  // English keywords from existing service
  const aiCategorizationService = require('./aiCategorizationService');
  if (aiCategorizationService && aiCategorizationService.CATEGORY_KEYWORDS) {
    allKeywords = { ...aiCategorizationService.CATEGORY_KEYWORDS };
  }
  
  // Add Marathi keywords
  if (language === 'marathi' || language === 'mixed') {
    Object.entries(MARATHI_KEYWORDS).forEach(([category, keywords]) => {
      if (!allKeywords[category]) allKeywords[category] = [];
      allKeywords[category] = [...(allKeywords[category] || []), ...keywords];
    });
  }
  
  // Add Hindi keywords
  if (language === 'hindi' || language === 'mixed') {
    Object.entries(HINDI_KEYWORDS).forEach(([category, keywords]) => {
      if (!allKeywords[category]) allKeywords[category] = [];
      allKeywords[category] = [...(allKeywords[category] || []), ...keywords];
    });
  }
  
  // Calculate scores
  for (const [category, keywords] of Object.entries(allKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        score += keyword.split(" ").length;
      }
    }
    scores[category] = score;
  }
  
  // Find best category
  let bestCategory = "Other";
  let maxScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.3;
  
  return {
    category: bestCategory,
    confidence: Math.min(confidence, 1.0),
    detectedLanguage: language,
    scores
  };
}

/**
 * Predict priority with multi-language support
 */
function predictPriorityMultilingual(text) {
  const normalizedText = text.toLowerCase();
  const language = detectLanguage(text);
  
  const urgencyScores = { high: 0, medium: 0, low: 0 };
  const detectedKeywords = [];
  
  // English urgency keywords
  const englishUrgency = {
    high: ["urgent", "emergency", "immediate", "critical", "dangerous", "severe", "accident", "fire", "flood", "injury"],
    medium: ["important", "significant", "moderate", "problem", "issue"],
    low: ["minor", "small", "suggestion", "improvement"]
  };
  
  // Marathi urgency keywords (romanized)
  const marathiUrgency = {
    high: ["tatdij", "apatkalik", "tvarit", "ganbhik", "dhokadak", "apgat", "ag", "pur"],
    medium: ["mhatvache", "samjas", "prashn", "madhyam"],
    low: ["lahan", "suchana", "sudhrana"]
  };
  
  // Check English
  for (const [level, keywords] of Object.entries(englishUrgency)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        urgencyScores[level]++;
        if (!detectedKeywords.includes(keyword)) detectedKeywords.push(keyword);
      }
    }
    if (language === 'marathi' || language === 'mixed') {
      const marathiKw = marathiUrgency[level] || [];
      for (const keyword of marathiKw) {
        if (normalizedText.includes(keyword)) {
          urgencyScores[level]++;
          if (!detectedKeywords.includes(keyword)) detectedKeywords.push(keyword);
        }
      }
    }
  }
  
  let priority = "medium";
  if (urgencyScores.high > 0) priority = "high";
  else if (urgencyScores.low > urgencyScores.medium) priority = "low";
  
  return {
    priority,
    confidence: Math.min((Math.max(...Object.values(urgencyScores)) + 1) / 5, 1.0),
    detectedKeywords: detectedKeywords.slice(0, 3),
    detectedLanguage: language,
    scores: urgencyScores
  };
}

// ============================================
// AUTO-WARD DETECTION
// ============================================

/**
 * Auto-detect ward from address text
 */
function detectWardFromAddress(address) {
  if (!address) {
    return { detectedWard: null, confidence: 0, method: 'none' };
  }
  
  const normalizedAddress = address.toLowerCase();
  let bestWard = null;
  let highestScore = 0;
  
  // Method 1: Direct ward pattern matching
  for (const [ward, patterns] of Object.entries(WARD_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (normalizedAddress.includes(pattern.toLowerCase())) {
        score += 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestWard = ward;
    }
  }
  
  // Method 2: Landmark-based detection
  if (!bestWard) {
    for (const [landmark, ward] of Object.entries(LANDMARK_WARD_MAP)) {
      if (normalizedAddress.includes(landmark.toLowerCase())) {
        bestWard = ward;
        highestScore = 1;
        break;
      }
    }
  }
  
  // Method 3: Numeric ward detection
  if (!bestWard) {
    const wardNumberMatch = normalizedAddress.match(/ward[\s-]*(\d+)/);
    if (wardNumberMatch) {
      const wardNum = parseInt(wardNumberMatch[1]);
      if (wardNum >= 1 && wardNum <= 5) {
        bestWard = `Ward ${wardNum}`;
        highestScore = 3;
      }
    }
  }
  
  const confidence = highestScore > 0 ? Math.min(highestScore / 3, 1) : 0;
  
  return {
    detectedWard: bestWard,
    confidence: confidence,
    method: bestWard ? (highestScore >= 2 ? 'pattern' : highestScore >= 1 ? 'landmark' : 'number') : 'none'
  };
}

// ============================================
// ENHANCED DUPLICATE DETECTION
// ============================================

/**
 * Jaccard Similarity - word-based
 */
function calculateJaccardSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

/**
 * Levenshtein Similarity - character-based
 */
function calculateLevenshteinSimilarity(text1, text2) {
  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * Calculate advanced similarity with multiple algorithms
 */
function calculateAdvancedSimilarity(text1, text2) {
  const jaccardSimilarity = calculateJaccardSimilarity(text1, text2);
  const levenshteinSimilarity = calculateLevenshteinSimilarity(text1, text2);
  return (jaccardSimilarity * 0.6) + (levenshteinSimilarity * 0.4);
}

/**
 * Enhanced duplicate detection
 */
async function detectDuplicatesEnhanced(title, description, ward, options = {}) {
  const {
    similarityThreshold = 0.6,
    timeWindowDays = 30,
    limit = 5,
    useAdvancedMatching = true
  } = options;
  
  try {
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - timeWindowDays);
    
    const existingComplaints = await Grievance.find({
      ward,
      createdAt: { $gte: timeLimit },
      status: { $in: ["pending", "in-progress"] }
    })
    .select("complaintId title description category status createdAt location")
    .limit(100)
    .lean();
    
    const combinedText = `${title} ${description}`;
    const duplicates = [];
    
    for (const complaint of existingComplaints) {
      const existingText = `${complaint.title} ${complaint.description}`;
      const similarity = useAdvancedMatching 
        ? calculateAdvancedSimilarity(combinedText, existingText)
        : calculateJaccardSimilarity(combinedText, existingText);
      
      if (similarity >= similarityThreshold) {
        duplicates.push({
          complaintId: complaint.complaintId,
          title: complaint.title,
          category: complaint.category,
          status: complaint.status,
          similarity: parseFloat((similarity * 100).toFixed(2)),
          createdAt: complaint.createdAt,
          matchType: similarity >= 0.85 ? 'exact' : similarity >= 0.7 ? 'close' : 'similar'
        });
      }
    }
    
    duplicates.sort((a, b) => b.similarity - a.similarity);
    
    return {
      isDuplicate: duplicates.length > 0,
      duplicateCount: duplicates.length,
      textMatches: duplicates.slice(0, limit),
      locationMatches: [],
      recommendation: duplicates.length > 0 
        ? `Found ${duplicates.length} similar complaints. Consider reviewing before submission.`
        : 'No duplicates detected.'
    };
  } catch (error) {
    console.error("Enhanced duplicate detection error:", error);
    return {
      isDuplicate: false,
      duplicateCount: 0,
      textMatches: [],
      locationMatches: [],
      error: error.message
    };
  }
}

// ============================================
// COMPREHENSIVE AI ANALYSIS
// ============================================

/**
 * Complete enhanced AI analysis
 */
async function analyzeComplaintEnhanced(complaintData) {
  const { title, description, address, ward } = complaintData;
  const combinedText = `${title} ${description}`;
  
  try {
    const [categoryResult, priorityResult, duplicateResult] = await Promise.all([
      Promise.resolve(classifyCategoryMultilingual(combinedText)),
      Promise.resolve(predictPriorityMultilingual(combinedText)),
      detectDuplicatesEnhanced(title, description, ward || "Ward 1")
    ]);
    
    const wardDetection = address ? detectWardFromAddress(address) : { detectedWard: ward, confidence: 1, method: 'provided' };
    const finalWard = ward || wardDetection.detectedWard;
    
    return {
      success: true,
      language: {
        detected: categoryResult.detectedLanguage,
        confidence: categoryResult.confidence
      },
      categorization: {
        suggestedCategory: categoryResult.category,
        confidence: parseFloat((categoryResult.confidence * 100).toFixed(2)),
        alternativeCategories: Object.entries(categoryResult.scores)
          .filter(([cat]) => cat !== categoryResult.category)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat, score]) => ({
            category: cat,
            score: parseFloat((score / Math.max(...Object.values(categoryResult.scores))).toFixed(2))
          }))
      },
      priority: {
        suggestedPriority: priorityResult.priority,
        confidence: parseFloat((priorityResult.confidence * 100).toFixed(2)),
        detectedKeywords: priorityResult.detectedKeywords
      },
      duplicates: duplicateResult,
      wardDetection: {
        detectedWard: finalWard,
        detectionMethod: wardDetection.method,
        confidence: parseFloat((wardDetection.confidence * 100).toFixed(2)),
        wasAutoDetected: !ward || wardDetection.method !== 'provided'
      },
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Enhanced AI Analysis Error:", error);
    return {
      success: false,
      error: error.message,
      categorization: { suggestedCategory: "Other", confidence: 0 },
      priority: { suggestedPriority: "medium", confidence: 0 },
      duplicates: { isDuplicate: false, matches: [] },
      wardDetection: { detectedWard: ward || null, confidence: 0 }
    };
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  detectLanguage,
  classifyCategoryMultilingual,
  predictPriorityMultilingual,
  detectWardFromAddress,
  detectDuplicatesEnhanced,
  calculateAdvancedSimilarity,
  calculateJaccardSimilarity,
  analyzeComplaintEnhanced,
  MARATHI_KEYWORDS,
  HINDI_KEYWORDS,
  WARD_PATTERNS,
  LANDMARK_WARD_MAP
};
