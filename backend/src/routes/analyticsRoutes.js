const express = require("express");
const {
  getGrievanceTrends,
  getWardPerformance,
  getResolutionTimeAnalytics,
  getCategoryCorrelation
} = require("../controllers/analyticsController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Apply protection to all routes
router.use(authenticateUser);
router.use(authorizeRoles(["admin", "ward_admin"]));

router.get("/trends", getGrievanceTrends);
router.get("/ward-performance", getWardPerformance);
router.get("/resolution-time", getResolutionTimeAnalytics);
router.get("/category-correlation", getCategoryCorrelation);

module.exports = router;
