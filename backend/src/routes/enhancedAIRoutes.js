const express = require("express");
const { analyzeComplaintEnhanced, detectWardFromAddress, detectLanguage } = require("../services/enhancedNLPService");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Enhanced AI Intelligence Routes
 * Phase 1: Multi-language NLP, Smart Duplicate Detection, Auto-ward Detection
 * Zero-Regression Strategy: New routes, extends existing API
 */

// Public endpoint for language detection (no auth needed)
router.post("/detect-language", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    
    const result = detectLanguage(text);
    res.json({ detectedLanguage: result });
  } catch (error) {
    console.error("Language detection error:", error);
    res.status(500).json({ error: "Failed to detect language" });
  }
});

// Public endpoint for ward detection (no auth needed)
router.post("/detect-ward", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }
    
    const result = detectWardFromAddress(address);
    res.json(result);
  } catch (error) {
    console.error("Ward detection error:", error);
    res.status(500).json({ error: "Failed to detect ward" });
  }
});

// Protected endpoint - requires authentication
router.use(authenticateUser);

/**
 * POST /api/enhanced-ai/analyze
 * Complete enhanced AI analysis with multi-language support
 */
router.post("/analyze", async (req, res) => {
  try {
    const { title, description, address, ward } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    const result = await analyzeComplaintEnhanced({
      title,
      description: description || "",
      address: address || "",
      ward: ward || "Ward 1"
    });
    
    res.json(result);
  } catch (error) {
    console.error("Enhanced AI analysis error:", error);
    res.status(500).json({ error: "Failed to analyze complaint" });
  }
});

module.exports = router;
