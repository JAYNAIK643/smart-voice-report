const predictiveAnalyticsService = require("../services/predictiveAnalyticsService");

/**
 * Predictive Analytics Controller
 * Handles trend forecasting, SLA tracking, and hotspot identification
 * Zero-Regression Strategy: New controller, extends existing analytics
 */

/**
 * @desc Get complaint trend forecast
 * @route GET /api/predictive/forecast
 * @access Private/Admin
 */
exports.getComplaintForecast = async (req, res) => {
  try {
    const { historicalMonths, forecastMonths } = req.query;
    
    const forecast = await predictiveAnalyticsService.forecastComplaintTrends({
      historicalMonths: parseInt(historicalMonths) || 6,
      forecastMonths: parseInt(forecastMonths) || 3
    });
    
    res.status(200).json(forecast);
  } catch (error) {
    console.error("Forecast Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate forecast",
      error: error.message
    });
  }
};

/**
 * @desc Get SLA compliance metrics
 * @route GET /api/predictive/sla-compliance
 * @access Private/Admin
 */
exports.getSLACompliance = async (req, res) => {
  try {
    const { days } = req.query;
    
    const compliance = await predictiveAnalyticsService.trackSLACompliance({
      days: parseInt(days) || 30
    });
    
    res.status(200).json(compliance);
  } catch (error) {
    console.error("SLA Compliance Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track SLA compliance",
      error: error.message
    });
  }
};

/**
 * @desc Get geographic hotspots
 * @route GET /api/predictive/hotspots
 * @access Private/Admin
 */
exports.getHotspots = async (req, res) => {
  try {
    const { days, minComplaintsThreshold } = req.query;
    
    const hotspots = await predictiveAnalyticsService.identifyHotspots({
      days: parseInt(days) || 30,
      minComplaintsThreshold: parseInt(minComplaintsThreshold) || 5
    });
    
    res.status(200).json(hotspots);
  } catch (error) {
    console.error("Hotspots Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to identify hotspots",
      error: error.message
    });
  }
};

/**
 * @desc Get complete predictive analytics dashboard data
 * @route GET /api/predictive/dashboard
 * @access Private/Admin
 */
exports.getPredictiveDashboard = async (req, res) => {
  try {
    // Fetch all predictive analytics in parallel
    const [forecast, slaCompliance, hotspots] = await Promise.all([
      predictiveAnalyticsService.forecastComplaintTrends({ historicalMonths: 6, forecastMonths: 3 }),
      predictiveAnalyticsService.trackSLACompliance({ days: 30 }),
      predictiveAnalyticsService.identifyHotspots({ days: 30 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        forecast,
        slaCompliance,
        hotspots
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Predictive Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate predictive dashboard",
      error: error.message
    });
  }
};

/**
 * @desc Get resource planning recommendations
 * @route GET /api/predictive/resource-planning
 * @access Private/Admin
 */
exports.getResourcePlanning = async (req, res) => {
  try {
    // Get forecast and hotspots for resource planning
    const [forecast, hotspots] = await Promise.all([
      predictiveAnalyticsService.forecastComplaintTrends({ historicalMonths: 3, forecastMonths: 2 }),
      predictiveAnalyticsService.identifyHotspots({ days: 30 })
    ]);

    // Calculate resource recommendations
    const recommendations = [];
    
    // Based on forecast
    if (forecast.success && forecast.trend.direction === "increasing" && forecast.trend.percentage > 15) {
      recommendations.push({
        type: "staffing",
        priority: "high",
        message: `Increase staff allocation by ${Math.ceil(forecast.trend.percentage / 10)}% to handle predicted volume increase`,
        targetArea: "All departments"
      });
    }

    // Based on hotspots
    if (hotspots.success && hotspots.criticalCount > 0) {
      hotspots.hotspots.slice(0, 3).forEach(hotspot => {
        if (hotspot.severity === "critical" || hotspot.severity === "high") {
          recommendations.push({
            type: "deployment",
            priority: hotspot.severity,
            message: `Deploy additional resources to ${hotspot.ward}`,
            targetArea: hotspot.ward,
            focus: hotspot.topCategories[0]?.category || "General"
          });
        }
      });
    }

    // Staff allocation by category
    const staffAllocation = {
      immediate: recommendations.filter(r => r.priority === "critical" || r.priority === "high").length,
      planned: recommendations.filter(r => r.priority === "medium").length,
      monitoring: recommendations.filter(r => r.priority === "low").length
    };

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        staffAllocation,
        predictedLoad: forecast.success ? forecast.forecast.predictions[0] : 0,
        criticalAreas: hotspots.success ? hotspots.criticalCount : 0,
        analysis: {
          trend: forecast.success ? forecast.trend.direction : "unknown",
          trendPercentage: forecast.success ? forecast.trend.percentage : 0,
          mostAffectedWard: hotspots.success ? hotspots.summary.mostAffectedWard : "N/A"
        }
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Resource Planning Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate resource planning",
      error: error.message
    });
  }
};

module.exports = exports;
