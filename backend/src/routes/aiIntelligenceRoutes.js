const express = require("express");
const {
  analyzeComplaint,
  suggestCategory,
  predictPriority,
  checkDuplicates,
  suggestRouting,
  getAIStats,
  batchAnalyze
} = require("../controllers/aiIntelligenceController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * AI Intelligence Routes
 * Provides AI-powered complaint analysis, categorization, and smart routing
 * Zero-Regression Strategy: New routes, extends existing API
 */

// Public/User AI endpoints (require authentication)
router.use(authenticateUser);

/**
 * POST /api/ai/analyze-complaint
 * Complete AI analysis for a complaint (categorization + priority + duplicates + routing)
 */
router.post("/analyze-complaint", analyzeComplaint);

/**
 * POST /api/ai/suggest-category
 * Get category suggestions based on complaint text
 */
router.post("/suggest-category", suggestCategory);

/**
 * POST /api/ai/predict-priority
 * Predict priority level based on complaint text
 */
router.post("/predict-priority", predictPriority);

/**
 * POST /api/ai/check-duplicates
 * Check for duplicate complaints
 */
router.post("/check-duplicates", checkDuplicates);

// Admin-only AI endpoints
router.use(authorizeRoles(["admin", "ward_admin"]));

/**
 * POST /api/ai/suggest-routing
 * Get smart routing recommendations
 */
router.post("/suggest-routing", suggestRouting);

/**
 * GET /api/ai/stats
 * Get AI categorization statistics and insights
 */
router.get("/stats", getAIStats);

/**
 * POST /api/ai/batch-analyze
 * Batch analyze multiple complaints (admin only)
 */
router.post("/batch-analyze", batchAnalyze);

module.exports = router;
