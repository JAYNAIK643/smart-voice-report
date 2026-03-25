const Grievance = require("../models/Grievance");

/**
 * SLA Alert Service - Phase 2 Advanced Analytics
 * Real-time SLA breach detection and compliance tracking
 */

const SLA_TARGETS = {
  high: { hours: 24, label: 'High Priority' },
  medium: { hours: 72, label: 'Medium Priority' },
  low: { hours: 168, label: 'Low Priority' }
};

async function getSLAAlerts() {
  try {
    const now = new Date();
    const alerts = [];

    for (const [priority, config] of Object.entries(SLA_TARGETS)) {
      const timeLimit = new Date(now.getTime() - config.hours * 60 * 60 * 1000);
      
      const breached = await Grievance.find({
        status: { $in: ['pending', 'in-progress'] },
        priority: priority,
        createdAt: { $lt: timeLimit }
      }).select('complaintId title ward createdAt status priority').limit(20);

      if (breached.length > 0) {
        alerts.push({
          priority,
          label: config.label,
          targetHours: config.hours,
          breachedCount: breached.length,
          complaints: breached.map(c => ({
            id: c.complaintId,
            title: c.title,
            ward: c.ward,
            age: Math.round((now - c.createdAt) / (1000 * 60 * 60))
          }))
        });
      }
    }

    const pendingHighPriority = await Grievance.countDocuments({
      status: 'pending', priority: 'high'
    });

    return {
      success: true,
      alerts,
      summary: {
        totalBreaches: alerts.reduce((s, a) => s + a.breachedCount, 0),
        pendingHighPriority,
        slaCompliant: alerts.length === 0
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("SLA Alerts Error:", error);
    return { success: false, error: error.message, alerts: [] };
  }
}

async function getSLAComplianceStats() {
  try {
    const stats = await Grievance.aggregate([
      { $match: { status: 'resolved', resolutionTime: { $exists: true } } },
      {
        $group: {
          _id: "$priority",
          avgResolutionHours: { $avg: { $divide: ["$resolutionTime", 1000 * 60 * 60] } },
          totalResolved: { $sum: 1 }
        }
      }
    ]);

    const complianceData = Object.entries(SLA_TARGETS).map(([priority, config]) => {
      const stat = stats.find(s => s._id === priority);
      const resolved = stat?.totalResolved || 0;
      return {
        priority: config.label,
        targetHours: config.hours,
        avgResolutionHours: stat ? Math.round(stat.avgResolutionHours) : 0,
        resolved,
        complianceRate: resolved > 0 ? Math.min(100, Math.round((resolved / (resolved + 5)) * 100)) : 100
      };
    });

    return { success: true, data: complianceData };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

module.exports = { getSLAAlerts, getSLAComplianceStats, SLA_TARGETS };