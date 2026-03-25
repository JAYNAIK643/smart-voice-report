import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  MessageSquare,
  Target,
  RefreshCw,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const KPITracker = () => {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [compareEnabled, setCompareEnabled] = useState(true);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchKPIs();
  }, [timeRange, compareEnabled]);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        compareWithPrevious: compareEnabled.toString(),
      });

      console.log('Fetching KPIs from:', `http://localhost:3000/api/advanced-analytics/kpis?${params}`);

      const response = await fetch(`http://localhost:3000/api/advanced-analytics/kpis?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('KPI Response status:', response.status);
      
      const data = await response.json();
      console.log('KPI Response data:', data);
      
      if (data.success) {
        setKpiData(data);
      } else {
        console.error('KPI API error:', data.message);
        toast({
          title: "Error",
          description: data.message || "Failed to load KPI data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      toast({
        title: "Error",
        description: "Failed to load KPI data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getKPIIcon = (kpiKey) => {
    const icons = {
      totalResolutionRate: CheckCircle,
      avgResolutionTime: Clock,
      firstResponseTime: MessageSquare,
      complaintVolume: Target,
      complaintGrowthRate: TrendingUp,
      citizenSatisfaction: Users,
      reopenRate: AlertTriangle,
      staffProductivity: Users,
      slaCompliance: CheckCircle,
    };
    return icons[kpiKey] || Target;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-100 dark:bg-green-900";
      case "good":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900";
      case "warning":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900";
      case "critical":
        return "text-red-600 bg-red-100 dark:bg-red-900";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900";
    }
  };

  const renderKPICard = (kpiKey, kpi) => {
    const Icon = getKPIIcon(kpiKey);
    const trend = kpi.trend || {};
    const trendDirection = trend.direction === "up" ? TrendingUp : TrendingDown;
    const trendColor = trend.isPositive ? "text-green-600" : "text-red-600";

    return (
      <motion.div
        key={kpiKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
              </div>
              <Badge className={getStatusColor(kpi.status)} variant="secondary">
                {kpi.status}
              </Badge>
            </div>
            <CardDescription className="text-xs">{kpi.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {kpi.value.toFixed(kpi.unit === "%" ? 1 : 0)}
                    <span className="text-lg text-gray-500 ml-1">{kpi.unit}</span>
                  </div>
                  {trend.change !== undefined && (
                    <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                      {trendDirection === TrendingUp ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-semibold">{Math.abs(trend.change).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Target</div>
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {kpi.target}
                    {kpi.unit}
                  </div>
                </div>
              </div>

              {kpi.target && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Progress to Target</span>
                    <span>
                      {((kpi.value / kpi.target) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        kpi.status === "excellent" || kpi.status === "good"
                          ? "bg-green-600"
                          : kpi.status === "warning"
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      }`}
                      style={{
                        width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {trend.previousValue !== undefined && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Previous: {trend.previousValue.toFixed(kpi.unit === "%" ? 1 : 0)}
                  {kpi.unit}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KPI Tracker
          </h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading KPI data...</p>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
        <p className="text-gray-600">Failed to load KPI data</p>
        <Button onClick={fetchKPIs} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KPI Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor key performance indicators in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchKPIs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {kpiData.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overall Performance</p>
                  <p className="text-2xl font-bold">{kpiData.summary.overallScore?.toFixed(0)}%</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">KPIs on Target</p>
                  <p className="text-2xl font-bold text-green-600">{kpiData.summary.onTarget || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Needs Attention</p>
                  <p className="text-2xl font-bold text-yellow-600">{kpiData.summary.needsAttention || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{kpiData.summary.critical || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiData.kpis &&
          Object.entries(kpiData.kpis).map(([kpiKey, kpi]) => renderKPICard(kpiKey, kpi))}
      </div>

      {/* Period Information */}
      {kpiData.period && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Start Date</p>
                <p className="font-semibold">{new Date(kpiData.period.start).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">End Date</p>
                <p className="font-semibold">{new Date(kpiData.period.end).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Days Analyzed</p>
                <p className="font-semibold">{kpiData.period.days}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Comparison</p>
                <p className="font-semibold">{compareEnabled ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KPITracker;
