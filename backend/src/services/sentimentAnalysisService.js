const Grievance = require("../models/Grievance");

/**
 * Sentiment Analysis Service
 * Provides real-time sentiment analysis for complaint text
 * Uses lexicon-based approach with polarity scoring
 * Zero-Regression Strategy: New service layer, extends existing AI features
 */

// Sentiment lexicons with polarity scores (-1 to 1)
const SENTIMENT_LEXICON = {
  // Positive sentiment words
  positive: {
    "good": 0.5, "great": 0.8, "excellent": 0.9, "amazing": 0.9, "wonderful": 0.8,
    "fantastic": 0.9, "awesome": 0.8, "brilliant": 0.8, "outstanding": 0.9,
    "satisfied": 0.7, "pleased": 0.6, "happy": 0.7, "delighted": 0.8,
    "thankful": 0.7, "grateful": 0.7, "appreciative": 0.8, "impressed": 0.8,
    "perfect": 0.9, "ideal": 0.8, "superb": 0.9, "marvelous": 0.8,
    "satisfactory": 0.7, "adequate": 0.5, "acceptable": 0.5, "sufficient": 0.5,
    "improved": 0.6, "better": 0.6, "progress": 0.6, "enhanced": 0.7
  },
  
  // Negative sentiment words
  negative: {
    "bad": -0.5, "terrible": -0.8, "awful": -0.9, "horrible": -0.9, "worst": -0.9,
    "disappointing": -0.7, "frustrating": -0.8, "annoying": -0.6, "irritating": -0.7,
    "angry": -0.8, "mad": -0.7, "upset": -0.6, "furious": -0.9,
    "hate": -0.9, "dislike": -0.7, "despise": -0.9, "loathe": -0.9,
    "poor": -0.6, "inadequate": -0.7, "unsatisfactory": -0.8, "subpar": -0.7,
    "delayed": -0.5, "broken": -0.6, "failed": -0.7, "malfunction": -0.7,
    "unhappy": -0.7, "displeased": -0.7, "regret": -0.6, "sorry": -0.5,
    "wrong": -0.6, "incorrect": -0.6, "mistake": -0.6, "error": -0.6,
    "problem": -0.5, "issue": -0.4, "concern": -0.4, "complaint": -0.3,
    "urgent": -0.4, "emergency": -0.5, "critical": -0.6, "severe": -0.7,
    "dangerous": -0.8, "unsafe": -0.7, "risky": -0.6, "hazardous": -0.8
  }
};

// Intensifiers that amplify sentiment
const INTENSIFIERS = {
  "very": 1.5, "extremely": 2.0, "incredibly": 2.0, "highly": 1.5, "really": 1.3,
  "totally": 1.5, "completely": 1.8, "absolutely": 1.8, "quite": 1.2, "rather": 1.1,
  "too": 1.3, "so": 1.4, "much": 1.2, "far": 1.2, "pretty": 1.1
};

// Negation words that reverse sentiment
const NEGATIONS = [
  "not", "no", "never", "nothing", "nowhere", "nobody", "none", "neither", 
  "nor", "cannot", "cant", "couldnt", "shouldnt", "wont", "wouldnt", "dont", 
  "doesnt", "didnt", "isnt", "arent", "wasnt", "werent", "havent", "hasnt", 
  "hadnt", "mustnt", "neednt", "shant"
];

/**
 * Preprocess text: normalize, tokenize, and handle negations
 */
function preprocessText(text) {
  if (!text) return [];
  
  // Normalize text: lowercase, remove extra whitespace, punctuation
  let tokens = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
  
  // Handle negation scope (negation affects next few words)
  tokens = handleNegations(tokens);
  
  return tokens;
}

/**
 * Handle negation scope by marking affected words
 */
function handleNegations(tokens) {
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    result.push(token);
    
    // If current token is a negation, mark the next few words as negated
    if (NEGATIONS.includes(token)) {
      for (let j = i + 1; j < Math.min(i + 4, tokens.length); j++) {
        if (!tokens[j].startsWith('NOT_')) {
          result[j] = `NOT_${tokens[j]}`;
        }
      }
    }
  }
  
  return result;
}

/**
 * Analyze sentiment of text
 */
function analyzeSentiment(text) {
  const tokens = preprocessText(text);
  let score = 0;
  let wordCount = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    let isNegated = false;
    
    // Check if token is negated
    if (token.startsWith('NOT_')) {
      isNegated = true;
      token = token.substring(4); // Remove NOT_ prefix
    }
    
    // Check for intensifiers affecting the next word
    let intensityMultiplier = 1.0;
    if (i > 0 && INTENSIFIERS[tokens[i - 1]]) {
      intensityMultiplier = INTENSIFIERS[tokens[i - 1]];
    }
    
    // Look for sentiment words
    if (SENTIMENT_LEXICON.positive[token]) {
      let wordScore = SENTIMENT_LEXICON.positive[token];
      if (isNegated) wordScore *= -1;
      wordScore *= intensityMultiplier;
      score += wordScore;
      wordCount++;
    } else if (SENTIMENT_LEXICON.negative[token]) {
      let wordScore = SENTIMENT_LEXICON.negative[token];
      if (isNegated) wordScore *= -1;
      wordScore *= intensityMultiplier;
      score += wordScore;
      wordCount++;
    }
  }
  
  // Normalize score to [-1, 1] range
  const normalizedScore = wordCount > 0 ? score / wordCount : 0;
  
  // Determine sentiment category
  let category = 'neutral';
  if (normalizedScore > 0.1) category = 'positive';
  else if (normalizedScore < -0.1) category = 'negative';
  
  return {
    score: parseFloat(normalizedScore.toFixed(3)),
    magnitude: parseFloat(Math.abs(normalizedScore).toFixed(3)),
    category,
    breakdown: {
      positiveWords: getSentimentWords(text, 'positive'),
      negativeWords: getSentimentWords(text, 'negative'),
      wordCount: tokens.length,
      sentimentWordCount: wordCount
    }
  };
}

/**
 * Extract specific sentiment words from text
 */
function getSentimentWords(text, sentimentType) {
  const tokens = preprocessText(text);
  const sentimentWords = [];
  
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    let isNegated = false;
    
    if (token.startsWith('NOT_')) {
      isNegated = true;
      token = token.substring(4);
    }
    
    const lexicon = SENTIMENT_LEXICON[sentimentType];
    if (lexicon[token]) {
      sentimentWords.push({
        word: token,
        score: isNegated ? lexicon[token] * -1 : lexicon[token],
        isNegated
      });
    }
  }
  
  return sentimentWords;
}

/**
 * Get sentiment insights for a complaint
 */
function getSentimentInsights(sentimentAnalysis) {
  const { score, category, breakdown } = sentimentAnalysis;
  
  let insights = [];
  
  // Emotional intensity
  if (breakdown.magnitude > 0.7) {
    insights.push("High emotional intensity detected - consider empathetic response");
  } else if (breakdown.magnitude > 0.4) {
    insights.push("Moderate emotional tone - acknowledge feelings in response");
  }
  
  // Sentiment category specific insights
  if (category === 'negative') {
    if (score < -0.7) {
      insights.push("Extremely negative sentiment - prioritize urgent response");
    } else if (score < -0.4) {
      insights.push("Strongly negative sentiment - requires careful handling");
    } else {
      insights.push("Mildly negative sentiment - standard response protocol");
    }
  } else if (category === 'positive') {
    if (score > 0.7) {
      insights.push("Extremely positive sentiment - excellent service recognition");
    } else if (score > 0.4) {
      insights.push("Strongly positive sentiment - good service acknowledgment");
    } else {
      insights.push("Mildly positive sentiment - satisfactory service noted");
    }
  }
  
  // Word analysis insights
  if (breakdown.positiveWords.length > breakdown.negativeWords.length * 2) {
    insights.push("More positive indicators than negative - mixed but leaning positive");
  } else if (breakdown.negativeWords.length > breakdown.positiveWords.length * 2) {
    insights.push("More negative indicators than positive - focus on concerns");
  }
  
  return insights;
}

/**
 * Analyze sentiment for a complaint document
 */
async function analyzeComplaintSentiment(complaintId) {
  try {
    const complaint = await Grievance.findById(complaintId);
    if (!complaint) {
      throw new Error(`Complaint with ID ${complaintId} not found`);
    }
    
    const combinedText = `${complaint.title} ${complaint.description}`.trim();
    const sentiment = analyzeSentiment(combinedText);
    const insights = getSentimentInsights(sentiment);
    
    return {
      complaintId: complaint.complaintId,
      sentiment,
      insights,
      analysisTimestamp: new Date().toISOString(),
      metadata: {
        titleLength: complaint.title?.length || 0,
        descriptionLength: complaint.description?.length || 0,
        totalLength: combinedText.length
      }
    };
  } catch (error) {
    console.error("Complaint sentiment analysis error:", error);
    throw error;
  }
}

/**
 * Batch analyze sentiment for multiple complaints
 */
async function batchAnalyzeSentiment(complaintIds) {
  try {
    const complaints = await Grievance.find({ _id: { $in: complaintIds } });
    const results = [];
    
    for (const complaint of complaints) {
      try {
        const combinedText = `${complaint.title} ${complaint.description}`.trim();
        const sentiment = analyzeSentiment(combinedText);
        const insights = getSentimentInsights(sentiment);
        
        results.push({
          complaintId: complaint.complaintId,
          sentiment,
          insights,
          analysisTimestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error analyzing complaint ${complaint.complaintId}:`, error);
        results.push({
          complaintId: complaint.complaintId,
          error: error.message,
          sentiment: { score: 0, magnitude: 0, category: 'neutral' }
        });
      }
    }
    
    return {
      totalProcessed: results.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results
    };
  } catch (error) {
    console.error("Batch sentiment analysis error:", error);
    throw error;
  }
}

/**
 * Get sentiment statistics for complaints
 */
async function getSentimentStatistics(options = {}) {
  try {
    const { startDate, endDate, category, priority, ward } = options;
    const filters = {};
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (ward) filters.ward = ward;
    
    const complaints = await Grievance.find(filters);
    const sentimentAnalyses = [];
    
    for (const complaint of complaints) {
      const combinedText = `${complaint.title} ${complaint.description}`.trim();
      const sentiment = analyzeSentiment(combinedText);
      sentimentAnalyses.push(sentiment);
    }
    
    // Calculate aggregate statistics
    const total = sentimentAnalyses.length;
    if (total === 0) {
      return {
        total: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        averageScore: 0,
        averageMagnitude: 0
      };
    }
    
    const positive = sentimentAnalyses.filter(s => s.category === 'positive').length;
    const negative = sentimentAnalyses.filter(s => s.category === 'negative').length;
    const neutral = sentimentAnalyses.filter(s => s.category === 'neutral').length;
    
    const averageScore = sentimentAnalyses.reduce((sum, s) => sum + s.score, 0) / total;
    const averageMagnitude = sentimentAnalyses.reduce((sum, s) => sum + s.magnitude, 0) / total;
    
    return {
      total,
      positive,
      negative,
      neutral,
      positivePercentage: parseFloat(((positive / total) * 100).toFixed(2)),
      negativePercentage: parseFloat(((negative / total) * 100).toFixed(2)),
      neutralPercentage: parseFloat(((neutral / total) * 100).toFixed(2)),
      averageScore: parseFloat(averageScore.toFixed(3)),
      averageMagnitude: parseFloat(averageMagnitude.toFixed(3))
    };
  } catch (error) {
    console.error("Sentiment statistics error:", error);
    throw error;
  }
}

module.exports = {
  analyzeSentiment,
  analyzeComplaintSentiment,
  batchAnalyzeSentiment,
  getSentimentStatistics,
  getSentimentInsights,
  SENTIMENT_LEXICON,
  INTENSIFIERS,
  NEGATIONS
};