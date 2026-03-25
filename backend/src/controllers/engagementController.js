const User = require("../models/User");
const Grievance = require("../models/Grievance");
const { getUserStreak, getTopStreaks } = require("../services/gamification/streakService");
const { getUserChallenges, getActiveChallenges } = require("../services/gamification/challengeService");
const { checkAndAwardBadges, getBadgeProgress } = require("../services/badgeService");

/**
 * Advanced Engagement Controller
 * Handles personalized dashboard and engagement features
 * All features are fail-safe and isolated
 */

/**
 * Get personalized dashboard data
 * GET /api/engagement/dashboard
 */
exports.getPersonalizedDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all data in parallel for better performance
    const [streak, badges, challenges, recentGrievances] = await Promise.allSettled([
      getUserStreak(userId),
      checkAndAwardBadges(userId),
      getUserChallenges(userId),
      Grievance.find({ userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    // Calculate user stats
    const totalGrievances = await Grievance.countDocuments({ userId });
    const resolvedGrievances = await Grievance.countDocuments({ 
      userId, 
      status: "resolved" 
    });

    res.status(200).json({
      success: true,
      data: {
        streak: streak.status === "fulfilled" ? streak.value : { currentStreak: 0, longestStreak: 0 },
        badges: {
          earned: badges.status === "fulfilled" ? badges.value : [],
          count: badges.status === "fulfilled" ? badges.value.length : 0,
        },
        challenges: {
          active: challenges.status === "fulfilled" ? challenges.value.activeChallenges : [],
          completed: challenges.status === "fulfilled" ? challenges.value.completedChallenges : [],
        },
        stats: {
          totalGrievances,
          resolvedGrievances,
          resolutionRate: totalGrievances > 0 ? Math.round((resolvedGrievances / totalGrievances) * 100) : 0,
        },
        recentActivity: recentGrievances.status === "fulfilled" ? recentGrievances.value : [],
      },
    });
  } catch (error) {
    console.error("❌ Error getting personalized dashboard:", error);
    // Return empty data instead of error to prevent UI breaks
    res.status(200).json({
      success: true,
      data: {
        streak: { currentStreak: 0, longestStreak: 0 },
        badges: { earned: [], count: 0 },
        challenges: { active: [], completed: [] },
        stats: { totalGrievances: 0, resolvedGrievances: 0, resolutionRate: 0 },
        recentActivity: [],
      },
    });
  }
};

/**
 * Get user streak data
 * GET /api/engagement/streak
 */
exports.getUserStreakData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const streakData = await getUserStreak(userId);

    res.status(200).json({
      success: true,
      data: streakData,
    });
  } catch (error) {
    console.error("❌ Error getting streak data:", error);
    res.status(200).json({
      success: true,
      data: { currentStreak: 0, longestStreak: 0, isActive: false },
    });
  }
};

/**
 * Get top streaks leaderboard
 * GET /api/engagement/streaks/top
 */
exports.getTopStreaksLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topStreaks = await getTopStreaks(limit);

    res.status(200).json({
      success: true,
      data: topStreaks,
    });
  } catch (error) {
    console.error("❌ Error getting top streaks:", error);
    res.status(200).json({
      success: true,
      data: [],
    });
  }
};

/**
 * Get active challenges
 * GET /api/engagement/challenges
 */
exports.getActiveChallengesForUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("ward");
    const challenges = await getActiveChallenges(user?.ward);

    res.status(200).json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    console.error("❌ Error getting active challenges:", error);
    res.status(200).json({
      success: true,
      data: [],
    });
  }
};

/**
 * Join a challenge
 * POST /api/engagement/challenges/:challengeId/join
 */
exports.joinChallengeEndpoint = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const challengeService = require("../services/gamification/challengeService");
    
    const result = await challengeService.joinChallenge(challengeId, req.user._id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("❌ Error joining challenge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join challenge",
    });
  }
};

/**
 * Get challenge leaderboard
 * GET /api/engagement/challenges/:challengeId/leaderboard
 */
exports.getChallengeLeaderboardData = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const challengeService = require("../services/gamification/challengeService");
    
    const leaderboard = await challengeService.getChallengeLeaderboard(challengeId, limit);

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("❌ Error getting challenge leaderboard:", error);
    res.status(200).json({
      success: true,
      data: [],
    });
  }
};

/**
 * Get shareable achievement data (anonymized)
 * GET /api/engagement/share/:badgeId
 */
exports.getShareableAchievement = async (req, res, next) => {
  try {
    const { badgeId } = req.params;
    const userId = req.user._id;

    const badges = await checkAndAwardBadges(userId);
    const badge = badges.find(b => b.badgeId === badgeId);

    if (!badge) {
      return res.status(404).json({
        success: false,
        message: "Badge not found or not earned",
      });
    }

    // Return anonymized data (no personal info)
    res.status(200).json({
      success: true,
      data: {
        badgeName: badge.name,
        badgeCategory: badge.category,
        earnedAt: badge.earnedAt,
        shareText: `I just earned the "${badge.name}" badge on SmartCity GRS! 🎉`,
      },
    });
  } catch (error) {
    console.error("❌ Error getting shareable achievement:", error);
    res.status(404).json({
      success: false,
      message: "Achievement not found",
    });
  }
};
