const express = require("express");
const { analyzeSmartRouting, detectEmergency, autoAssignOfficer } = require("../services/smartRoutingService");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Smart Routing Routes - Phase 3
 * Emergency detection, auto-assignment, and priority-based routing
 */

router.use(authenticateUser);

/**
 * POST /api/routing/analyze
 * Complete smart routing analysis for a complaint
 */
router.post("/analyze", async (req, res) => {
  try {
    const { title, description, priority, category, ward } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    const result = await analyzeSmartRouting({
      title,
      description: description || "",
      priority: priority || "medium",
      category: category || "Other",
      ward: ward || "Ward 1"
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/routing/detect-emergency
 * Detect if complaint is an emergency
 */
router.post("/detect-emergency", async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title and description are required" });
    }
    
    const result = await detectEmergency({ title, description });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/routing/auto-assign
 * Auto-assign officer to complaint
 */
router.post("/auto-assign", async (req, res) => {
  try {
    const { ward, category } = req.body;
    
    if (!ward) {
      return res.status(400).json({ error: "Ward is required" });
    }
    
    const result = await autoAssignOfficer(ward, category);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;