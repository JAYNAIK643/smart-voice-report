const express = require("express");
const {
  createWardAdminInvitation,
  verifyInvitationToken,
  verifyInvitationAndSignup,
  getPendingInvitations,
  resendInvitation,
  deleteInvitation,
  getWardComplaints,
} = require("../controllers/wardAdminController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (no authentication required)
router.get("/verify/:token", verifyInvitationToken);
router.post("/verify-and-signup", verifyInvitationAndSignup);

// Super Admin routes (protected) - for managing ward admins
router.post("/invite", authenticateUser, authorizeRoles(["admin"]), createWardAdminInvitation);
router.get("/invitations", authenticateUser, authorizeRoles(["admin"]), getPendingInvitations);
router.post("/invitations/:id/resend", authenticateUser, authorizeRoles(["admin"]), resendInvitation);
router.delete("/invitations/:id", authenticateUser, authorizeRoles(["admin"]), deleteInvitation);

// Ward Admin routes (protected) - for ward admins to access their ward data
router.get("/complaints", authenticateUser, authorizeRoles(["ward_admin"]), getWardComplaints);

module.exports = router;