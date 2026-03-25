import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, RefreshCw, Share2, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

const DashboardRenderer = ({ dashboard, onBack, onEdit }) => {
  const [widgetData, setWidgetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAllWidgetData();
  }, [dashboard]);

  const fetchAllWidgetData = async () => {
    setLoading(true);
    const dataPromises = dashboard.widgets.map((widget) => fetchWidgetData(widget));
    await Promise.all(dataPromises);
    setLoading(false);
  };

  const fetchWidgetData = async (widget) => {
    try {
      const response = await fetch("http://localhost:3000/api/advanced-analytics/widgets/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ widget }),
      });
      const data = await response.json();
      if (data.success) {
        setWidgetData((prev) => ({
          ...prev,
          [widget.id]: data.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching widget data:", error);
      toast({
        title: "Error",
        description: `Failed to load widget: ${widget.title}`,
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllWidgetData();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Dashboard data refreshed",
    });
  };

  const renderWidget = (widget) => {
    const data = widgetData[widget.id];
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (widget.type) {
      case "kpi-card":
        return renderKPICard(widget, data);
      case "line-chart":
        return renderLineChart(widget, data);
      case "bar-chart":
        return renderBarChart(widget, data);
      case "pie-chart":
        return renderPieChart(widget, data);
      case "area-chart":
        return renderAreaChart(widget, data);
      case "gauge":
        return renderGauge(widget, data);
      case "table":
        return renderTable(widget, data);
      default:
        return <div className="text-center text-gray-500">Widget type not supported yet</div>;
    }
  };

  const renderKPICard = (widget, data) => {
    const value = data.value || 0;
    const change = data.change || 0;
    const trend = change >= 0 ? "up" : "down";

    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 mt-2 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            <span className="text-lg font-semibold">
              {trend === "up" ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">vs previous period</span>
          </div>
        )}
        <div className="text-sm text-gray-500 mt-1">{data.label || widget.metrics[0]?.label}</div>
      </div>
    );
  };

  const renderLineChart = (widget, data) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.chartData || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {widget.metrics.map((metric, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={metric.label || metric.field}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderBarChart = (widget, data) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.chartData || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {widget.metrics.map((metric, index) => (
            <Bar
              key={index}
              dataKey={metric.label || metric.field}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = (widget, data) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.chartData || []}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {(data.chartData || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = (widget, data) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.chartData || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {widget.metrics.map((metric, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={metric.label || metric.field}
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.3}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderGauge = (widget, data) => {
    const value = data.value || 0;
    const max = data.max || 100;
    const percentage = (value / max) * 100;

    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#3b82f6"
              strokeWidth="16"
              fill="transparent"
              strokeDasharray={`${(percentage * 502.4) / 100} 502.4`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold">{value.toFixed(1)}</span>
            <span className="text-sm text-gray-500">of {max}</span>
          </div>
        </div>
        <div className="text-center mt-4">
          <div className="text-lg font-semibold">{percentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">{data.label || widget.metrics[0]?.label}</div>
        </div>
      </div>
    );
  };

  const renderTable = (widget, data) => {
    const tableData = data.chartData || [];
    if (tableData.length === 0) {
      return <div className="text-center text-gray-500 p-4">No data available</div>;
    }

    const columns = Object.keys(tableData[0]);

    return (
      <div className="overflow-auto h-full">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getGridColumnClass = (width) => {
    return `col-span-${Math.min(width, 12)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {dashboard.name}
              </h1>
              {dashboard.isPublic && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{dashboard.description}</p>
            <div className="flex gap-2 mt-2">
              {dashboard.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <div className={`grid grid-cols-12 gap-4 auto-rows-[minmax(200px,auto)]`}>
          {dashboard.widgets.map((widget) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`col-span-${widget.layout.w} row-span-${widget.layout.h}`}
              style={{
                gridColumn: `span ${widget.layout.w}`,
                gridRow: `span ${widget.layout.h}`,
              }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{widget.title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-60px)]">
                  {renderWidget(widget)}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardRenderer;
