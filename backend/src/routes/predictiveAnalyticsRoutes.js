const express = require("express");
const {
  getComplaintForecast,
  getSLACompliance,
  getHotspots,
  getPredictiveDashboard,
  getResourcePlanning
} = require("../controllers/predictiveAnalyticsController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Predictive Analytics Routes
 * Provides trend forecasting, SLA tracking, and hotspot identification
 * Zero-Regression Strategy: New routes, extends existing analytics
 */

// Apply authentication and admin authorization to all routes
router.use(authenticateUser);
router.use(authorizeRoles(["admin", "ward_admin"]));

/**
 * GET /api/predictive/forecast
 * Get complaint trend forecast with predictions
 */
router.get("/forecast", getComplaintForecast);

/**
 * GET /api/predictive/sla-compliance
 * Get SLA compliance metrics and tracking
 */
router.get("/sla-compliance", getSLACompliance);

/**
 * GET /api/predictive/hotspots
 * Get geographic hotspots and problem areas
 */
router.get("/hotspots", getHotspots);

/**
 * GET /api/predictive/dashboard
 * Get complete predictive analytics dashboard (all data in one call)
 */
router.get("/dashboard", getPredictiveDashboard);

/**
 * GET /api/predictive/resource-planning
 * Get resource planning recommendations
 */
router.get("/resource-planning", getResourcePlanning);

module.exports = router;
