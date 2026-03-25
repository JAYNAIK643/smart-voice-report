const express = require("express");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Advanced Analytics Routes (Legacy)
 * DEPRECATED: Use advancedReportingRoutes.js instead
 * Keeping for backward compatibility
 */

// Apply protection to all routes
router.use(authenticateUser);
router.use(authorizeRoles(["admin", "ward_admin"]));

// Placeholder endpoints - redirect to new routes if needed
router.get("/advanced-metrics", (req, res) => {
  res.status(200).json({ success: true, message: "Use /api/advanced-analytics/kpis instead" });
});

router.get("/performance", (req, res) => {
  res.status(200).json({ success: true, message: "Use /api/advanced-analytics/kpis instead" });
});

router.get("/comparison", (req, res) => {
  res.status(200).json({ success: true, message: "Use /api/advanced-analytics/comparative instead" });
});

router.get("/patterns", (req, res) => {
  res.status(200).json({ success: true, message: "Use /api/advanced-analytics/kpis instead" });
});

module.exports = router;
