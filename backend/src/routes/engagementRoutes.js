const express = require("express");
const {
  getPersonalizedDashboard,
  getUserStreakData,
  getTopStreaksLeaderboard,
  getActiveChallengesForUser,
  joinChallengeEndpoint,
  getChallengeLeaderboardData,
  getShareableAchievement,
} = require("../controllers/engagementController");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Advanced Engagement System Routes
 * All routes are protected and fail-safe
 * Feature can be disabled via ENABLE_ADVANCED_ENGAGEMENT flag
 */

// Personalized Dashboard
router.get("/dashboard", authenticateUser, getPersonalizedDashboard);

// Streak Management
router.get("/streak", authenticateUser, getUserStreakData);
router.get("/streaks/top", getTopStreaksLeaderboard); // Public leaderboard

// Challenge Management
router.get("/challenges", authenticateUser, getActiveChallengesForUser);
router.post("/challenges/:challengeId/join", authenticateUser, joinChallengeEndpoint);
router.get("/challenges/:challengeId/leaderboard", getChallengeLeaderboardData); // Public

// Social Sharing (Anonymized)
router.get("/share/:badgeId", authenticateUser, getShareableAchievement);

module.exports = router;
