const express = require("express");
const { getWardHeatmapData, getCategoryHotspots } = require("../services/geographicHeatmapService");
const { getSLAAlerts, getSLAComplianceStats } = require("../services/slaAlertService");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Heatmap & SLA Analytics Routes - Phase 2 Advanced Analytics
 * Provides geographic heatmap and real-time SLA monitoring
 */

router.use(authenticateUser);
router.use(authorizeRoles(["admin", "ward_admin"]));

/**
 * GET /api/heatmap/heatmap
 * Get ward-based complaint density data for heatmap visualization
 */
router.get("/heatmap", async (req, res) => {
  try {
    const result = await getWardHeatmapData({ timeRange: 30 });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/heatmap/hotspots
 * Get category hotspots by ward
 */
router.get("/hotspots", async (req, res) => {
  try {
    const result = await getCategoryHotspots({ limit: 15 });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/heatmap/sla-alerts
 * Get real-time SLA breach alerts
 */
router.get("/sla-alerts", async (req, res) => {
  try {
    const result = await getSLAAlerts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/heatmap/sla-compliance
 * Get SLA compliance statistics
 */
router.get("/sla-compliance", async (req, res) => {
  try {
    const result = await getSLAComplianceStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;