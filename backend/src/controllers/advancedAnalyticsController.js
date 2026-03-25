const advancedAnalyticsService = require("../services/advancedAnalyticsService");
const CustomDashboard = require("../models/CustomDashboard");

/**
 * Advanced Analytics Controller
 * Handles KPI tracking, custom dashboards, and report generation
 * Zero-Regression Strategy: New controller, extends existing analytics
 */

/**
 * @desc Get KPIs for a given period
 * @route GET /api/analytics/kpis
 * @access Private/Admin
 */
exports.getKPIs = async (req, res) => {
  try {
    const { startDate, endDate, ward, category, compareWithPrevious } = req.query;
    
    const kpis = await advancedAnalyticsService.calculateKPIs({
      startDate,
      endDate,
      ward,
      category,
      compareWithPrevious: compareWithPrevious === "true"
    });
    
    res.status(200).json(kpis);
  } catch (error) {
    console.error("KPI Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KPIs",
      error: error.message
    });
  }
};

/**
 * @desc Generate custom report
 * @route POST /api/analytics/reports/generate
 * @access Private/Admin
 */
exports.generateReport = async (req, res) => {
  try {
    const reportConfig = req.body;
    
    const report = await advancedAnalyticsService.generateCustomReport(reportConfig);
    
    res.status(200).json(report);
  } catch (error) {
    console.error("Report Generation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message
    });
  }
};

/**
 * @desc Get comparative analytics
 * @route GET /api/analytics/comparative
 * @access Private/Admin
 */
exports.getComparativeAnalytics = async (req, res) => {
  try {
    const { compareBy, metric, startDate, endDate } = req.query;
    
    const analytics = await advancedAnalyticsService.getComparativeAnalytics({
      compareBy,
      metric,
      startDate,
      endDate
    });
    
    res.status(200).json(analytics);
  } catch (error) {
    console.error("Comparative Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comparative analytics",
      error: error.message
    });
  }
};

/**
 * @desc Create custom dashboard
 * @route POST /api/analytics/dashboards
 * @access Private/Admin
 */
exports.createDashboard = async (req, res) => {
  try {
    const { name, description, widgets, layout, category, isPublic, tags } = req.body;
    
    if (!name || !widgets || widgets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dashboard name and at least one widget are required"
      });
    }
    
    const dashboard = new CustomDashboard({
      name,
      description,
      userId: req.user._id,
      widgets,
      layout: layout || "grid",
      category: category || "custom",
      isPublic: isPublic || false,
      tags: tags || []
    });
    
    await dashboard.save();
    
    res.status(201).json({
      success: true,
      message: "Dashboard created successfully",
      data: dashboard
    });
  } catch (error) {
    console.error("Dashboard Creation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create dashboard",
      error: error.message
    });
  }
};

/**
 * @desc Get user's dashboards
 * @route GET /api/analytics/dashboards
 * @access Private
 */
exports.getDashboards = async (req, res) => {
  try {
    const { category, isPublic } = req.query;
    
    const filters = { userId: req.user._id };
    if (category) filters.category = category;
    if (isPublic !== undefined) filters.isPublic = isPublic === "true";
    
    const dashboards = await CustomDashboard.find(filters)
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      data: dashboards
    });
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboards",
      error: error.message
    });
  }
};

/**
 * @desc Get single dashboard by ID
 * @route GET /api/analytics/dashboards/:id
 * @access Private
 */
exports.getDashboardById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dashboard = await CustomDashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Dashboard not found"
      });
    }
    
    // Check permissions
    if (!dashboard.isPublic && dashboard.userId.toString() !== req.user._id.toString()) {
      const sharedUser = dashboard.sharedWith.find(
        s => s.userId.toString() === req.user._id.toString()
      );
      
      if (!sharedUser) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }
    }
    
    // Update view count and last viewed
    dashboard.viewCount += 1;
    dashboard.lastViewed = new Date();
    await dashboard.save();
    
    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
      error: error.message
    });
  }
};

/**
 * @desc Update dashboard
 * @route PUT /api/analytics/dashboards/:id
 * @access Private
 */
exports.updateDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const dashboard = await CustomDashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Dashboard not found"
      });
    }
    
    // Check permissions
    if (dashboard.userId.toString() !== req.user._id.toString()) {
      const sharedUser = dashboard.sharedWith.find(
        s => s.userId.toString() === req.user._id.toString() && s.permission === "edit"
      );
      
      if (!sharedUser) {
        return res.status(403).json({
          success: false,
          message: "Edit permission denied"
        });
      }
    }
    
    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== "_id" && key !== "userId") {
        dashboard[key] = updates[key];
      }
    });
    
    await dashboard.save();
    
    res.status(200).json({
      success: true,
      message: "Dashboard updated successfully",
      data: dashboard
    });
  } catch (error) {
    console.error("Dashboard Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update dashboard",
      error: error.message
    });
  }
};

/**
 * @desc Delete dashboard
 * @route DELETE /api/analytics/dashboards/:id
 * @access Private
 */
exports.deleteDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dashboard = await CustomDashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Dashboard not found"
      });
    }
    
    // Only owner can delete
    if (dashboard.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only dashboard owner can delete"
      });
    }
    
    await dashboard.deleteOne();
    
    res.status(200).json({
      success: true,
      message: "Dashboard deleted successfully"
    });
  } catch (error) {
    console.error("Dashboard Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete dashboard",
      error: error.message
    });
  }
};

/**
 * @desc Get widget data for dashboard
 * @route POST /api/analytics/widgets/data
 * @access Private
 */
exports.getWidgetData = async (req, res) => {
  try {
    const { widget } = req.body;
    
    if (!widget) {
      return res.status(400).json({
        success: false,
        message: "Widget configuration is required"
      });
    }
    
    const data = await advancedAnalyticsService.getWidgetData(widget);
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Widget Data Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch widget data",
      error: error.message
    });
  }
};

/**
 * @desc Share dashboard with users
 * @route POST /api/analytics/dashboards/:id/share
 * @access Private
 */
exports.shareDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, permission = "view" } = req.body;
    
    const dashboard = await CustomDashboard.findById(id);
    
    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: "Dashboard not found"
      });
    }
    
    // Only owner can share
    if (dashboard.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only dashboard owner can share"
      });
    }
    
    // Add shared users
    userIds.forEach(userId => {
      const existingShare = dashboard.sharedWith.find(
        s => s.userId.toString() === userId
      );
      
      if (!existingShare) {
        dashboard.sharedWith.push({ userId, permission });
      }
    });
    
    await dashboard.save();
    
    res.status(200).json({
      success: true,
      message: "Dashboard shared successfully",
      data: dashboard
    });
  } catch (error) {
    console.error("Dashboard Share Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to share dashboard",
      error: error.message
    });
  }
};

module.exports = exports;
