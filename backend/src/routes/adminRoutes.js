const express = require("express");
const { 
  getAllGrievances, 
  getAdminDashboardStats, 
  getWardStats 
} = require("../controllers/grievanceController");
const { 
  getAllUsers,
  getAllUsersWithComplaints, 
  toggleUserStatus,
  assignRole,
  sendSystemAnnouncement
} = require("../controllers/userController");
const { 
  authenticateUser, 
  authorizeRoles 
} = require("../middleware/authMiddleware");

const router = express.Router();

// All routes here are super_admin only
router.use(authenticateUser);
router.use(authorizeRoles(["admin"]));

// Grievance management
router.get("/complaints/all", getAllGrievances);
router.get("/stats", getAdminDashboardStats);
router.get("/ward-stats", getWardStats);

// Ward Admin management
router.get("/users/ward-admins", getAllUsersWithComplaints);
router.get("/users", getAllUsers);
router.put("/users/:id/assign-role", assignRole);
router.patch("/users/toggle-status/:id", toggleUserStatus);

// System Announcement
router.post("/announcement", sendSystemAnnouncement);

module.exports = router;
