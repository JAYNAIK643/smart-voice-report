const express = require("express");
const {
  getUserProfile,
  getUserProfileById,
  getUserBadges,
  getUserStats,
  getRecentActivity,
  getAllUsersWithComplaints,
  toggleUserStatus,
  updateNotificationPreferences,
} = require("../controllers/userController");
const { 
  authenticateUser, 
  authorizeRoles 
} = require("../middleware/authMiddleware");

const router = express.Router();

// User profile routes
router.get("/profile", authenticateUser, getUserProfile);
router.get("/profile/:id", authenticateUser, getUserProfileById);

// Badge routes
router.get("/badges", authenticateUser, getUserBadges);

// Stats routes
router.get("/stats", authenticateUser, getUserStats);

// Recent activity route
router.get("/recent-activity", authenticateUser, getRecentActivity);

// Update preferences route
router.patch("/preferences", authenticateUser, updateNotificationPreferences);

// Super Admin routes - manage ward admins
router.get(
  "/admin/all", 
  authenticateUser, 
  authorizeRoles(["admin"]), 
  getAllUsersWithComplaints
);

router.patch(
  "/admin/toggle-status/:id", 
  authenticateUser, 
  authorizeRoles(["admin"]), 
  toggleUserStatus
);

module.exports = router;
