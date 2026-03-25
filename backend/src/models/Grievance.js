const mongoose = require("mongoose");

const grievanceSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      default: () => `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ward: {
      type: String,
      enum: ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"],
      required: true,
    },
    // Upvote tracking fields (added for leaderboard system)
    upvoteCount: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    feedbackSubmitted: {
      type: Boolean,
      default: false,
    },
    feedbackSkipped: {
      type: Boolean,
      default: false,
    },
    // AI Intelligence fields
    aiAnalysis: {
      suggestedCategory: String,
      categoryConfidence: Number,
      suggestedPriority: String,
      priorityConfidence: Number,
      isDuplicateSuspected: { type: Boolean, default: false },
      duplicateMatches: [String], // Array of complaint IDs
      routingDepartment: String,
      detectedKeywords: [String],
      analysisTimestamp: Date
    },
    assignedDepartment: String,
    assignedOfficialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    // Image and Geolocation fields (for Ward Admin Dashboard enhancement)
    imageUrl: {
      type: String,
      default: null
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
  },
  { timestamps: true }
);

// Index for performance on ward-based queries
grievanceSchema.index({ ward: 1 });
grievanceSchema.index({ userId: 1 });
grievanceSchema.index({ complaintId: 1 });
grievanceSchema.index({ category: 1 });
grievanceSchema.index({ priority: 1 });
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ createdAt: -1 });
grievanceSchema.index({ upvoteCount: -1 }); // Index for leaderboard sorting
grievanceSchema.index({ 'aiAnalysis.isDuplicateSuspected': 1 });
grievanceSchema.index({ assignedDepartment: 1 });

module.exports = mongoose.model("Grievance", grievanceSchema);
