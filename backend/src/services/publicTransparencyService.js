const Grievance = require("../models/Grievance");
const User = require("../models/User");

/**
 * Public Transparency Service - Phase 4
 * Public ward performance, officer scores, and resolution tracking
 */

/**
 * Get public ward performance metrics
 */
async function getWardPerformance(ward = null) {
  try {
    const matchStage = ward ? { ward } : {};
    
    const performance = await Grievance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$ward",
          totalComplaints: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
          avgResolutionTime: { $avg: "$resolutionTime" }
        }
      },
      { $sort: { totalComplaints: -1 } }
    ]);

    const data = performance.map(w => {
      const resolutionRate = w.totalComplaints > 0 
        ? Math.round((w.resolved / w.totalComplaints) * 100) : 0;
      const avgHours = w.avgResolutionTime 
        ? Math.round(w.avgResolutionTime / (1000 * 60 * 60)) : 0;
      
      return {
        ward: w._id || "Unknown",
        totalComplaints: w.totalComplaints,
        resolved: w.resolved,
        pending: w.pending + w.inProgress,
        resolutionRate,
        avgResolutionHours: avgHours,
        performanceScore: calculatePerformanceScore(resolutionRate, avgHours)
      };
    });

    return {
      success: true,
      data,
      summary: {
        totalWards: data.length,
        overallResolutionRate: data.length > 0 
          ? Math.round(data.reduce((s, w) => s + w.resolutionRate, 0) / data.length) : 0
      }
    };
  } catch (error) {
    console.error("Ward Performance Error:", error);
    return { success: false, error: error.message, data: [] };
  }
}

function calculatePerformanceScore(resolutionRate, avgHours) {
  // Score based on resolution rate (60%) and avg resolution time (40%)
  const rateScore = resolutionRate;
  const timeScore = Math.max(0, 100 - (avgHours * 2));
  return Math.round((rateScore * 0.6) + (timeScore * 0.4));
}

/**
 * Get officer/ward admin performance
 */
async function getOfficerPerformance() {
  try {
    const officers = await User.find({
      role: { $in: ['ward_admin', 'admin'] },
      isActive: true
    }).select('name email ward role');

    const performanceData = [];

    for (const officer of officers) {
      const stats = await Grievance.aggregate([
        { $match: { assignedTo: officer._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
            avgTime: { $avg: "$resolutionTime" }
          }
        }
      ]);

      const s = stats[0] || { total: 0, resolved: 0, avgTime: 0 };
      const resolutionRate = s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0;

      performanceData.push({
        officerId: officer._id,
        name: officer.name,
        ward: officer.ward || 'All',
        role: officer.role,
        totalAssigned: s.total,
        resolved: s.resolved,
        resolutionRate,
        avgResolutionHours: s.avgTime ? Math.round(s.avgTime / (1000 * 60 * 60)) : 0,
        performanceScore: calculatePerformanceScore(resolutionRate, s.avgTime ? s.avgTime / (1000 * 60 * 60) : 0)
      });
    }

    performanceData.sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      success: true,
      data: performanceData
    };
  } catch (error) {
    console.error("Officer Performance Error:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Get resolution time analytics
 */
async function getResolutionTimeAnalytics() {
  try {
    const analytics = await Grievance.aggregate([
      { $match: { status: 'resolved', resolutionTime: { $exists: true } } },
      {
        $group: {
          _id: { category: "$category", priority: "$priority" },
          avgResolutionHours: { $avg: { $divide: ["$resolutionTime", 1000 * 60 * 60] } },
          minResolutionHours: { $min: { $divide: ["$resolutionTime", 1000 * 60 * 60] } },
          maxResolutionHours: { $max: { $divide: ["$resolutionTime", 1000 * 60 * 60] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const byCategory = await Grievance.aggregate([
      { $match: { status: 'resolved', resolutionTime: { $exists: true } } },
      {
        $group: {
          _id: "$category",
          avgHours: { $avg: { $divide: ["$resolutionTime", 1000 * 60 * 60] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      success: true,
      detailed: analytics.map(a => ({
        category: a._id.category,
        priority: a._id.priority,
        avgHours: Math.round(a.avgResolutionHours),
        minHours: Math.round(a.minResolutionHours),
        maxHours: Math.round(a.maxResolutionHours),
        count: a.count
      })),
      byCategory: byCategory.map(c => ({
        category: c._id,
        avgHours: Math.round(c.avgHours),
        count: c.count
      }))
    };
  } catch (error) {
    console.error("Resolution Analytics Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get public dashboard summary (no auth required)
 */
async function getPublicDashboard() {
  try {
    const [wardPerf, resolutionTime] = await Promise.all([
      getWardPerformance(),
      getResolutionTimeAnalytics()
    ]);

    const overallStats = await Grievance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$status", ["pending", "in-progress"]] }, 1, 0] } }
        }
      }
    ]);

    const stats = overallStats[0] || { total: 0, resolved: 0, pending: 0 };

    return {
      success: true,
      overview: {
        totalComplaints: stats.total,
        resolvedComplaints: stats.resolved,
        pendingComplaints: stats.pending,
        resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
      },
      wards: wardPerf.data,
      resolutionTime: resolutionTime.byCategory
    };
  } catch (error) {
    console.error("Public Dashboard Error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getWardPerformance,
  getOfficerPerformance,
  getResolutionTimeAnalytics,
  getPublicDashboard
};