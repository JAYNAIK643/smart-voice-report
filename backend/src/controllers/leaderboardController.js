const User = require("../models/User");
const Grievance = require("../models/Grievance");

/**
 * Get leaderboard with user rankings
 * GET /api/leaderboard?timeframe=all|month|week
 * Reads upvotesReceived from User model, NOT grievances
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { timeframe = "all" } = req.query;

    // Calculate date filter based on timeframe
    let dateFilter = {};
    const now = new Date();

    if (timeframe === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeframe === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    // Aggregate grievances to build user stats dynamically
    const grievances = await Grievance.find(dateFilter).populate("userId", "name email role");

    // Build user stats map from ACTUAL grievances only
    const userStatsMap = {};

    grievances.forEach((grievance) => {
      // Skip if userId is not populated
      if (!grievance.userId) return;

      const userId = grievance.userId._id.toString();
      if (!userStatsMap[userId]) {
        userStatsMap[userId] = {
          userId: grievance.userId._id,
          name: grievance.userId.name,
          email: grievance.userId.email,
          complaintsCount: 0,
          resolvedCount: 0,
        };
      }

      // Count all grievances regardless of status
      userStatsMap[userId].complaintsCount += 1;
      // Count only resolved grievances
      if (grievance.status === "resolved") {
        userStatsMap[userId].resolvedCount += 1;
      }
    });

    // Fetch upvotesReceived from User model for each user
    const userIds = Object.keys(userStatsMap);
    const users = await User.find({ _id: { $in: userIds } }, "upvotesReceived");
    
    users.forEach((user) => {
      const userId = user._id.toString();
      if (userStatsMap[userId]) {
        userStatsMap[userId].upvotesReceived = user.upvotesReceived || 0;
      }
    });

    // Calculate scores and sort
    const leaderboard = Object.values(userStatsMap)
      .map((user) => ({
        ...user,
        score: user.complaintsCount * 10 + user.upvotesReceived * 5 + user.resolvedCount * 15,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        name: user.name,
        email: user.email,
        score: user.score,
        complaintsCount: user.complaintsCount,
        resolvedCount: user.resolvedCount,
        upvotesReceived: user.upvotesReceived,
        rankChange: 0,
      }));

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get global leaderboard statistics
 * GET /api/leaderboard/stats
 * Calculates totalUpvotes from User.upvotesReceived, others from Grievance collection
 */
exports.getLeaderboardStats = async (req, res, next) => {
  try {
    const { timeframe = "all" } = req.query;

    // Calculate date filter based on timeframe
    let dateFilter = {};
    const now = new Date();

    if (timeframe === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeframe === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    // Get ALL grievance statistics from MongoDB
    const grievances = await Grievance.find(dateFilter);

    const totalReports = grievances.length;
    const issuesResolved = grievances.filter((g) => g.status === "resolved").length;

    // Count ONLY users who have actually submitted grievances (active citizens)
    const uniqueUserIds = new Set(grievances.map((g) => g.userId?.toString()).filter(Boolean));
    const activeCitizens = uniqueUserIds.size;

    // Calculate totalUpvotes from User.upvotesReceived for active users
    let totalUpvotes = 0;
    if (uniqueUserIds.size > 0) {
      const users = await User.find({ 
        _id: { $in: Array.from(uniqueUserIds) } 
      }, "upvotesReceived");
      
      totalUpvotes = users.reduce((sum, user) => sum + (user.upvotesReceived || 0), 0);
    }

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        stats: {
          activeCitizens,      // Count of distinct users with grievances
          totalReports,        // Count of all grievances
          totalUpvotes,        // Sum of upvotesReceived from User model
          issuesResolved,      // Count of resolved grievances
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
