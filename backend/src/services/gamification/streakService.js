const User = require("../../models/User");
const Grievance = require("../../models/Grievance");

/**
 * Advanced Engagement System - Streak Service
 * Manages user contribution streaks with safe, isolated logic
 * FEATURE FLAG: Can be disabled via process.env.ENABLE_ADVANCED_ENGAGEMENT
 */

/**
 * Check if advanced engagement features are enabled
 */
const isEngagementEnabled = () => {
  return process.env.ENABLE_ADVANCED_ENGAGEMENT === "true";
};

/**
 * Calculate if two dates are consecutive days
 */
const areConsecutiveDays = (date1, date2) => {
  const day1 = new Date(date1).setHours(0, 0, 0, 0);
  const day2 = new Date(date2).setHours(0, 0, 0, 0);
  const diffDays = Math.abs((day2 - day1) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

/**
 * Calculate if a date is today
 */
const isToday = (date) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const checkDate = new Date(date).setHours(0, 0, 0, 0);
  return today === checkDate;
};

/**
 * Update user's activity streak
 * Called when user performs an activity (complaint submission, upvote, etc.)
 * 
 * @param {String} userId - User ID
 * @returns {Object} Updated streak data
 */
const updateUserStreak = async (userId) => {
  if (!isEngagementEnabled()) {
    console.log("📊 Advanced Engagement disabled - skipping streak update");
    return { success: false, message: "Feature disabled" };
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If no previous activity or activity is today, just update last activity
    if (!user.lastActivityDate || isToday(user.lastActivityDate)) {
      user.lastActivityDate = new Date();
      await user.save();
      return {
        success: true,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      };
    }

    // Check if activity is consecutive
    if (areConsecutiveDays(user.lastActivityDate, today)) {
      // Continue streak
      user.currentStreak = (user.currentStreak || 0) + 1;
      user.lastActivityDate = new Date();

      // Update longest streak if current exceeds it
      if (user.currentStreak > (user.longestStreak || 0)) {
        user.longestStreak = user.currentStreak;
      }

      // Set streak start date if not set
      if (!user.streakStartDate) {
        user.streakStartDate = new Date();
      }

      await user.save();

      console.log(`🔥 Streak updated for user ${userId}: ${user.currentStreak} days`);

      return {
        success: true,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        streakContinued: true,
      };
    } else {
      // Streak broken - reset
      console.log(`💔 Streak broken for user ${userId}`);
      user.currentStreak = 1; // Start new streak
      user.lastActivityDate = new Date();
      user.streakStartDate = new Date();
      await user.save();

      return {
        success: true,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        streakReset: true,
      };
    }
  } catch (error) {
    console.error("❌ Error updating user streak:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's streak data
 * 
 * @param {String} userId - User ID
 * @returns {Object} Streak data
 */
const getUserStreak = async (userId) => {
  if (!isEngagementEnabled()) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActive: false,
    };
  }

  try {
    const user = await User.findById(userId).select("currentStreak longestStreak lastActivityDate streakStartDate");
    if (!user) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        isActive: false,
      };
    }

    // Check if streak is still active (activity within last 24 hours)
    const isActive = user.lastActivityDate && 
      (new Date() - new Date(user.lastActivityDate)) < (48 * 60 * 60 * 1000); // 48 hours grace period

    return {
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastActivityDate: user.lastActivityDate,
      streakStartDate: user.streakStartDate,
      isActive,
    };
  } catch (error) {
    console.error("❌ Error getting user streak:", error.message);
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActive: false,
    };
  }
};

/**
 * Get top streaks leaderboard
 * 
 * @param {Number} limit - Number of top users to return
 * @returns {Array} Top streak users
 */
const getTopStreaks = async (limit = 10) => {
  if (!isEngagementEnabled()) {
    return [];
  }

  try {
    const users = await User.find()
      .select("name email currentStreak longestStreak lastActivityDate")
      .sort({ currentStreak: -1 })
      .limit(limit);

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user._id,
      name: user.name,
      email: user.email,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      isActive: user.lastActivityDate && 
        (new Date() - new Date(user.lastActivityDate)) < (48 * 60 * 60 * 1000),
    }));
  } catch (error) {
    console.error("❌ Error getting top streaks:", error.message);
    return [];
  }
};

/**
 * Reset inactive streaks (can be run as a daily cron job)
 * Resets streaks for users who haven't been active in 48 hours
 */
const resetInactiveStreaks = async () => {
  if (!isEngagementEnabled()) {
    return { success: false, message: "Feature disabled" };
  }

  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const result = await User.updateMany(
      {
        lastActivityDate: { $lt: twoDaysAgo },
        currentStreak: { $gt: 0 },
      },
      {
        $set: { currentStreak: 0, streakStartDate: null },
      }
    );

    console.log(`🔄 Reset ${result.modifiedCount} inactive streaks`);

    return {
      success: true,
      resetCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("❌ Error resetting inactive streaks:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  updateUserStreak,
  getUserStreak,
  getTopStreaks,
  resetInactiveStreaks,
  isEngagementEnabled,
};
