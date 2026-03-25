const express = require("express");
const {
  getLeaderboard,
  getLeaderboardStats,
} = require("../controllers/leaderboardController");

const router = express.Router();

// Leaderboard routes (public access)
router.get("/", getLeaderboard);
router.get("/stats", getLeaderboardStats);

module.exports = router;
