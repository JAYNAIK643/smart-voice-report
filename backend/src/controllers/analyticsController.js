const Grievance = require("../models/Grievance");

/**
 * @desc Get grievance trends over time
 * @route GET /api/analytics/trends
 * @access Private/Admin
 */
exports.getGrievanceTrends = async (req, res) => {
  try {
    const { range = "monthly", startDate, endDate } = req.query;
    
    let match = {};
    if (startDate && endDate) {
      match.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupFormat = "%Y-%m";
    if (range === "daily") groupFormat = "%Y-%m-%d";
    if (range === "weekly") groupFormat = "%Y-%U"; // Year-WeekNumber

    const trends = await Grievance.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error("Trend Analysis Error:", error);
    res.status(200).json({
      success: false,
      message: "Failed to fetch trend data",
      data: []
    });
  }
};

/**
 * @desc Get ward performance ranking
 * @route GET /api/analytics/ward-performance
 * @access Private/Admin
 */
exports.getWardPerformance = async (req, res) => {
  try {
    const performance = await Grievance.aggregate([
      {
        $group: {
          _id: "$ward",
          totalComplaints: { $sum: 1 },
          resolvedComplaints: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          pendingComplaints: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ["$status", "resolved"] },
                { $subtract: ["$updatedAt", "$createdAt"] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          ward: "$_id",
          totalComplaints: 1,
          resolvedComplaints: 1,
          pendingComplaints: 1,
          avgResolutionTime: { $divide: ["$avgResolutionTime", 3600000] }, // Convert ms to hours
          resolutionRate: {
            $multiply: [
              { $divide: ["$resolvedComplaints", "$totalComplaints"] },
              100
            ]
          }
        }
      },
      { $sort: { resolutionRate: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error("Ward Performance Error:", error);
    res.status(200).json({
      success: false,
      message: "Failed to fetch ward performance",
      data: []
    });
  }
};

/**
 * @desc Get category resolution time analytics
 * @route GET /api/analytics/resolution-time
 * @access Private/Admin
 */
exports.getResolutionTimeAnalytics = async (req, res) => {
  try {
    const analytics = await Grievance.aggregate([
      { $match: { status: "resolved" } },
      {
        $group: {
          _id: "$category",
          avgTime: { $avg: { $subtract: ["$updatedAt", "$createdAt"] } },
          minTime: { $min: { $subtract: ["$updatedAt", "$createdAt"] } },
          maxTime: { $max: { $subtract: ["$updatedAt", "$createdAt"] } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: "$_id",
          avgHours: { $divide: ["$avgTime", 3600000] },
          minHours: { $divide: ["$minTime", 3600000] },
          maxHours: { $divide: ["$maxTime", 3600000] },
          count: 1
        }
      },
      { $sort: { avgHours: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error("Resolution Time Analytics Error:", error);
    res.status(200).json({
      success: false,
      message: "Failed to fetch resolution time analytics",
      data: []
    });
  }
};

/**
 * @desc Get category vs ward correlation
 * @route GET /api/analytics/category-correlation
 * @access Private/Admin
 */
exports.getCategoryCorrelation = async (req, res) => {
  try {
    const correlation = await Grievance.aggregate([
      {
        $group: {
          _id: { ward: "$ward", category: "$category" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.ward",
          categories: {
            $push: {
              category: "$_id.category",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      { $project: { ward: "$_id", categories: 1, total: 1, _id: 0 } },
      { $sort: { ward: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: correlation
    });
  } catch (error) {
    console.error("Category Correlation Error:", error);
    res.status(200).json({
      success: false,
      message: "Failed to fetch category correlation",
      data: []
    });
  }
};
