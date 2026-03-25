const express = require("express");
const {
  createGrievance,
  getMyGrievances,
  getAllGrievances,
  getPublicGrievances,
  updateGrievanceStatus,
  upvoteGrievance,
  resolveGrievance,
  getAdminDashboardStats,
  getWardStats,
  getGrievanceAuditLogs,
  getGrievanceById
} = require("../controllers/grievanceController");
const { 
  authenticateUser, 
  authorizeRoles,
  authorizeWardAccess
} = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * CITIZEN ROUTES
 */
router.post("/", authenticateUser, authorizeRoles(["user", "admin"]), createGrievance);
router.get("/my", authenticateUser, authorizeRoles(["user"]), getMyGrievances);
router.post("/:id/upvote", authenticateUser, upvoteGrievance);

/**
 * PUBLIC TRACKING ROUTE - No authentication required for tracking
 */
router.get("/id/:complaintId", getGrievanceById);

/**
 * PUBLIC ROUTES
 */
router.get("/public", getPublicGrievances);

/**
 * WARD ADMIN / ADMIN SHARED ROUTES (MANAGEMENT)
 * These routes are used by the existing frontend dashboard
 */
router.get("/", authenticateUser, authorizeRoles(["admin", "ward_admin"]), getAllGrievances);
router.get("/admin/stats", authenticateUser, authorizeRoles(["admin", "ward_admin"]), getAdminDashboardStats);
router.get("/admin/ward-stats", authenticateUser, authorizeRoles(["admin", "ward_admin"]), getWardStats);
router.put("/:id", authenticateUser, authorizeRoles(["admin", "ward_admin"]), updateGrievanceStatus);
router.post("/:id/resolve", authenticateUser, authorizeRoles(["admin", "ward_admin"]), resolveGrievance);
router.get("/:id/audit-logs", authenticateUser, authorizeRoles(["admin", "ward_admin"]), getGrievanceAuditLogs);

/**
 * SPECIFIC WARD_ADMIN ROUTES (As requested)
 */
router.get("/ward", authenticateUser, authorizeRoles(["ward_admin"]), authorizeWardAccess, getAllGrievances);

/**
 * SPECIFIC SUPER_ADMIN ROUTES (As requested)
 */
router.get("/all", authenticateUser, authorizeRoles(["admin"]), getAllGrievances);

module.exports = router;
