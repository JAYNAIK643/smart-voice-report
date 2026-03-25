const Feedback = require("../models/Feedback");
const Grievance = require("../models/Grievance");

/**
 * Submit feedback for a resolved complaint
 * POST /api/feedback
 */
exports.submitFeedback = async (req, res, next) => {
  try {
    const { complaintId, rating, timelinessRating, comment } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!complaintId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: "Complaint ID and rating are required" 
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Rating must be between 1 and 5" 
      });
    }

    // Validate timeliness rating if provided
    if (timelinessRating && (timelinessRating < 1 || timelinessRating > 5)) {
      return res.status(400).json({ 
        success: false, 
        message: "Timeliness rating must be between 1 and 5" 
      });
    }

    // Check if grievance exists
    const grievance = await Grievance.findOne({ complaintId });
    if (!grievance) {
      return res.status(404).json({ 
        success: false, 
        message: "Complaint not found" 
      });
    }

    // Check if user owns this grievance
    if (grievance.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only submit feedback for your own complaints" 
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      complaintId,
      userId,
      rating,
      timelinessRating: timelinessRating || null,
      comment: comment?.trim() || null,
    });

    // Mark complaint as feedback submitted
    grievance.feedbackSubmitted = true;
    await grievance.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    // Handle duplicate feedback error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "You have already submitted feedback for this complaint" 
      });
    }
    next(error);
  }
};

/**
 * Get all feedback (Admin only)
 * GET /api/feedback
 */
exports.getAllFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Calculate stats
    let stats = {
      averageRating: 0,
      totalFeedback: 0,
      averageTimeliness: 0,
      positivePercent: 0,
    };

    if (feedback.length > 0) {
      const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
      const timelinessRatings = feedback.filter(f => f.timelinessRating);
      const totalTimeliness = timelinessRatings.reduce((sum, f) => sum + f.timelinessRating, 0);
      const positiveCount = feedback.filter(f => f.rating >= 4).length;

      stats = {
        averageRating: totalRating / feedback.length,
        totalFeedback: feedback.length,
        averageTimeliness: timelinessRatings.length > 0 
          ? totalTimeliness / timelinessRatings.length 
          : 0,
        positivePercent: Math.round((positiveCount / feedback.length) * 100),
      };
    }

    res.status(200).json({
      success: true,
      data: {
        feedback,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback for a specific complaint
 * GET /api/feedback/:complaintId
 */
exports.getComplaintFeedback = async (req, res, next) => {
  try {
    const { complaintId } = req.params;

    const feedback = await Feedback.findOne({ complaintId })
      .populate("userId", "name email");

    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: "No feedback found for this complaint" 
      });
    }

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has pending feedback for resolved complaints
 * GET /api/feedback/pending
 */
exports.checkPendingFeedback = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find resolved complaints without feedback
    const pendingComplaint = await Grievance.findOne({
      userId,
      status: "resolved",
      feedbackSubmitted: { $ne: true },
      feedbackSkipped: { $ne: true },
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Skip feedback for a complaint
 * POST /api/feedback/skip
 */
exports.skipFeedback = async (req, res, next) => {
  try {
    const { complaintId } = req.body;
    const userId = req.user._id;

    if (!complaintId) {
      return res.status(400).json({ 
        success: false, 
        message: "Complaint ID is required" 
      });
    }

    const grievance = await Grievance.findOne({ complaintId });
    if (!grievance) {
      return res.status(404).json({ 
        success: false, 
        message: "Complaint not found" 
      });
    }

    // Check if user owns this grievance
    if (grievance.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You can only skip feedback for your own complaints" 
      });
    }

    grievance.feedbackSkipped = true;
    await grievance.save();

    res.status(200).json({
      success: true,
      message: "Feedback skipped",
    });
  } catch (error) {
    next(error);
  }
};
