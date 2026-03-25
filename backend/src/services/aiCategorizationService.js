const Grievance = require("../models/Grievance");

/**
 * AI-Powered Categorization Service
 * Provides intelligent complaint classification, priority prediction, and duplicate detection
 * Zero-Regression Strategy: New service layer, no modification to existing code
 */

// Category keywords mapping for NLP-based classification
const CATEGORY_KEYWORDS = {
  "Water Supply": [
    "water", "tap", "pipeline", "leakage", "drainage", "supply", "contamination",
    "drinking water", "water tank", "pipe burst", "no water", "dirty water"
  ],
  "Road Maintenance": [
    "road", "pothole", "street", "highway", "pavement", "crack", "repair",
    "asphalt", "broken road", "damaged road", "street light", "traffic"
  ],
  "Garbage Collection": [
    "garbage", "waste", "trash", "dustbin", "sanitation", "cleaning", "disposal",
    "litter", "dump", "sweeping", "collection", "rubbish", "smell", "dirty"
  ],
  "Street Lighting": [
    "light", "lamp", "streetlight", "bulb", "dark", "lighting", "illumination",
    "pole", "electric", "night", "broken light", "no light"
  ],
  "Electricity": [
    "electricity", "power", "current", "voltage", "transformer", "outage",
    "electric pole", "wire", "blackout", "power cut", "meter", "bill"
  ],
  "Sewage": [
    "sewage", "sewer", "drain", "overflow", "blockage", "manhole", "wastewater",
    "clogged", "drainage system", "septic", "stagnant water"
  ],
  "Public Safety": [
    "safety", "crime", "theft", "violence", "accident", "emergency", "danger",
    "security", "police", "fire", "ambulance", "hazard"
  ],
  "Parks & Recreation": [
    "park", "garden", "playground", "recreation", "bench", "tree", "greenery",
    "children", "play area", "maintenance", "lawn"
  ],
  "Other": ["other", "miscellaneous", "general", "complaint"]
};

// Priority/Urgency keywords
const URGENCY_KEYWORDS = {
  high: [
    "urgent", "emergency", "immediate", "critical", "dangerous", "severe",
    "life threatening", "major", "serious", "broken", "burst", "overflow",
    "accident", "fire", "flood", "injury", "death", "explosion"
  ],
  medium: [
    "important", "significant", "moderate", "affecting", "inconvenient",
    "problem", "issue", "concern", "needs attention", "repair needed"
  ],
  low: [
    "minor", "small", "slight", "cosmetic", "aesthetic", "improvement",
    "suggestion", "request", "eventually", "when possible"
  ]
};

// Department routing based on category
const DEPARTMENT_ROUTING = {
  "Water Supply": "Water Works Department",
  "Road Maintenance": "Public Works Department",
  "Garbage Collection": "Sanitation Department",
  "Street Lighting": "Electrical Department",
  "Electricity": "Electrical Department",
  "Sewage": "Sanitation Department",
  "Public Safety": "Municipal Security Department",
  "Parks & Recreation": "Parks & Horticulture Department",
  "Other": "General Administration"
};

/**
 * Calculate text similarity using Jaccard similarity
 */
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * NLP-based category classification
 */
function classifyCategory(text) {
  const normalizedText = text.toLowerCase();
  const scores = {};
  
  // Calculate score for each category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        // Weight longer keywords higher
        score += keyword.split(" ").length;
      }
    }
    scores[category] = score;
  }
  
  // Find category with highest score
  let bestCategory = "Other";
  let maxScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }
  
  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.3;
  
  return {
    category: bestCategory,
    confidence: Math.min(confidence, 1.0),
    scores
  };
}

/**
 * Predict priority/urgency level
 */
function predictPriority(text) {
  const normalizedText = text.toLowerCase();
  const urgencyScores = { high: 0, medium: 0, low: 0 };
  
  // Count urgency keywords
  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        urgencyScores[level]++;
      }
    }
  }
  
  // Determine priority level
  let priority = "medium"; // default
  let detectedKeywords = [];
  
  if (urgencyScores.high > 0) {
    priority = "high";
    detectedKeywords = URGENCY_KEYWORDS.high.filter(k => normalizedText.includes(k));
  } else if (urgencyScores.low > urgencyScores.medium) {
    priority = "low";
    detectedKeywords = URGENCY_KEYWORDS.low.filter(k => normalizedText.includes(k));
  } else if (urgencyScores.medium > 0) {
    priority = "medium";
    detectedKeywords = URGENCY_KEYWORDS.medium.filter(k => normalizedText.includes(k));
  }
  
  return {
    priority,
    confidence: Math.min((Math.max(...Object.values(urgencyScores)) + 1) / 5, 1.0),
    detectedKeywords: detectedKeywords.slice(0, 3),
    scores: urgencyScores
  };
}

/**
 * Detect duplicate complaints
 */
async function detectDuplicates(title, description, ward, options = {}) {
  const {
    similarityThreshold = 0.7,
    timeWindowDays = 30,
    limit = 5
  } = options;
  
  try {
    // Search for similar complaints in the same ward within time window
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - timeWindowDays);
    
    const existingComplaints = await Grievance.find({
      ward,
      createdAt: { $gte: timeLimit },
      status: { $in: ["pending", "in-progress"] }
    })
    .select("complaintId title description category status createdAt")
    .limit(100) // Limit for performance
    .lean();
    
    const combinedText = `${title} ${description}`;
    const duplicates = [];
    
    for (const complaint of existingComplaints) {
      const existingText = `${complaint.title} ${complaint.description}`;
      const similarity = calculateSimilarity(combinedText, existingText);
      
      if (similarity >= similarityThreshold) {
        duplicates.push({
          complaintId: complaint.complaintId,
          title: complaint.title,
          category: complaint.category,
          status: complaint.status,
          similarity: parseFloat((similarity * 100).toFixed(2)),
          createdAt: complaint.createdAt
        });
      }
    }
    
    // Sort by similarity
    duplicates.sort((a, b) => b.similarity - a.similarity);
    
    return {
      isDuplicate: duplicates.length > 0,
      duplicateCount: duplicates.length,
      matches: duplicates.slice(0, limit)
    };
  } catch (error) {
    console.error("Duplicate detection error:", error);
    return {
      isDuplicate: false,
      duplicateCount: 0,
      matches: [],
      error: error.message
    };
  }
}

/**
 * Smart routing - determine best department and official
 */
function determineRouting(category, ward, priority) {
  const department = DEPARTMENT_ROUTING[category] || DEPARTMENT_ROUTING["Other"];
  
  // Generate routing recommendations
  const routing = {
    department,
    ward,
    priority,
    estimatedResponseTime: getEstimatedResponseTime(priority),
    escalationRequired: priority === "high",
    recommendations: []
  };
  
  // Add priority-based recommendations
  if (priority === "high") {
    routing.recommendations.push("Immediate attention required");
    routing.recommendations.push("Notify ward supervisor");
    routing.recommendations.push("Set 24-hour resolution target");
  } else if (priority === "medium") {
    routing.recommendations.push("Standard processing");
    routing.recommendations.push("72-hour resolution target");
  } else {
    routing.recommendations.push("Normal queue processing");
    routing.recommendations.push("7-day resolution target");
  }
  
  return routing;
}

/**
 * Get estimated response time based on priority
 */
function getEstimatedResponseTime(priority) {
  const times = {
    high: "24 hours",
    medium: "72 hours",
    low: "7 days"
  };
  return times[priority] || times.medium;
}

/**
 * Complete AI analysis for a complaint
 */
async function analyzeComplaint(complaintData) {
  const { title, description, ward } = complaintData;
  const combinedText = `${title} ${description}`;
  
  try {
    // Run all AI analyses in parallel
    const [categoryResult, priorityResult, duplicateResult] = await Promise.all([
      Promise.resolve(classifyCategory(combinedText)),
      Promise.resolve(predictPriority(combinedText)),
      detectDuplicates(title, description, ward)
    ]);
    
    // Determine smart routing
    const routing = determineRouting(
      categoryResult.category,
      ward,
      priorityResult.priority
    );
    
    return {
      success: true,
      categorization: {
        suggestedCategory: categoryResult.category,
        confidence: parseFloat((categoryResult.confidence * 100).toFixed(2)),
        alternativeCategories: Object.entries(categoryResult.scores)
          .filter(([cat]) => cat !== categoryResult.category)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([cat, score]) => ({
            category: cat,
            score: parseFloat((score / Math.max(...Object.values(categoryResult.scores))).toFixed(2))
          }))
      },
      priority: {
        suggestedPriority: priorityResult.priority,
        confidence: parseFloat((priorityResult.confidence * 100).toFixed(2)),
        detectedKeywords: priorityResult.detectedKeywords,
        reasoning: `Detected ${priorityResult.detectedKeywords.length} urgency indicators`
      },
      duplicates: duplicateResult,
      routing,
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      success: false,
      error: error.message,
      categorization: { suggestedCategory: "Other", confidence: 0 },
      priority: { suggestedPriority: "medium", confidence: 0 },
      duplicates: { isDuplicate: false, matches: [] },
      routing: { department: "General Administration" }
    };
  }
}

module.exports = {
  classifyCategory,
  predictPriority,
  detectDuplicates,
  determineRouting,
  analyzeComplaint,
  CATEGORY_KEYWORDS,
  URGENCY_KEYWORDS,
  DEPARTMENT_ROUTING
};
