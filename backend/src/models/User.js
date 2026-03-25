const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    // Role field removed - users collection only contains citizens
    // Admin accounts are in 'admins' collection
    // Ward Admin accounts are in 'ward_admins' collection
    // Ward assignment for analytics (Ward 1-5)
    ward: {
      type: String,
      enum: ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"],
      default: "Ward 1",
    },
    // Badge and leaderboard tracking fields (added for badge system)
    points: {
      type: Number,
      default: 0,
    },
    complaintsSubmitted: {
      type: Number,
      default: 0,
    },
    complaintsResolved: {
      type: Number,
      default: 0,
    },
    upvotesReceived: {
      type: Number,
      default: 0,
    },
    upvotesGiven: {
      type: Number,
      default: 0,
    },
    badges: [
      {
        badgeId: String,
        name: String,
        category: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    smsEnabled: {
      type: Boolean,
      default: false,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    preferredLanguage: {
      type: String,
      default: "en",
    },
    // Advanced Engagement System - Contribution Streaks (Optional Fields)
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
    streakStartDate: {
      type: Date,
      default: null,
    },
    // Advanced Engagement System - Challenge Participation (Optional Fields)
    activeChallenges: [
      {
        challengeId: String,
        joinedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 },
      },
    ],
    completedChallenges: [
      {
        challengeId: String,
        completedAt: { type: Date, default: Date.now },
      },
    ],
    // Two-Factor Authentication (2FA) Settings
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false,
      },
      secret: {
        type: String,
        default: null,
      },
      tempSecret: {
        type: String,
        default: null,
      },
      backupCodes: [
        {
          code: String,
          used: { type: Boolean, default: false },
          usedAt: { type: Date, default: null },
        },
      ],
      enabledAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

// Add indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ ward: 1 });
userSchema.index({ totalScore: -1 }); // For leaderboard
userSchema.index({ points: -1 });     // For points-based ranking
userSchema.index({ upvotesReceived: -1 }); // For engagement metrics

module.exports = mongoose.model("User", userSchema);