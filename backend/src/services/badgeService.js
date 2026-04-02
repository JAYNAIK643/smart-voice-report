const User = require("../models/User");
const Grievance = require("../models/Grievance");

// Badge milestone definitions with benefits and tiers
const BADGE_DEFINITIONS = [
  // TIER BADGES - Based on complaints submitted
  {
    id: "bronze_contributor",
    name: "Bronze Contributor",
    category: "tier",
    description: "Submit 10+ complaints and earn bronze recognition",
    requirement: "complaintsSubmitted",
    value: 10,
    icon: "🥉",
    tier: "bronze",
    benefits: "Standard complaint processing with acknowledgment badge on your profile"
  },
  {
    id: "silver_contributor",
    name: "Silver Contributor",
    category: "tier",
    description: "Submit 25+ complaints and earn silver status",
    requirement: "complaintsSubmitted",
    value: 25,
    icon: "🥈",
    tier: "silver",
    benefits: "Slightly faster response times + priority acknowledgment from ward officers"
  },
  {
    id: "gold_contributor",
    name: "Gold Contributor",
    category: "tier",
    description: "Submit 50+ complaints and earn gold status",
    requirement: "complaintsSubmitted",
    value: 50,
    icon: "🥇",
    tier: "gold",
    benefits: "High priority complaint handling + direct escalation channel to senior officials"
  },
  // ENGAGEMENT BADGES
  {
    id: "first_report",
    name: "First Report",
    category: "milestone",
    description: "Submit your first complaint",
    requirement: "complaintsSubmitted",
    value: 1,
    icon: "🎯",
    tier: "basic",
    benefits: "Welcome to the platform - your voice matters!"
  },
  {
    id: "active_citizen",
    name: "Active Citizen",
    category: "engagement",
    description: "Submit 5 complaints",
    requirement: "complaintsSubmitted",
    value: 5,
    icon: "⭐",
    tier: "basic",
    benefits: "Your activity is being recognized by the system"
  },
  {
    id: "veteran_reporter",
    name: "Veteran Reporter",
    category: "milestone",
    description: "Submit 10 complaints",
    requirement: "complaintsSubmitted",
    value: 10,
    icon: "🏆",
    tier: "bronze",
    benefits: "Your consistent participation helps improve city services"
  },
  {
    id: "super_reporter",
    name: "Super Reporter",
    category: "milestone",
    description: "Submit 25 complaints",
    requirement: "complaintsSubmitted",
    value: 25,
    icon: "💎",
    tier: "silver",
    benefits: "Recognition as a valued community contributor"
  },
  // IMPACT BADGES - Based on resolved complaints
  {
    id: "problem_solver",
    name: "Problem Solver",
    category: "impact",
    description: "Have 3 complaints resolved",
    requirement: "complaintsResolved",
    value: 3,
    icon: "✅",
    tier: "bronze",
    benefits: "Your reports are creating real change in your community"
  },
  {
    id: "community_hero",
    name: "Community Hero",
    category: "impact",
    description: "Have 10 complaints resolved",
    requirement: "complaintsResolved",
    value: 10,
    icon: "🦸",
    tier: "silver",
    benefits: "Special recognition from municipal authorities + certificate of appreciation"
  },
  {
    id: "change_maker",
    name: "Change Maker",
    category: "impact",
    description: "Have 20 complaints resolved",
    requirement: "complaintsResolved",
    value: 20,
    icon: "🌟",
    tier: "gold",
    benefits: "Official commendation + invitation to citizen advisory meetings"
  },
  // ENGAGEMENT - Upvotes
  {
    id: "popular_voice",
    name: "Popular Voice",
    category: "engagement",
    description: "Receive 10 upvotes from community",
    requirement: "upvotesReceived",
    value: 10,
    icon: "👍",
    tier: "bronze",
    benefits: "Community-endorsed reporter status"
  },
  {
    id: "community_favorite",
    name: "Community Favorite",
    category: "engagement",
    description: "Receive 50 upvotes from community",
    requirement: "upvotesReceived",
    value: 50,
    icon: "❤️",
    tier: "gold",
    benefits: "Featured citizen spotlight + priority issue attention"
  },
  {
    id: "supporter",
    name: "Supporter",
    category: "engagement",
    description: "Support others by giving 20 upvotes",
    requirement: "upvotesGiven",
    value: 20,
    icon: "🤝",
    tier: "bronze",
    benefits: "Community builder recognition badge"
  },
  // STREAK BADGES - Activity consistency
  {
    id: "streak_starter",
    name: "Streak Starter",
    category: "streak",
    description: "Maintain a 3-day activity streak",
    requirement: "currentStreak",
    value: 3,
    icon: "🔥",
    tier: "basic",
    benefits: "Building a habit of civic engagement"
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    category: "streak",
    description: "Maintain a 7-day activity streak",
    requirement: "currentStreak",
    value: 7,
    icon: "⚡",
    tier: "bronze",
    benefits: "Consistent citizen badge + bonus points on leaderboard"
  },
  {
    id: "dedicated_citizen",
    name: "Dedicated Citizen",
    category: "streak",
    description: "Maintain a 14-day activity streak",
    requirement: "currentStreak",
    value: 14,
    icon: "💪",
    tier: "silver",
    benefits: "Dedicated citizen certificate + early access to new features"
  },
  {
    id: "consistency_champion",
    name: "Consistency Champion",
    category: "streak",
    description: "Maintain a 30-day activity streak",
    requirement: "currentStreak",
    value: 30,
    icon: "🏅",
    tier: "gold",
    benefits: "Champion status + municipal appreciation letter"
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    category: "streak",
    description: "Maintain a 60-day activity streak",
    requirement: "longestStreak",
    value: 60,
    icon: "🌟",
    tier: "platinum",
    benefits: "VIP citizen status + direct communication channel with city officials"
  },
  // SPECIAL BADGES - Top performers
  {
    id: "top_contributor",
    name: "Top Contributor",
    category: "special",
    description: "Reach Top 10 on the leaderboard",
    requirement: "leaderboardRank",
    value: 10,
    icon: "👑",
    tier: "platinum",
    benefits: "Featured profile + fastest admin response times + monthly recognition"
  },
  {
    id: "trusted_citizen",
    name: "Trusted Citizen",
    category: "special",
    description: "Verified user with no fake/spam complaints",
    requirement: "trustScore",
    value: 90,
    icon: "🛡️",
    tier: "platinum",
    benefits: "Verified badge displayed + priority support + complaints auto-verified"
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
