const express = require("express");
const {
  analyzeSentiment,
  analyzeComplaintSentiment,
  batchAnalyzeSentiment,
  getSentimentStatistics,
  getSentimentTrends
} = require("../controllers/sentimentAnalysisController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Sentiment Analysis Routes
 * Provides real-time sentiment analysis for complaint text
 * Zero-Regression Strategy: New routes, extends existing AI features
 */

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * POST /api/ai/sentiment/analyze
 * Analyze sentiment of given text
 */
router.post("/analyze", analyzeSentiment);

/**
 * GET /api/ai/sentiment/complaint/:id
 * Analyze sentiment of specific complaint
 */
router.get("/complaint/:id", authenticateUser, analyzeComplaintSentiment);

// Admin-only routes
router.use(authorizeRoles(["admin", "ward_admin"]));

/**
 * POST /api/ai/sentiment/batch-analyze
 * Batch analyze sentiment for multiple complaints
 */
router.post("/batch-analyze", batchAnalyzeSentiment);

/**
 * GET /api/ai/sentiment/statistics
 * Get sentiment statistics
 */
router.get("/statistics", getSentimentStatistics);

/**
 * GET /api/ai/sentiment/trends
 * Get sentiment trends over time
 */
router.get("/trends", getSentimentTrends);

module.exports = router;
