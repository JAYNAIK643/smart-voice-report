const mongoose = require("mongoose");

/**
 * Custom Dashboard Model
 * Stores user-created custom dashboards with widget configurations
 * Zero-Regression Strategy: New model, extends existing analytics
 */

const widgetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      "kpi-card",
      "line-chart",
      "bar-chart",
      "pie-chart",
      "area-chart",
      "heatmap",
      "table",
      "gauge",
      "funnel",
      "scatter",
      "map"
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  dataSource: {
    type: String,
    enum: [
      "complaints",
      "users",
      "feedback",
      "sentiment",
      "sla",
      "predictive",
      "custom"
    ],
    required: true
  },
  metrics: [{
    field: String,
    aggregation: {
      type: String,
      enum: ["count", "sum", "avg", "min", "max", "distinct"]
    },
    label: String
  }],
  filters: {
    category: String,
    priority: String,
    status: String,
    ward: String,
    dateRange: {
      start: Date,
      end: Date
    },
    customFilters: mongoose.Schema.Types.Mixed
  },
  dimensions: [{
    field: String,
    label: String
  }],
  layout: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 4 },
    h: { type: Number, default: 3 }
  },
  config: {
    colors: [String],
    showLegend: { type: Boolean, default: true },
    showGrid: { type: Boolean, default: true },
    showTooltip: { type: Boolean, default: true },
    refreshInterval: Number, // in seconds
    customSettings: mongoose.Schema.Types.Mixed
  }
});

const customDashboardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      enum: ["executive", "operational", "analytical", "custom"],
      default: "custom"
    },
    widgets: [widgetSchema],
    layout: {
      type: String,
      enum: ["grid", "freeform", "tabs"],
      default: "grid"
    },
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "light"
    },
    refreshRate: {
      type: Number, // in seconds
      default: 300 // 5 minutes
    },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      permission: {
        type: String,
        enum: ["view", "edit"],
        default: "view"
      }
    }],
    tags: [String],
    viewCount: {
      type: Number,
      default: 0
    },
    lastViewed: Date
  },
  { timestamps: true }
);

// Indexes for performance
customDashboardSchema.index({ userId: 1 });
customDashboardSchema.index({ isPublic: 1 });
customDashboardSchema.index({ category: 1 });
customDashboardSchema.index({ tags: 1 });
customDashboardSchema.index({ createdAt: -1 });

module.exports = mongoose.model("CustomDashboard", customDashboardSchema);
