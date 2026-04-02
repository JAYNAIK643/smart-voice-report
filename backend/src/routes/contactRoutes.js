const express = require("express");
const router = express.Router();
const {
  submitContactMessage,
  getAllContactMessages,
  getWardAdminMessages,
  assignMessage,
  updateMessageStatus,
  getWardAdminsForAssignment,
} = require("../controllers/contactController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

// Middleware aliases for clarity
const protect = authenticateUser;
const adminOnly = authorizeRoles(["admin"]);
const wardAdminOnly = authorizeRoles(["ward_admin"]);

// Public route - submit contact form
router.post("/", submitContactMessage);

// Protected admin routes
router.get("/", protect, adminOnly, getAllContactMessages);
router.get("/ward-admins", protect, adminOnly, getWardAdminsForAssignment);
router.put("/:ticketId/assign", protect, adminOnly, assignMessage);
router.put("/:ticketId/status", protect, adminOnly, updateMessageStatus);

// Protected ward admin routes
router.get("/ward-admin/messages", protect, wardAdminOnly, getWardAdminMessages);
router.put("/ward-admin/:ticketId/status", protect, wardAdminOnly, updateMessageStatus);

module.exports = router;
