const express = require("express");
const {
  submitFeedback,
  getAllFeedback,
  getComplaintFeedback,
  checkPendingFeedback,
  skipFeedback,
} = require("../controllers/feedbackController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin routes - must come before /:complaintId to avoid conflicts
router.get("/all", authenticateUser, authorizeRoles(["admin"]), getAllFeedback);

// User routes
router.post("/", authenticateUser, submitFeedback);
router.post("/skip", authenticateUser, skipFeedback);
router.get("/pending", authenticateUser, checkPendingFeedback);
router.get("/:complaintId", authenticateUser, getComplaintFeedback);

module.exports = router;
