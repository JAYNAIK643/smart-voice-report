const mongoose = require("mongoose");

/**
 * Challenge Schema for Community Challenge Events
 * Time-bound participation challenges (ward-level or city-level)
 */
const challengeSchema = new mongoose.Schema(
  {
    challengeId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["ward", "city", "category"],
      default: "city",
    },
    ward: {
      type: String,
      enum: ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", null],
      default: null,
    },
    category: {
      type: String,
      default: null,
    },
    goal: {
      type: String,
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        contribution: {
          type: Number,
          default: 0,
        },
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "expired"],
      default: "upcoming",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rewards: {
      badgeId: String,
      points: Number,
      description: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for performance
challengeSchema.index({ status: 1, endDate: 1 });
challengeSchema.index({ ward: 1, status: 1 });
challengeSchema.index({ challengeId: 1 });

module.exports = mongoose.model("Challenge", challengeSchema);
