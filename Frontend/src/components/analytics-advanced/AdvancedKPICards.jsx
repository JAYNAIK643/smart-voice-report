import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Zap, Clock, Target } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Advanced KPI Cards Component
 * NEW component for enhanced metrics visualization
 * Zero-Regression Strategy: Extension-only
 */

const AdvancedKPICards = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAdvancedMetrics = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/api/analytics-advanced/advanced-metrics", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.success && data.data) {
          setMetrics(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Advanced metrics error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvancedMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-2 border-slate-200 animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return null; // Fail silently
  }

  const kpiData = [
    {
      label: "Complaint Growth Rate",
      value: `${metrics.complaintGrowthRate >= 0 ? '+' : ''}${metrics.complaintGrowthRate}%`,
      trend: metrics.complaintGrowthRate >= 0 ? "up" : "down",
      icon: Activity,
      color: "blue",
      description: "vs previous 30 days"
    },
    {
      label: "Resolution Efficiency",
      value: `${metrics.resolutionEfficiencyIndex}%`,
      trend: metrics.efficiencyChange >= 0 ? "up" : "down",
      change: `${metrics.efficiencyChange >= 0 ? '+' : ''}${metrics.efficiencyChange}%`,
      icon: Target,
      color: "green",
      description: "complaints resolved"
    },
    {
      label: "Avg Resolution Time",
      value: `${metrics.avgResolutionHours.toFixed(1)}h`,
      trend: metrics.timeImprovement >= 0 ? "up" : "down",
      change: `${metrics.timeImprovement >= 0 ? '+' : ''}${metrics.timeImprovement}%`,
      icon: Clock,
      color: "purple",
      description: "faster resolution"
    },
    {
      label: "Active Complaints",
      value: metrics.currentPeriod.pending,
      trend: "neutral",
      icon: Zap,
      color: "amber",
      description: `${metrics.currentPeriod.total} total this month`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : Activity;
        
        const colorClasses = {
          blue: { bg: "bg-blue-500", gradient: "from-blue-50 to-blue-100", text: "text-blue-700" },
          green: { bg: "bg-green-500", gradient: "from-green-50 to-green-100", text: "text-green-700" },
          purple: { bg: "bg-purple-500", gradient: "from-purple-50 to-purple-100", text: "text-purple-700" },
          amber: { bg: "bg-amber-500", gradient: "from-amber-50 to-amber-100", text: "text-amber-700" }
        }[kpi.color];

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${colorClasses.gradient}`} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    {kpi.label}
                  </CardTitle>
                  <div className={`p-2.5 rounded-lg ${colorClasses.bg} text-white shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-end gap-2 mb-2">
                  <span className={`text-4xl font-bold ${colorClasses.text}`}>
                    {kpi.value}
                  </span>
                  {kpi.change && (
                    <div className="flex items-center gap-1 mb-2">
                      <TrendIcon className={`h-4 w-4 ${
                        kpi.trend === "up" ? "text-green-600" : "text-red-600"
                      }`} />
                      <span className={`text-sm font-semibold ${
                        kpi.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}>
                        {kpi.change}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">{kpi.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AdvancedKPICards;
