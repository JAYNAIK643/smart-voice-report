const Grievance = require("../models/Grievance");

/**
 * Predictive Analytics Service
 * Provides trend forecasting, SLA tracking, and hotspot identification
 * Zero-Regression Strategy: New service layer, extends existing analytics
 */

/**
 * Simple Moving Average for trend prediction
 */
function calculateMovingAverage(data, window = 3) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null);
      continue;
    }
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  return result;
}

/**
 * Linear regression for trend prediction
 */
function linearRegression(xValues, yValues) {
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Predict future values using linear regression
 */
function predictFuture(historicalData, periodsAhead = 4) {
  if (historicalData.length < 2) {
    return Array(periodsAhead).fill(0);
  }

  const xValues = historicalData.map((_, i) => i);
  const yValues = historicalData;
  const { slope, intercept } = linearRegression(xValues, yValues);

  const predictions = [];
  for (let i = 1; i <= periodsAhead; i++) {
    const x = historicalData.length + i - 1;
    const prediction = Math.max(0, Math.round(slope * x + intercept));
    predictions.push(prediction);
  }

  return predictions;
}

/**
 * Trend Forecasting - Predict complaint volumes
 */
async function forecastComplaintTrends(options = {}) {
  const {
    historicalMonths = 6,
    forecastMonths = 3,
    groupBy = "month" // month, week, day
  } = options;

  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - historicalMonths);

    // Get historical data
    const historicalData = [];
    const labels = [];

    for (let i = historicalMonths - 1; i >= 0; i--) {
      const periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - i);
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);

      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0);
      periodEnd.setHours(23, 59, 59, 999);

      const stats = await Grievance.aggregate([
        {
          $match: {
            createdAt: { $gte: periodStart, $lte: periodEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } }
          }
        }
      ]);

      const monthData = stats[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0, high: 0 };
      historicalData.push(monthData);
      labels.push(periodStart.toLocaleString('default', { month: 'short', year: 'numeric' }));
    }

    // Calculate predictions
    const totalCounts = historicalData.map(d => d.total);
    const predictions = predictFuture(totalCounts, forecastMonths);

    // Calculate trend
    const recentAvg = totalCounts.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = totalCounts.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const trendDirection = recentAvg > olderAvg ? "increasing" : recentAvg < olderAvg ? "decreasing" : "stable";
    const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0;

    // Generate forecast labels
    const forecastLabels = [];
    for (let i = 1; i <= forecastMonths; i++) {
      const futureDate = new Date(now);
      futureDate.setMonth(now.getMonth() + i);
      forecastLabels.push(futureDate.toLocaleString('default', { month: 'short', year: 'numeric' }));
    }

    // Calculate confidence based on data consistency
    const variance = calculateVariance(totalCounts);
    const confidence = Math.max(60, Math.min(95, 100 - (variance / Math.max(...totalCounts) * 100)));

    return {
      success: true,
      historical: {
        labels,
        data: historicalData,
        totalCounts
      },
      forecast: {
        labels: forecastLabels,
        predictions,
        confidence: parseFloat(confidence.toFixed(2))
      },
      trend: {
        direction: trendDirection,
        percentage: parseFloat(trendPercentage.toFixed(2)),
        analysis: generateTrendAnalysis(trendDirection, trendPercentage)
      },
      insights: generateTrendInsights(historicalData, predictions)
    };
  } catch (error) {
    console.error("Forecast Error:", error);
    return {
      success: false,
      error: error.message,
      historical: { labels: [], data: [], totalCounts: [] },
      forecast: { labels: [], predictions: [], confidence: 0 },
      trend: { direction: "unknown", percentage: 0, analysis: "" }
    };
  }
}

/**
 * Calculate variance for confidence scoring
 */
function calculateVariance(data) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Generate trend analysis text
 */
function generateTrendAnalysis(direction, percentage) {
  const absPercentage = Math.abs(percentage);
  
  if (direction === "increasing") {
    if (absPercentage > 20) return `Significant increase (${absPercentage.toFixed(1)}%) - Resource allocation needed`;
    if (absPercentage > 10) return `Moderate increase (${absPercentage.toFixed(1)}%) - Monitor closely`;
    return `Slight increase (${absPercentage.toFixed(1)}%) - Normal variation`;
  } else if (direction === "decreasing") {
    if (absPercentage > 20) return `Significant decrease (${absPercentage.toFixed(1)}%) - Improved service delivery`;
    if (absPercentage > 10) return `Moderate decrease (${absPercentage.toFixed(1)}%) - Positive trend`;
    return `Slight decrease (${absPercentage.toFixed(1)}%) - Maintaining service`;
  }
  
  return "Stable trend - Consistent complaint volume";
}

/**
 * Generate actionable insights
 */
function generateTrendInsights(historical, predictions) {
  const insights = [];
  const recentTotal = historical[historical.length - 1]?.total || 0;
  const predictedTotal = predictions[0] || 0;

  if (predictedTotal > recentTotal * 1.15) {
    insights.push({
      type: "warning",
      message: "Expected 15%+ increase next month - prepare resources",
      priority: "high"
    });
  }

  const avgResolutionRate = historical.reduce((sum, h) => {
    return sum + (h.total > 0 ? h.resolved / h.total : 0);
  }, 0) / historical.length;

  if (avgResolutionRate < 0.7) {
    insights.push({
      type: "action",
      message: `Current resolution rate ${(avgResolutionRate * 100).toFixed(1)}% - below 70% target`,
      priority: "medium"
    });
  }

  const recentHigh = historical[historical.length - 1]?.high || 0;
  if (recentHigh / recentTotal > 0.3) {
    insights.push({
      type: "alert",
      message: "High priority complaints exceed 30% - review processes",
      priority: "high"
    });
  }

  return insights;
}

/**
 * SLA Compliance Tracking
 */
async function trackSLACompliance(options = {}) {
  const {
    days = 30,
    slaTargets = {
      high: 24, // hours
      medium: 72,
      low: 168
    }
  } = options;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get resolved complaints with resolution time
    const complaints = await Grievance.aggregate([
      {
        $match: {
          status: "resolved",
          createdAt: { $gte: startDate }
        }
      },
      {
        $project: {
          priority: 1,
          category: 1,
          ward: 1,
          resolutionTime: {
            $subtract: ["$updatedAt", "$createdAt"]
          }
        }
      }
    ]);

    // Calculate SLA compliance by priority
    const priorityCompliance = {};
    const categoryCompliance = {};
    const wardCompliance = {};

    for (const priority of ["high", "medium", "low"]) {
      const priorityComplaints = complaints.filter(c => c.priority === priority);
      const slaTarget = slaTargets[priority] * 60 * 60 * 1000; // Convert to milliseconds
      
      const compliant = priorityComplaints.filter(c => c.resolutionTime <= slaTarget).length;
      const total = priorityComplaints.length;
      
      priorityCompliance[priority] = {
        total,
        compliant,
        breached: total - compliant,
        complianceRate: total > 0 ? parseFloat(((compliant / total) * 100).toFixed(2)) : 0,
        avgResolutionHours: total > 0 ? 
          parseFloat((priorityComplaints.reduce((sum, c) => sum + c.resolutionTime, 0) / total / (1000 * 60 * 60)).toFixed(2)) : 0,
        slaTargetHours: slaTargets[priority]
      };
    }

    // Calculate by category
    const categories = [...new Set(complaints.map(c => c.category))];
    for (const category of categories) {
      const categoryComplaints = complaints.filter(c => c.category === category);
      const compliant = categoryComplaints.filter(c => {
        const slaTarget = slaTargets[c.priority] * 60 * 60 * 1000;
        return c.resolutionTime <= slaTarget;
      }).length;
      
      categoryCompliance[category] = {
        total: categoryComplaints.length,
        compliant,
        complianceRate: categoryComplaints.length > 0 ? 
          parseFloat(((compliant / categoryComplaints.length) * 100).toFixed(2)) : 0
      };
    }

    // Calculate by ward
    const wards = [...new Set(complaints.map(c => c.ward))];
    for (const ward of wards) {
      const wardComplaints = complaints.filter(c => c.ward === ward);
      const compliant = wardComplaints.filter(c => {
        const slaTarget = slaTargets[c.priority] * 60 * 60 * 1000;
        return c.resolutionTime <= slaTarget;
      }).length;
      
      wardCompliance[ward] = {
        total: wardComplaints.length,
        compliant,
        complianceRate: wardComplaints.length > 0 ? 
          parseFloat(((compliant / wardComplaints.length) * 100).toFixed(2)) : 0
      };
    }

    // Overall compliance
    const totalComplaint = complaints.length;
    const totalCompliant = complaints.filter(c => {
      const slaTarget = slaTargets[c.priority] * 60 * 60 * 1000;
      return c.resolutionTime <= slaTarget;
    }).length;

    const overallCompliance = totalComplaint > 0 ? 
      parseFloat(((totalCompliant / totalComplaint) * 100).toFixed(2)) : 0;

    // Generate alerts
    const alerts = [];
    if (priorityCompliance.high?.complianceRate < 80) {
      alerts.push({
        severity: "critical",
        message: `High priority SLA compliance at ${priorityCompliance.high.complianceRate}% (Target: 80%)`,
        action: "Review high priority handling process"
      });
    }
    if (overallCompliance < 85) {
      alerts.push({
        severity: "warning",
        message: `Overall SLA compliance at ${overallCompliance}% (Target: 85%)`,
        action: "Improve resource allocation"
      });
    }

    return {
      success: true,
      overall: {
        complianceRate: overallCompliance,
        totalComplaints: totalComplaint,
        compliantComplaints: totalCompliant,
        breachedComplaints: totalComplaint - totalCompliant,
        target: 85 // Target percentage
      },
      byPriority: priorityCompliance,
      byCategory: categoryCompliance,
      byWard: wardCompliance,
      alerts,
      timeframe: { days, startDate: startDate.toISOString() }
    };
  } catch (error) {
    console.error("SLA Tracking Error:", error);
    return {
      success: false,
      error: error.message,
      overall: { complianceRate: 0, totalComplaints: 0 }
    };
  }
}

/**
 * Hotspot Identification - Geographic problem areas
 */
async function identifyHotspots(options = {}) {
  const {
    days = 30,
    minComplaintsThreshold = 5
  } = options;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate by ward and category
    const wardAnalysis = await Grievance.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            ward: "$ward",
            category: "$category"
          },
          count: { $sum: 1 },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          highPriorityCount: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
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
      { $sort: { count: -1 } }
    ]);

    // Calculate overall ward statistics
    const wardStats = {};
    wardAnalysis.forEach(item => {
      const ward = item._id.ward;
      if (!wardStats[ward]) {
        wardStats[ward] = {
          ward,
          totalComplaints: 0,
          pendingComplaints: 0,
          highPriorityComplaints: 0,
          categories: [],
          avgResolutionHours: 0,
          resolutionCount: 0
        };
      }
      
      wardStats[ward].totalComplaints += item.count;
      wardStats[ward].pendingComplaints += item.pendingCount;
      wardStats[ward].highPriorityComplaints += item.highPriorityCount;
      wardStats[ward].categories.push({
        category: item._id.category,
        count: item.count
      });
      
      if (item.avgResolutionTime) {
        wardStats[ward].avgResolutionHours += item.avgResolutionTime / (1000 * 60 * 60);
        wardStats[ward].resolutionCount++;
      }
    });

    // Calculate hotspot scores (0-100)
    const hotspots = Object.values(wardStats).map(ward => {
      const avgResolution = ward.resolutionCount > 0 ? 
        ward.avgResolutionHours / ward.resolutionCount : 0;
      
      // Score based on: complaint volume (40%), pending ratio (30%), high priority ratio (20%), resolution time (10%)
      const volumeScore = Math.min((ward.totalComplaints / 50) * 40, 40);
      const pendingScore = (ward.pendingComplaints / ward.totalComplaints) * 30;
      const priorityScore = (ward.highPriorityComplaints / ward.totalComplaints) * 20;
      const resolutionScore = avgResolution > 72 ? 10 : (avgResolution / 72) * 10;
      
      const hotspotScore = volumeScore + pendingScore + priorityScore + resolutionScore;
      
      return {
        ...ward,
        avgResolutionHours: parseFloat(avgResolution.toFixed(2)),
        hotspotScore: parseFloat(hotspotScore.toFixed(2)),
        severity: hotspotScore > 70 ? "critical" : hotspotScore > 50 ? "high" : hotspotScore > 30 ? "medium" : "low",
        topCategories: ward.categories.sort((a, b) => b.count - a.count).slice(0, 3)
      };
    });

    // Sort by hotspot score
    hotspots.sort((a, b) => b.hotspotScore - a.hotspotScore);

    // Identify critical hotspots
    const criticalHotspots = hotspots.filter(h => h.severity === "critical" || h.severity === "high");

    // Generate recommendations
    const recommendations = criticalHotspots.map(hotspot => ({
      ward: hotspot.ward,
      issue: `High complaint volume (${hotspot.totalComplaints}) with ${hotspot.pendingComplaints} pending`,
      action: `Focus on ${hotspot.topCategories[0]?.category || 'top issues'} - ${hotspot.topCategories[0]?.count || 0} cases`,
      priority: hotspot.severity
    }));

    return {
      success: true,
      hotspots,
      criticalCount: criticalHotspots.length,
      recommendations,
      summary: {
        totalWards: hotspots.length,
        averageComplaintsPerWard: parseFloat((hotspots.reduce((sum, h) => sum + h.totalComplaints, 0) / hotspots.length).toFixed(2)),
        mostAffectedWard: hotspots[0]?.ward || "N/A",
        highestScore: hotspots[0]?.hotspotScore || 0
      },
      timeframe: { days, startDate: startDate.toISOString() }
    };
  } catch (error) {
    console.error("Hotspot Identification Error:", error);
    return {
      success: false,
      error: error.message,
      hotspots: [],
      recommendations: []
    };
  }
}

module.exports = {
  forecastComplaintTrends,
  trackSLACompliance,
  identifyHotspots
};
