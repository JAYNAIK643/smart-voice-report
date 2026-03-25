const express = require("express");
const {
  getKPIs,
  generateReport,
  getComparativeAnalytics,
  createDashboard,
  getDashboards,
  getDashboardById,
  updateDashboard,
  deleteDashboard,
  getWidgetData,
  shareDashboard
} = require("../controllers/advancedAnalyticsController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Advanced Analytics & Reporting Routes
 * Provides KPI tracking, custom dashboards, and report generation
 * Zero-Regression Strategy: New routes, extends existing analytics
 */

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/advanced-analytics/kpis
 * Get KPIs for a given period
 */
router.get("/kpis", authorizeRoles(["admin", "ward_admin"]), getKPIs);

/**
 * POST /api/advanced-analytics/reports/generate
 * Generate custom report
 */
router.post("/reports/generate", authorizeRoles(["admin", "ward_admin"]), generateReport);

/**
 * GET /api/advanced-analytics/comparative
 * Get comparative analytics
 */
router.get("/comparative", authorizeRoles(["admin", "ward_admin"]), getComparativeAnalytics);

/**
 * POST /api/advanced-analytics/dashboards
 * Create custom dashboard
 */
router.post("/dashboards", createDashboard);

/**
 * GET /api/advanced-analytics/dashboards
 * Get user's dashboards
 */
router.get("/dashboards", getDashboards);

/**
 * GET /api/advanced-analytics/dashboards/:id
 * Get single dashboard by ID
 */
router.get("/dashboards/:id", getDashboardById);

/**
 * PUT /api/advanced-analytics/dashboards/:id
 * Update dashboard
 */
router.put("/dashboards/:id", updateDashboard);

/**
 * DELETE /api/advanced-analytics/dashboards/:id
 * Delete dashboard
 */
router.delete("/dashboards/:id", deleteDashboard);

/**
 * POST /api/advanced-analytics/dashboards/:id/share
 * Share dashboard with users
 */
router.post("/dashboards/:id/share", shareDashboard);

/**
 * POST /api/advanced-analytics/widgets/data
 * Get widget data
 */
router.post("/widgets/data", getWidgetData);

module.exports = router;
