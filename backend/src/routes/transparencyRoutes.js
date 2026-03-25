const express = require("express");
const { getWardPerformance, getOfficerPerformance, getResolutionTimeAnalytics, getPublicDashboard } = require("../services/publicTransparencyService");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Public Transparency Routes - Phase 4
 * Public ward performance, officer scores, and resolution tracking
 */

/**
 * GET /api/transparency/public
 * Public dashboard - no auth required
 */
router.get("/public", async (req, res) => {
  try {
    const result = await getPublicDashboard();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transparency/ward-performance
 * Get ward performance metrics - admin/ward_admin only
 */
router.get("/ward-performance", authenticateUser, authorizeRoles(["admin", "ward_admin"]), async (req, res) => {
  try {
    const { ward } = req.query;
    const result = await getWardPerformance(ward);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transparency/officer-performance
 * Get officer performance scores - admin only
 */
router.get("/officer-performance", authenticateUser, authorizeRoles(["admin"]), async (req, res) => {
  try {
    const result = await getOfficerPerformance();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transparency/resolution-time
 * Get resolution time analytics
 */
router.get("/resolution-time", authenticateUser, authorizeRoles(["admin", "ward_admin"]), async (req, res) => {
  try {
    const result = await getResolutionTimeAnalytics();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;