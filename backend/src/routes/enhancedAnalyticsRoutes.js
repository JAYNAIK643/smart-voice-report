const express = require("express");
const {
  getEnhancedAnalytics,
  getWardAnalytics
} = require("../controllers/enhancedAnalyticsController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Enhanced Analytics Routes
 * Provides comprehensive dashboard analytics and reporting
 * Zero-Regression Strategy: New routes, extends existing analytics
 */

// Apply authentication middleware
router.use(authenticateUser);

/**
 * GET /api/analytics/enhanced
 * Get enhanced analytics data for dashboard
 */
router.get("/enhanced", authorizeRoles(["admin", "ward_admin"]), getEnhancedAnalytics);

/**
 * GET /api/analytics/ward/:wardId
 * Get analytics data for specific ward
 */
router.get("/ward/:wardId", authorizeRoles(["admin", "ward_admin"]), getWardAnalytics);

module.exports = router;