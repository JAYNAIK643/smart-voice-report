const User = require("../models/User");
const Grievance = require("../models/Grievance");

// Badge milestone definitions
const BADGE_DEFINITIONS = [
  {
    id: "first_report",
    name: "First Report",
    category: "milestone",
    description: "Submit your first complaint",
    requirement: "complaintsSubmitted",
    value: 1,
    icon: "🎯",
  },
  {
    id: "active_citizen",
    name: "Active Citizen",
    category: "engagement",
    description: "Submit 5 complaints",
    requirement: "complaintsSubmitted",
    value: 5,
    icon: "⭐",
  },
  {
    id: "veteran_reporter",
    name: "Veteran Reporter",
    category: "milestone",
    description: "Submit 10 complaints",
    requirement: "complaintsSubmitted",
    value: 10,
    icon: "🏆",
  },
  {
    id: "super_reporter",
    name: "Super Reporter",
    category: "milestone",
    description: "Submit 25 complaints",
    requirement: "complaintsSubmitted",
    value: 25,
    icon: "💎",
  },
  {
    id: "problem_solver",
    name: "Problem Solver",
    category: "impact",
    description: "Have 3 complaints resolved",
    requirement: "complaintsResolved",
    value: 3,
    icon: "✅",
  },
  {
    id: "community_hero",
    name: "Community Hero",
    category: "impact",
    description: "Have 10 complaints resolved",
    requirement: "complaintsResolved",
    value: 10,
    icon: "🦸",
  },
  {
    id: "change_maker",
    name: "Change Maker",
    category: "impact",
    description: "Have 20 complaints resolved",
    requirement: "complaintsResolved",
    value: 20,
    icon: "🌟",
  },
  {
    id: "popular_voice",
    name: "Popular Voice",
    category: "engagement",
    description: "Receive 10 upvotes",
    requirement: "upvotesReceived",
    value: 10,
    icon: "👍",
  },
  {
    id: "community_favorite",
    name: "Community Favorite",
    category: "engagement",
    description: "Receive 50 upvotes",
    requirement: "upvotesReceived",
    value: 50,
    icon: "❤️",
  },
  {
    id: "supporter",
    name: "Supporter",
    category: "engagement",
    description: "Give 20 upvotes",
    requirement: "upvotesGiven",
    value: 20,
    icon: "🤝",
  },
  // Advanced Engagement System - Streak-Based Badges
  {
    id: "streak_starter",
    name: "Streak Starter",
    category: "streak",
    description: "Maintain a 3-day activity streak",
    requirement: "currentStreak",
    value: 3,
    icon: "🔥",
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    category: "streak",
    description: "Maintain a 7-day activity streak",
    requirement: "currentStreak",
    value: 7,
    icon: "⚡",
  },
  {
    id: "dedicated_citizen",
    name: "Dedicated Citizen",
    category: "streak",
    description: "Maintain a 14-day activity streak",
    requirement: "currentStreak",
    value: 14,
    icon: "💪",
  },
  {
    id: "consistency_champion",
    name: "Consistency Champion",
    category: "streak",
    description: "Maintain a 30-day activity streak",
    requirement: "currentStreak",
    value: 30,
    icon: "🏅",
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    category: "streak",
    description: "Maintain a 60-day activity streak",
    requirement: "longestStreak",
    value: 60,
    icon: "🌟",
  },
];

/**
 * Calculate user stats DYNAMICALLY from Grievance collection
 * NEVER use User model counters - always query MongoDB
 * NOW INCLUDES: Streak data for advanced engagement badges
 */
const calculateUserStatsFromGrievances = async (userId) => {
  // Count total grievances for this user
  const complaintsSubmitted = await Grievance.countDocuments({ userId });
  
  // Count resolved grievances
  const complaintsResolved = await Grievance.countDocuments({ 
    userId, 
    status: "resolved" 
  });
  
  // Calculate upvotes received from user's grievances
  const userGrievances = await Grievance.find({ userId }).select("upvoteCount");
  const upvotesReceived = userGrievances.reduce((sum, g) => sum + (g.upvoteCount || 0), 0);
  
  // Calculate upvotes given by this user
  const allGrievances = await Grievance.find({ upvotedBy: userId }).countDocuments();
  const upvotesGiven = allGrievances;
  
  // Get streak data from User model (for streak badges)
  const User = require("../models/User");
  const user = await User.findById(userId).select("currentStreak longestStreak");
  const currentStreak = user?.currentStreak || 0;
  const longestStreak = user?.longestStreak || 0;
  
  return {
    complaintsSubmitted,
    complaintsResolved,
    upvotesReceived,
    upvotesGiven,
    currentStreak,
    longestStreak,
  };
};

/**
 * Calculate user's total score based on ACTUAL grievance data
 * Formula: (complaints × 10) + (upvotes × 5) + (resolved × 15)
 */
const calculateUserScore = async (userId) => {
  const stats = await calculateUserStatsFromGrievances(userId);
  
  const complaintsScore = stats.complaintsSubmitted * 10;
  const upvotesScore = stats.upvotesReceived * 5;
  const resolvedScore = stats.complaintsResolved * 15;

  return complaintsScore + upvotesScore + resolvedScore;
};

/**
 * Check if user qualifies for badges based on ACTUAL grievance data
 * Badges are computed dynamically - NOT stored permanently
 * Returns currently earned badges (not stored in DB)
 */
const checkAndAwardBadges = async (userId) => {
  try {
    // Get REAL stats from Grievance collection
    const stats = await calculateUserStatsFromGrievances(userId);
    
    const earnedBadges = [];

    // Check each badge definition against REAL data
    for (const badge of BADGE_DEFINITIONS) {
      const userValue = stats[badge.requirement] || 0;
      
      // Award badge if user meets requirement
      if (userValue >= badge.value) {
        earnedBadges.push({
          badgeId: badge.id,
          name: badge.name,
          category: badge.category,
          earnedAt: new Date(),
        });
      }
    }

    return earnedBadges;
  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
};

/**
 * Get user's badge progress for all badges
 * Calculates dynamically from Grievance collection
 */
const getBadgeProgress = async (userId) => {
  try {
    // Get REAL stats from Grievance collection
    const stats = await calculateUserStatsFromGrievances(userId);
    
    // Get currently earned badges
    const earnedBadges = await checkAndAwardBadges(userId);
    const earnedBadgeIds = earnedBadges.map((b) => b.badgeId);

    return BADGE_DEFINITIONS.map((badge) => {
      const userValue = stats[badge.requirement] || 0;
      const progress = Math.min((userValue / badge.value) * 100, 100);
      const unlocked = earnedBadgeIds.includes(badge.id);

      return {
        badge: {
          id: badge.id,
          name: badge.name,
          category: badge.category,
          description: badge.description,
          requirement: badge.requirement,
          value: badge.value,
          icon: badge.icon,
        },
        currentValue: userValue,
        progress: Math.round(progress),
        unlocked,
      };
    });
  } catch (error) {
    console.error("Error getting badge progress:", error);
    return [];
  }
};

/**
 * Get all available badge definitions
 */
const getAllBadges = () => {
  return BADGE_DEFINITIONS;
};

module.exports = {
  BADGE_DEFINITIONS,
  calculateUserScore,
  checkAndAwardBadges,
  getBadgeProgress,
  getAllBadges,
  calculateUserStatsFromGrievances,
};
