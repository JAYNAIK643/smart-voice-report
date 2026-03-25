import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Brain,
  RefreshCw,
  Loader2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { motion } from "framer-motion";

/**
 * Predictive Analytics Dashboard
 * Displays trend forecasting, SLA compliance, and hotspot identification
 */

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4"
};

const PredictiveAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/predictive/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        setError(result.message || "Failed to load dashboard");
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const { forecast, slaCompliance, hotspots } = data || {};

  // Prepare chart data for forecast
  const forecastChartData = forecast?.historical?.labels?.map((label, index) => ({
    month: label,
    actual: forecast.historical.totalCounts[index],
    type: "historical"
  })) || [];

  forecast?.forecast?.labels?.forEach((label, index) => {
    forecastChartData.push({
      month: label,
      predicted: forecast.forecast.predictions[index],
      type: "forecast"
    });
  });

  // Prepare SLA compliance data
  const slaChartData = slaCompliance?.byPriority ? [
    { priority: "High", compliance: slaCompliance.byPriority.high?.complianceRate || 0, target: 80 },
    { priority: "Medium", compliance: slaCompliance.byPriority.medium?.complianceRate || 0, target: 85 },
    { priority: "Low", compliance: slaCompliance.byPriority.low?.complianceRate || 0, target: 90 }
  ] : [];

  // Prepare hotspots data for chart
  const hotspotChartData = hotspots?.hotspots?.slice(0, 5).map(h => ({
    ward: h.ward,
    score: h.hotspotScore,
    complaints: h.totalComplaints
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-3xl font-bold">Predictive Analytics</h2>
            <p className="text-muted-foreground">AI-powered insights and forecasting</p>
          </div>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forecast">Trend Forecast</TabsTrigger>
          <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
          <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
        </TabsList>

        {/* Trend Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trend Direction */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trend Direction</p>
                    <p className="text-2xl font-bold capitalize">{forecast?.trend?.direction || "Unknown"}</p>
                  </div>
                  {forecast?.trend?.direction === "increasing" ? (
                    <TrendingUp className="w-8 h-8 text-red-500" />
                  ) : forecast?.trend?.direction === "decreasing" ? (
                    <TrendingDown className="w-8 h-8 text-green-500" />
                  ) : (
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {forecast?.trend?.percentage > 0 ? "+" : ""}{forecast?.trend?.percentage?.toFixed(1)}% change
                </p>
              </CardContent>
            </Card>

            {/* Next Month Prediction */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Next Month</p>
                    <p className="text-2xl font-bold">{forecast?.forecast?.predictions?.[0] || 0}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Predicted complaints
                </p>
              </CardContent>
            </Card>

            {/* Forecast Confidence */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold">{forecast?.forecast?.confidence || 0}%</p>
                  </div>
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Prediction accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Volume Forecast</CardTitle>
              <CardDescription>Historical data and AI predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecastChartData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke={COLORS.primary} 
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    name="Historical"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke={COLORS.warning} 
                    strokeDasharray="5 5"
                    fillOpacity={1} 
                    fill="url(#colorPredicted)" 
                    name="Forecast"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights */}
          {forecast?.insights && forecast.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {forecast.insights.map((insight, idx) => (
                  <Alert key={idx} variant={insight.type === "warning" || insight.type === "alert" ? "destructive" : "default"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{insight.message}</span>
                      <Badge variant={insight.priority === "high" ? "destructive" : "secondary"}>
                        {insight.priority}
                      </Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SLA Compliance Tab */}
        <TabsContent value="sla" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Compliance */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall SLA</p>
                    <p className="text-2xl font-bold">{slaCompliance?.overall?.complianceRate || 0}%</p>
                  </div>
                  {slaCompliance?.overall?.complianceRate >= 85 ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Target: 85%
                </p>
              </CardContent>
            </Card>

            {/* High Priority */}
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold">{slaCompliance?.byPriority?.high?.complianceRate || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {slaCompliance?.byPriority?.high?.compliant || 0}/{slaCompliance?.byPriority?.high?.total || 0} compliant
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Medium Priority */}
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Medium Priority</p>
                  <p className="text-2xl font-bold">{slaCompliance?.byPriority?.medium?.complianceRate || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {slaCompliance?.byPriority?.medium?.compliant || 0}/{slaCompliance?.byPriority?.medium?.total || 0} compliant
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Low Priority */}
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Low Priority</p>
                  <p className="text-2xl font-bold">{slaCompliance?.byPriority?.low?.complianceRate || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {slaCompliance?.byPriority?.low?.compliant || 0}/{slaCompliance?.byPriority?.low?.total || 0} compliant
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SLA Compliance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance by Priority</CardTitle>
              <CardDescription>Compliance rates vs targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={slaChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="compliance" fill={COLORS.primary} name="Actual" />
                  <Bar dataKey="target" fill={COLORS.success} name="Target" opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SLA Alerts */}
          {slaCompliance?.alerts && slaCompliance.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>SLA Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {slaCompliance.alerts.map((alert, idx) => (
                  <Alert key={idx} variant={alert.severity === "critical" ? "destructive" : "default"}>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground mt-1">{alert.action}</p>
                        </div>
                        <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Hotspots Tab */}
        <TabsContent value="hotspots" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Critical Hotspots */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical Areas</p>
                    <p className="text-2xl font-bold">{hotspots?.criticalCount || 0}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            {/* Most Affected Ward */}
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Top Hotspot</p>
                  <p className="text-2xl font-bold">{hotspots?.summary?.mostAffectedWard || "N/A"}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Score: {hotspots?.summary?.highestScore?.toFixed(1) || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Avg Complaints */}
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Avg per Ward</p>
                  <p className="text-2xl font-bold">{hotspots?.summary?.averageComplaintsPerWard?.toFixed(0) || 0}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Complaints per ward
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hotspot Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ward Hotspot Analysis</CardTitle>
              <CardDescription>Hotspot scores by ward</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hotspotChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="ward" type="category" />
                  <Tooltip />
                  <Bar dataKey="score" fill={COLORS.danger} name="Hotspot Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {hotspots?.recommendations && hotspots.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Action Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hotspots.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{rec.ward}</span>
                          <Badge variant={rec.priority === "critical" || rec.priority === "high" ? "destructive" : "secondary"}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.issue}</p>
                        <p className="text-sm font-medium mt-1">→ {rec.action}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
