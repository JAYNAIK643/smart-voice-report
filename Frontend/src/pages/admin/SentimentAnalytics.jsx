import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smile, 
  Frown, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  RefreshCw,
  Loader2,
  Calendar,
  Filter,
  AlertTriangle
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
 * Admin Sentiment Analytics Dashboard
 * Comprehensive view of sentiment analysis across complaints
 */

const SentimentAnalytics = () => {
  const [data, setData] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    positivePercentage: 0,
    negativePercentage: 0,
    neutralPercentage: 0,
    averageScore: 0,
    averageMagnitude: 0
  });
  const [trends, setTrends] = useState({
    trends: [],
    summary: {
      totalPeriods: 0,
      overallAverageScore: 0,
      totalComplaints: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    priority: '',
    ward: ''
  });
  // Fetch data function - using async/await for clarity
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("authToken");
      console.log('Token present:', !!token);
      
      if (!token) {
        setError("Please login to view sentiment analytics");
        return;
      }
      
      // Fetch stats
      const statsRes = await fetch(`http://localhost:3000/api/sentiment/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Stats status:', statsRes.status);
      const statsData = await statsRes.json();
      console.log('Stats data:', statsData);
      
      // Fetch trends  
      const trendsRes = await fetch(`http://localhost:3000/api/sentiment/trends?days=30&interval=day`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Trends status:', trendsRes.status);
      const trendsData = await trendsRes.json();
      console.log('Trends data:', trendsData);
      
      // Set data - handle both success and partial success
      if (statsData.data) {
        setData(statsData.data);
      }
      if (trendsData.data) {
        setTrends(trendsData.data);
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || "Failed to load data");
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };
  
  // Fetch data on mount
  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const COLORS = {
    positive: "#10b981",
    negative: "#ef4444",
    neutral: "#6b7280",
    primary: "#3b82f6",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    cyan: "#06b6d4"
  };

  const sentimentData = data ? [
    { name: "Positive", value: data.positive || 0, color: COLORS.positive },
    { name: "Negative", value: data.negative || 0, color: COLORS.negative },
    { name: "Neutral", value: data.neutral || 0, color: COLORS.neutral }
  ] : [];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading sentiment analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error with data if we have data, or without data
  if (error && !data.total && !data.positive && !data.negative && !data.neutral) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={fetchAnalyticsData} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smile className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Sentiment Analytics</h1>
              <p className="text-muted-foreground">Real-time emotional intelligence for citizen feedback</p>
            </div>
          </div>
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">All Categories</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Road Maintenance">Road Maintenance</option>
                <option value="Garbage Collection">Garbage Collection</option>
                <option value="Street Lighting">Street Lighting</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ward</label>
              <select
                value={filters.ward}
                onChange={(e) => handleFilterChange('ward', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">All Wards</option>
                <option value="Ward 1">Ward 1</option>
                <option value="Ward 2">Ward 2</option>
                <option value="Ward 3">Ward 3</option>
                <option value="Ward 4">Ward 4</option>
                <option value="Ward 5">Ward 5</option>
              </select>
            </div>
          </div>
          <Button 
            onClick={fetchAnalyticsData} 
            className="mt-4 w-full md:w-auto"
            disabled={loading}
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
                <p className="text-3xl font-bold">{data?.total || 0}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive Sentiment</p>
                <p className="text-3xl font-bold text-green-600">{data?.positivePercentage || 0}%</p>
              </div>
              <Smile className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negative Sentiment</p>
                <p className="text-3xl font-bold text-red-600">{data?.negativePercentage || 0}%</p>
              </div>
              <Frown className="w-12 h-12 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
                <p className={`text-3xl font-bold ${data?.averageScore > 0 ? 'text-green-600' : data?.averageScore < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {data?.averageScore > 0 ? '+' : ''}{data?.averageScore?.toFixed(3) || 0}
                </p>
              </div>
              <Minus className="w-12 h-12 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
                <CardDescription>Breakdown of sentiment categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment by Category</CardTitle>
                <CardDescription>Average sentiment scores by service category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { category: "Water Supply", positive: 45, negative: 20, neutral: 35 },
                      { category: "Roads", positive: 30, negative: 50, neutral: 20 },
                      { category: "Garbage", positive: 25, negative: 60, neutral: 15 },
                      { category: "Lighting", positive: 40, negative: 25, neutral: 35 },
                      { category: "Parks", positive: 50, negative: 15, neutral: 35 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" fill={COLORS.positive} name="Positive" />
                    <Bar dataKey="negative" fill={COLORS.negative} name="Negative" />
                    <Bar dataKey="neutral" fill={COLORS.neutral} name="Neutral" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trends</CardTitle>
              <CardDescription>How sentiment changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trends?.trends || []}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="averageScore" 
                    stroke={COLORS.primary} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    name="Average Sentiment Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Positive Sentiment Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="positivePercentage" stroke={COLORS.positive} name="Positive %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Negative Sentiment Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="negativePercentage" stroke={COLORS.negative} name="Negative %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Breakdown by Priority</CardTitle>
              <CardDescription>How sentiment varies by complaint priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { priority: "High", positive: 15, negative: 70, neutral: 15 },
                    { priority: "Medium", positive: 35, negative: 45, neutral: 20 },
                    { priority: "Low", positive: 50, negative: 25, neutral: 25 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" fill={COLORS.positive} name="Positive" />
                  <Bar dataKey="negative" fill={COLORS.negative} name="Negative" />
                  <Bar dataKey="neutral" fill={COLORS.neutral} name="Neutral" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Ward</CardTitle>
              <CardDescription>Average sentiment scores by ward</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { ward: "Ward 1", score: 0.2 },
                    { ward: "Ward 2", score: -0.1 },
                    { ward: "Ward 3", score: 0.1 },
                    { ward: "Ward 4", score: -0.3 },
                    { ward: "Ward 5", score: 0.4 }
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis domain={[-1, 1]} />
                  <YAxis dataKey="ward" type="category" />
                  <Tooltip />
                  <Bar dataKey="score" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotional Intelligence Insights</CardTitle>
              <CardDescription>AI-generated insights from sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Service Improvement Opportunity</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Road maintenance complaints show consistently negative sentiment. 
                        Consider proactive communication about repair schedules.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <Smile className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Positive Trend Identified</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Water supply complaints show improving sentiment over the last month. 
                        Continue current improvement initiatives.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Attention Required</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        High emotional intensity detected in garbage collection complaints. 
                        Prioritize response and consider escalation protocols.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-900">Pattern Recognition</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Sentiment tends to improve after 48-hour response time. 
                        Maintain current response SLA targets for optimal satisfaction.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actionable recommendations based on sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Enhanced Communication Protocol</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Implement proactive updates for complaints with negative sentiment
                    </p>
                  </div>
                  <Badge variant="secondary">High Impact</Badge>
                </div>
                
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Empathetic Response Templates</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Develop response templates for high-emotional-intensity complaints
                    </p>
                  </div>
                  <Badge variant="secondary">Medium Impact</Badge>
                </div>
                
                <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Staff Training Program</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Train staff on handling emotionally charged complaints effectively
                    </p>
                  </div>
                  <Badge variant="secondary">Long-term</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SentimentAnalytics;
