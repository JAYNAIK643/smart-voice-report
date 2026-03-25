const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const twoFactorAuthRoutes = require("./routes/twoFactorAuthRoutes");
const grievanceRoutes = require("./routes/grievanceRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const wardAdminRoutes = require("./routes/wardAdminRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const advancedAnalyticsRoutes = require("./routes/advancedAnalyticsRoutes");
const engagementRoutes = require("./routes/engagementRoutes");
const aiIntelligenceRoutes = require("./routes/aiIntelligenceRoutes");
const predictiveAnalyticsRoutes = require("./routes/predictiveAnalyticsRoutes");
const sentimentAnalysisRoutes = require("./routes/sentimentAnalysisRoutes");
const advancedReportingRoutes = require("./routes/advancedReportingRoutes");
const enhancedAnalyticsRoutes = require("./routes/enhancedAnalyticsRoutes");
const enhancedAIRoutes = require("./routes/enhancedAIRoutes");
const heatmapRoutes = require("./routes/heatmapRoutes");
const smartRoutingRoutes = require("./routes/smartRoutingRoutes");
const transparencyRoutes = require("./routes/transparencyRoutes");
const aiRoutes = require("./routes/aiRoutes"); // NEW: AI categorization and chatbot
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ✅ DISABLE ETAG TO PREVENT 304 CACHED RESPONSES
app.disable("etag");
app.set("etag", false);

app.use(cors());
app.use(express.json({ limit: '2mb' })); // Increased limit for base64 image uploads (1MB + 33% base64 overhead)
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth/2fa", twoFactorAuthRoutes); // Two-Factor Authentication
app.use("/api/grievances", grievanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ward-admin", wardAdminRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/analytics-advanced", advancedAnalyticsRoutes); // Advanced Analytics Module
app.use("/api/engagement", engagementRoutes); // Advanced Engagement System
app.use("/api/ai", aiIntelligenceRoutes); // AI Intelligence System
app.use("/api/predictive", predictiveAnalyticsRoutes); // Predictive Analytics
app.use("/api/ai/sentiment", sentimentAnalysisRoutes); // Sentiment Analysis
// Duplicate mount at /api/sentiment for frontend compatibility
app.use("/api/sentiment", sentimentAnalysisRoutes); // Sentiment Analysis (legacy)
app.use("/api/advanced-analytics", advancedReportingRoutes); // Advanced Analytics & Reporting
app.use("/api/analytics", enhancedAnalyticsRoutes); // Enhanced Analytics Dashboard
app.use("/api/enhanced-ai", enhancedAIRoutes); // Enhanced AI (Phase 1: Multi-language NLP)
app.use("/api/heatmap", heatmapRoutes); // Heatmap & SLA Analytics (Phase 2)
app.use("/api/routing", smartRoutingRoutes); // Smart Routing (Phase 3)
app.use("/api/transparency", transparencyRoutes); // Public Transparency (Phase 4)
app.use("/api/ai", aiRoutes); // NEW: AI categorization and chatbot (replaces Supabase functions)

app.use(notFound);
app.use(errorHandler);

module.exports = app;
