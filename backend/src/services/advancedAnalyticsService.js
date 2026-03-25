const Grievance = require("../models/Grievance");
const User = require("../models/User");
const CustomDashboard = require("../models/CustomDashboard");

/**
 * Advanced Analytics Service
 * Provides KPI tracking, custom report generation, and comparative analytics
 * Zero-Regression Strategy: New service layer, extends existing analytics
 */

/**
 * KPI Definitions and Calculations
 */
const KPI_DEFINITIONS = {
  // Resolution Metrics
  totalResolutionRate: {
    name: "Overall Resolution Rate",
    description: "Percentage of resolved complaints",
    unit: "%",
    target: 85,
    critical: 70
  },
  avgResolutionTime: {
    name: "Average Resolution Time",
    description: "Mean time to resolve complaints",
    unit: "hours",
    target: 48,
    critical: 96
  },
  firstResponseTime: {
    name: "First Response Time",
    description: "Time to first response",
    unit: "hours",
    target: 24,
    critical: 48
  },
  
  // Volume Metrics
  complaintVolume: {
    name: "Complaint Volume",
    description: "Total complaints received",
    unit: "count",
    target: null
  },
  complaintGrowthRate: {
    name: "Complaint Growth Rate",
    description: "Month-over-month growth",
    unit: "%",
    target: 0
  },
  
  // Quality Metrics
  citizenSatisfaction: {
    name: "Citizen Satisfaction Score",
    description: "Average feedback rating",
    unit: "stars",
    target: 4.0,
    critical: 3.0
  },
  reopenRate: {
    name: "Reopen Rate",
    description: "Percentage of reopened complaints",
    unit: "%",
    target: 5,
    critical: 10
  },
  
  // Efficiency Metrics
  staffProductivity: {
    name: "Staff Productivity",
    description: "Complaints resolved per staff member",
    unit: "count",
    target: 20
  },
  slaCompliance: {
    name: "SLA Compliance Rate",
    description: "Percentage meeting SLA targets",
    unit: "%",
    target: 90,
    critical: 75
  }
};

/**
 * Calculate all KPIs for a given period
 */
async function calculateKPIs(options = {}) {
  const {
    startDate,
    endDate,
    ward,
    category,
    compareWithPrevious = true
  } = options;
  
  try {
    const filters = {};
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    if (ward) filters.ward = ward;
    if (category) filters.category = category;
    
    // Get current period data
    const complaints = await Grievance.find(filters);
    const resolvedComplaints = complaints.filter(c => c.status === "resolved");
    
    // Calculate KPIs
    const kpis = {};
    
    // Resolution Rate
    kpis.totalResolutionRate = {
      ...KPI_DEFINITIONS.totalResolutionRate,
      value: complaints.length > 0 ? 
        parseFloat(((resolvedComplaints.length / complaints.length) * 100).toFixed(2)) : 0,
      trend: null
    };
    
    // Average Resolution Time
    const resolutionTimes = resolvedComplaints
      .map(c => c.updatedAt - c.createdAt)
      .filter(t => t > 0);
    kpis.avgResolutionTime = {
      ...KPI_DEFINITIONS.avgResolutionTime,
      value: resolutionTimes.length > 0 ?
        parseFloat((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / (1000 * 60 * 60)).toFixed(2)) : 0,
      trend: null
    };
    
    // Complaint Volume
    kpis.complaintVolume = {
      ...KPI_DEFINITIONS.complaintVolume,
      value: complaints.length,
      trend: null
    };
    
    // SLA Compliance (simplified - based on resolution time)
    const slaCompliant = resolvedComplaints.filter(c => {
      const resTime = (c.updatedAt - c.createdAt) / (1000 * 60 * 60);
      if (c.priority === "high") return resTime <= 24;
      if (c.priority === "medium") return resTime <= 72;
      return resTime <= 168;
    });
    
    kpis.slaCompliance = {
      ...KPI_DEFINITIONS.slaCompliance,
      value: resolvedComplaints.length > 0 ?
        parseFloat(((slaCompliant.length / resolvedComplaints.length) * 100).toFixed(2)) : 0,
      trend: null
    };
    
    // Compare with previous period if requested
    if (compareWithPrevious && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodLength = end - start;
      
      const prevStart = new Date(start.getTime() - periodLength);
      const prevEnd = start;
      
      const prevFilters = { ...filters };
      prevFilters.createdAt = { $gte: prevStart, $lt: prevEnd };
      
      const prevComplaints = await Grievance.find(prevFilters);
      const prevResolved = prevComplaints.filter(c => c.status === "resolved");
      
      // Calculate trends
      const prevResolutionRate = prevComplaints.length > 0 ?
        (prevResolved.length / prevComplaints.length) * 100 : 0;
      kpis.totalResolutionRate.trend = prevResolutionRate > 0 ?
        parseFloat(((kpis.totalResolutionRate.value - prevResolutionRate) / prevResolutionRate * 100).toFixed(2)) : 0;
      
      const prevVolume = prevComplaints.length;
      kpis.complaintVolume.trend = prevVolume > 0 ?
        parseFloat(((kpis.complaintVolume.value - prevVolume) / prevVolume * 100).toFixed(2)) : 0;
    }
    
    return {
      success: true,
      kpis,
      period: {
        start: startDate,
        end: endDate,
        ward,
        category
      },
      summary: {
        totalKPIs: Object.keys(kpis).length,
        targetsMet: Object.values(kpis).filter(k => 
          k.target && k.value >= k.target
        ).length,
        criticalIssues: Object.values(kpis).filter(k =>
          k.critical && k.value < k.critical
        ).length
      }
    };
  } catch (error) {
    console.error("KPI Calculation Error:", error);
    return {
      success: false,
      error: error.message,
      kpis: {}
    };
  }
}

/**
 * Generate custom report based on configuration
 */
async function generateCustomReport(reportConfig) {
  const {
    reportType = "summary",
    dataSource,
    metrics,
    dimensions,
    filters = {},
    dateRange,
    format = "json"
  } = reportConfig;
  
  try {
    let data = [];
    let reportData = {};
    
    // Build query based on data source
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;
    if (filters.status) query.status = filters.status;
    if (filters.ward) query.ward = filters.ward;
    if (dateRange) {
      query.createdAt = {};
      if (dateRange.start) query.createdAt.$gte = new Date(dateRange.start);
      if (dateRange.end) query.createdAt.$lte = new Date(dateRange.end);
    }
    
    // Fetch data based on data source
    if (dataSource === "complaints") {
      data = await Grievance.find(query).lean();
    } else if (dataSource === "users") {
      data = await User.find({}).lean();
    }
    
    // Aggregate data based on metrics and dimensions
    if (dimensions && dimensions.length > 0) {
      const aggregation = [];
      
      // Build group stage
      const groupBy = {};
      dimensions.forEach(dim => {
        groupBy[dim.field] = `$${dim.field}`;
      });
      
      const groupStage = {
        _id: groupBy,
        ...metrics.reduce((acc, metric) => {
          const aggType = metric.aggregation || "count";
          if (aggType === "count") {
            acc[metric.field] = { $sum: 1 };
          } else if (aggType === "sum") {
            acc[metric.field] = { $sum: `$${metric.field}` };
          } else if (aggType === "avg") {
            acc[metric.field] = { $avg: `$${metric.field}` };
          } else if (aggType === "min") {
            acc[metric.field] = { $min: `$${metric.field}` };
          } else if (aggType === "max") {
            acc[metric.field] = { $max: `$${metric.field}` };
          }
          return acc;
        }, {})
      };
      
      aggregation.push({ $match: query });
      aggregation.push({ $group: groupStage });
      
      if (dataSource === "complaints") {
        reportData.aggregated = await Grievance.aggregate(aggregation);
      }
    } else {
      // Simple aggregation without dimensions
      reportData.summary = {
        totalRecords: data.length,
        ...metrics.reduce((acc, metric) => {
          if (metric.aggregation === "count") {
            acc[metric.field] = data.length;
          } else if (metric.aggregation === "sum" && metric.field) {
            acc[metric.field] = data.reduce((sum, item) => sum + (item[metric.field] || 0), 0);
          } else if (metric.aggregation === "avg" && metric.field) {
            const sum = data.reduce((s, item) => s + (item[metric.field] || 0), 0);
            acc[metric.field] = data.length > 0 ? sum / data.length : 0;
          }
          return acc;
        }, {})
      };
    }
    
    return {
      success: true,
      reportType,
      data: reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        recordCount: data.length,
        filters,
        dateRange
      }
    };
  } catch (error) {
    console.error("Custom Report Generation Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Comparative analytics across wards/categories
 */
async function getComparativeAnalytics(options = {}) {
  const {
    compareBy = "ward", // ward, category, priority
    metric = "resolutionRate",
    startDate,
    endDate
  } = options;
  
  try {
    const filters = {};
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    
    // Build aggregation pipeline
    const aggregation = [
      { $match: filters },
      {
        $group: {
          _id: `$${compareBy}`,
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
          dimension: "$_id",
          totalComplaints: 1,
          resolvedComplaints: 1,
          pendingComplaints: 1,
          resolutionRate: {
            $cond: [
              { $gt: ["$totalComplaints", 0] },
              { $multiply: [{ $divide: ["$resolvedComplaints", "$totalComplaints"] }, 100] },
              0
            ]
          },
          avgResolutionHours: {
            $divide: [{ $ifNull: ["$avgResolutionTime", 0] }, 3600000]
          }
        }
      },
      { $sort: { resolutionRate: -1 } }
    ];
    
    const results = await Grievance.aggregate(aggregation);
    
    // Calculate rankings
    const rankedResults = results.map((result, index) => ({
      ...result,
      rank: index + 1,
      resolutionRate: parseFloat((result.resolutionRate || 0).toFixed(2)),
      avgResolutionHours: parseFloat((result.avgResolutionHours || 0).toFixed(2))
    }));
    
    // Calculate benchmarks
    const avgResolutionRate = rankedResults.reduce((sum, r) => sum + r.resolutionRate, 0) / (rankedResults.length || 1);
    const avgResolutionTime = rankedResults.reduce((sum, r) => sum + r.avgResolutionHours, 0) / (rankedResults.length || 1);
    
    return {
      success: true,
      compareBy,
      metric,
      results: rankedResults,
      benchmarks: {
        avgResolutionRate: parseFloat(avgResolutionRate.toFixed(2)),
        avgResolutionTime: parseFloat(avgResolutionTime.toFixed(2)),
        topPerformer: rankedResults[0]?.dimension || "N/A",
        needsImprovement: rankedResults[rankedResults.length - 1]?.dimension || "N/A"
      },
      insights: generateComparativeInsights(rankedResults, compareBy)
    };
  } catch (error) {
    console.error("Comparative Analytics Error:", error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Generate insights from comparative data
 */
function generateComparativeInsights(results, compareBy) {
  const insights = [];
  
  if (results.length === 0) return insights;
  
  const best = results[0];
  const worst = results[results.length - 1];
  const gap = best.resolutionRate - worst.resolutionRate;
  
  if (gap > 30) {
    insights.push({
      type: "alert",
      message: `Significant performance gap detected: ${gap.toFixed(1)}% difference between best and worst ${compareBy}`,
      priority: "high"
    });
  }
  
  const underperformers = results.filter(r => r.resolutionRate < 70);
  if (underperformers.length > 0) {
    insights.push({
      type: "action",
      message: `${underperformers.length} ${compareBy}(s) below 70% resolution rate - intervention recommended`,
      priority: "medium"
    });
  }
  
  const topPerformers = results.filter(r => r.resolutionRate > 90);
  if (topPerformers.length > 0) {
    insights.push({
      type: "success",
      message: `${topPerformers.length} ${compareBy}(s) exceeding 90% resolution rate - identify best practices`,
      priority: "low"
    });
  }
  
  return insights;
}

/**
 * Dashboard widget data fetcher
 */
async function getWidgetData(widget) {
  const { type, dataSource, metrics, filters, dimensions } = widget;
  
  try {
    // Build query from filters
    const query = {};
    if (filters) {
      if (filters.category) query.category = filters.category;
      if (filters.priority) query.priority = filters.priority;
      if (filters.status) query.status = filters.status;
      if (filters.ward) query.ward = filters.ward;
      if (filters.dateRange) {
        query.createdAt = {};
        if (filters.dateRange.start) query.createdAt.$gte = new Date(filters.dateRange.start);
        if (filters.dateRange.end) query.createdAt.$lte = new Date(filters.dateRange.end);
      }
    }
    
    // Fetch and aggregate data based on widget type
    let data;
    
    if (type === "kpi-card") {
      const complaints = await Grievance.find(query);
      const metric = metrics[0];
      
      if (metric.aggregation === "count") {
        data = { value: complaints.length };
      } else if (metric.field === "resolutionRate") {
        const resolved = complaints.filter(c => c.status === "resolved").length;
        data = { 
          value: complaints.length > 0 ? parseFloat(((resolved / complaints.length) * 100).toFixed(2)) : 0,
          unit: "%"
        };
      }
    } else if (type === "pie-chart" || type === "bar-chart") {
      const groupField = dimensions[0]?.field || "category";
      const aggregation = await Grievance.aggregate([
        { $match: query },
        { $group: { _id: `$${groupField}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      data = aggregation.map(item => ({
        name: item._id,
        value: item.count
      }));
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("Widget Data Fetch Error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  calculateKPIs,
  generateCustomReport,
  getComparativeAnalytics,
  getWidgetData,
  KPI_DEFINITIONS
};
