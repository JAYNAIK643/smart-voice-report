const Challenge = require("../../models/Challenge");
const User = require("../../models/User");
const Grievance = require("../../models/Grievance");

/**
 * Advanced Engagement System - Challenge Service
 * Manages community challenge events with isolated, fail-safe logic
 * FEATURE FLAG: Can be disabled via process.env.ENABLE_ADVANCED_ENGAGEMENT
 */

/**
 * Check if advanced engagement features are enabled
 */
const isEngagementEnabled = () => {
  return process.env.ENABLE_ADVANCED_ENGAGEMENT === "true";
};

/**
 * Create a new community challenge
 * 
 * @param {Object} challengeData - Challenge details
 * @returns {Object} Created challenge
 */
const createChallenge = async (challengeData) => {
  if (!isEngagementEnabled()) {
    return { success: false, message: "Feature disabled" };
  }

  try {
    const {
      title,
      description,
      type,
      ward,
      category,
      goal,
      targetValue,
      startDate,
      endDate,
      rewards,
    } = challengeData;

    // Generate unique challenge ID
    const challengeId = `CH-${Date.now().toString(36).toUpperCase()}`;

    const challenge = await Challenge.create({
      challengeId,
      title,
      description,
      type,
      ward: type === "ward" ? ward : null,
      category: type === "category" ? category : null,
      goal,
      targetValue,
      startDate,
      endDate,
      rewards,
      status: new Date() < new Date(startDate) ? "upcoming" : "active",
    });

    console.log(`🎯 Challenge created: ${challenge.challengeId}`);

    return {
      success: true,
      data: challenge,
    };
  } catch (error) {
    console.error("❌ Error creating challenge:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get all active challenges
 * 
 * @param {String} ward - Optional ward filter
 * @returns {Array} Active challenges
 */
const getActiveChallenges = async (ward = null) => {
  if (!isEngagementEnabled()) {
    return [];
  }

  try {
    const now = new Date();
    const query = {
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
      isActive: true,
    };

    if (ward) {
      query.$or = [{ ward }, { type: "city" }];
    }

    const challenges = await Challenge.find(query)
      .sort({ endDate: 1 })
      .limit(10);

    return challenges;
  } catch (error) {
    console.error("❌ Error getting active challenges:", error.message);
    return [];
  }
};

/**
 * Join a challenge
 * 
 * @param {String} challengeId - Challenge ID
 * @param {String} userId - User ID
 * @returns {Object} Result
 */
const joinChallenge = async (challengeId, userId) => {
  if (!isEngagementEnabled()) {
    return { success: false, message: "Feature disabled" };
  }

  try {
    const challenge = await Challenge.findOne({ challengeId });
    if (!challenge) {
      return { success: false, message: "Challenge not found" };
    }

    // Check if already joined
    const alreadyJoined = challenge.participants.some(
      (p) => p.userId.toString() === userId
    );

    if (alreadyJoined) {
      return { success: false, message: "Already joined this challenge" };
    }

    // Add user to participants
    challenge.participants.push({
      userId,
      joinedAt: new Date(),
      contribution: 0,
    });

    await challenge.save();

    // Update user's active challenges
    const user = await User.findById(userId);
    if (user) {
      user.activeChallenges.push({
        challengeId,
        joinedAt: new Date(),
        progress: 0,
      });
      await user.save();
    }

    console.log(`🎯 User ${userId} joined challenge ${challengeId}`);

    return {
      success: true,
      message: "Successfully joined challenge",
    };
  } catch (error) {
    console.error("❌ Error joining challenge:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update user's challenge progress
 * Called when user performs relevant activity
 * 
 * @param {String} userId - User ID
 * @param {String} challengeId - Challenge ID
 * @param {Number} increment - Progress increment
 * @returns {Object} Result
 */
const updateChallengeProgress = async (userId, challengeId, increment = 1) => {
  if (!isEngagementEnabled()) {
    return { success: false, message: "Feature disabled" };
  }

  try {
    const challenge = await Challenge.findOne({ challengeId });
    if (!challenge) {
      return { success: false, message: "Challenge not found" };
    }

    // Find participant
    const participant = challenge.participants.find(
      (p) => p.userId.toString() === userId
    );

    if (!participant) {
      return { success: false, message: "User not participating in this challenge" };
    }

    // Update contribution
    participant.contribution += increment;
    challenge.currentValue += increment;

    // Check if challenge completed
    if (challenge.currentValue >= challenge.targetValue) {
      challenge.status = "completed";
    }

    await challenge.save();

    // Update user's challenge progress
    const user = await User.findById(userId);
    if (user) {
      const userChallenge = user.activeChallenges.find(
        (c) => c.challengeId === challengeId
      );
      if (userChallenge) {
        userChallenge.progress += increment;
      }
      await user.save();
    }

    console.log(`📈 Challenge progress updated: ${challengeId} - ${participant.contribution}`);

    return {
      success: true,
      currentProgress: participant.contribution,
      challengeProgress: challenge.currentValue,
      targetValue: challenge.targetValue,
      completed: challenge.status === "completed",
    };
  } catch (error) {
    console.error("❌ Error updating challenge progress:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get challenge leaderboard
 * 
 * @param {String} challengeId - Challenge ID
 * @param {Number} limit - Number of top participants
 * @returns {Array} Leaderboard
 */
const getChallengeLeaderboard = async (challengeId, limit = 10) => {
  if (!isEngagementEnabled()) {
    return [];
  }

  try {
    const challenge = await Challenge.findOne({ challengeId }).populate(
      "participants.userId",
      "name email"
    );

    if (!challenge) {
      return [];
    }

    // Sort by contribution
    const leaderboard = challenge.participants
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, limit)
      .map((p, index) => ({
        rank: index + 1,
        userId: p.userId._id,
        name: p.userId.name,
        email: p.userId.email,
        contribution: p.contribution,
        joinedAt: p.joinedAt,
      }));

    return leaderboard;
  } catch (error) {
    console.error("❌ Error getting challenge leaderboard:", error.message);
    return [];
  }
};

/**
 * Get user's challenges (active and completed)
 * 
 * @param {String} userId - User ID
 * @returns {Object} User's challenges
 */
const getUserChallenges = async (userId) => {
  if (!isEngagementEnabled()) {
    return {
      activeChallenges: [],
      completedChallenges: [],
    };
  }

  try {
    const user = await User.findById(userId).select(
      "activeChallenges completedChallenges"
    );

    if (!user) {
      return {
        activeChallenges: [],
        completedChallenges: [],
      };
    }

    // Get full challenge details
    const activeChallengeIds = user.activeChallenges.map((c) => c.challengeId);
    const completedChallengeIds = user.completedChallenges.map((c) => c.challengeId);

    const [activeChallenges, completedChallenges] = await Promise.all([
      Challenge.find({ challengeId: { $in: activeChallengeIds } }),
      Challenge.find({ challengeId: { $in: completedChallengeIds } }),
    ]);

    return {
      activeChallenges,
      completedChallenges,
    };
  } catch (error) {
    console.error("❌ Error getting user challenges:", error.message);
    return {
      activeChallenges: [],
      completedChallenges: [],
    };
  }
};

/**
 * Update challenge statuses (can be run as a cron job)
 * Marks challenges as completed or expired
 */
const updateChallengeStatuses = async () => {
  if (!isEngagementEnabled()) {
    return { success: false, message: "Feature disabled" };
  }

  try {
    const now = new Date();

    // Mark expired challenges
    const expiredResult = await Challenge.updateMany(
      {
        endDate: { $lt: now },
        status: "active",
      },
      {
        $set: { status: "expired" },
      }
    );

    // Activate upcoming challenges
    const activatedResult = await Challenge.updateMany(
      {
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: "upcoming",
      },
      {
        $set: { status: "active" },
      }
    );

    console.log(
      `🔄 Updated challenge statuses: ${expiredResult.modifiedCount} expired, ${activatedResult.modifiedCount} activated`
    );

    return {
      success: true,
      expired: expiredResult.modifiedCount,
      activated: activatedResult.modifiedCount,
    };
  } catch (error) {
    console.error("❌ Error updating challenge statuses:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createChallenge,
  getActiveChallenges,
  joinChallenge,
  updateChallengeProgress,
  getChallengeLeaderboard,
  getUserChallenges,
  updateChallengeStatuses,
  isEngagementEnabled,
};
