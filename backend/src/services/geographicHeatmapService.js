const Grievance = require("../models/Grievance");

/**
 * Geographic Heatmap Service - Phase 2 Advanced Analytics
 * Provides ward-based complaint density visualization and category hotspots
 */

async function getWardHeatmapData(options = {}) {
  const { timeRange = 30 } = options;
  try {
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - timeRange);

    const wardData = await Grievance.aggregate([
      { $match: { createdAt: { $gte: timeLimit } } },
      {
        $group: {
          _id: "$ward",
          totalComplaints: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } }
        }
      },
      { $sort: { totalComplaints: -1 } }
    ]);

    const maxComplaints = Math.max(...wardData.map(w => w.totalComplaints), 1);
    
    const heatmapData = wardData.map(ward => {
      const resolutionRate = ward.totalComplaints > 0 
        ? Math.round((ward.resolved / ward.totalComplaints) * 100) : 0;
      return {
        ward: ward._id || "Unknown",
        totalComplaints: ward.totalComplaints,
        pending: ward.pending,
        inProgress: ward.inProgress,
        resolved: ward.resolved,
        highPriority: ward.highPriority,
        densityScore: Math.round((ward.totalComplaints / maxComplaints) * 100),
        resolutionRate,
        status: resolutionRate < 60 ? 'critical' : resolutionRate < 75 ? 'warning' : 'normal'
      };
    });

    heatmapData.sort((a, b) => b.densityScore - a.densityScore);

    return {
      success: true,
      data: heatmapData,
      summary: {
        totalWards: heatmapData.length,
        totalComplaints: heatmapData.reduce((s, w) => s + w.totalComplaints, 0),
        criticalWards: heatmapData.filter(w => w.status === 'critical').length,
        warningWards: heatmapData.filter(w => w.status === 'warning').length
      }
    };
  } catch (error) {
    console.error("Heatmap Error:", error);
    return { success: false, error: error.message, data: [] };
  }
}

async function getCategoryHotspots(options = {}) {
  const { timeRange = 30, limit = 10 } = options;
  try {
    const timeLimit = new Date();
    timeLimit.setDate(timeLimit.getDate() - timeRange);

    const hotspots = await Grievance.aggregate([
      { $match: { createdAt: { $gte: timeLimit } } },
      { $group: { _id: { ward: "$ward", category: "$category" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    return {
      success: true,
      hotspots: hotspots.map(h => ({
        ward: h._id.ward,
        category: h._id.category,
        complaintCount: h.count
      }))
    };
  } catch (error) {
    return { success: false, error: error.message, hotspots: [] };
  }
}

module.exports = { getWardHeatmapData, getCategoryHotspots };