const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      ref: "Grievance",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    timelinessRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure one feedback per complaint per user
feedbackSchema.index({ complaintId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
