import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Clock, Star, FileText, MapPin, Calendar } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend, Tooltip } from "recharts";
import StarRating from "@/components/StarRating";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import AdvancedAnalytics from "@/components/analytics/AdvancedAnalytics";

const Dashboard = () => {
  const [stats, setStats] = useState([
    { label: "Total Complaints", value: 0, icon: TrendingUp, color: "primary", trend: "+12% this month" },
    { label: "Pending", value: 0, icon: TrendingUp, color: "warning", trend: "+5% this month" },
    { label: "Resolved", value: 0, icon: TrendingUp, color: "success", trend: "+18% this month" },
    { label: "Avg. Rating", value: "—", icon: TrendingUp, color: "secondary", trend: "No ratings yet", isStar: true },
  ]);
  const [complaints, setComplaints] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const statsRef = useRef([]);
  const chartsRef = useRef(null);

  const [wardData, setWardData] = useState([
    { ward: "Ward 1", complaints: 0 },
    { ward: "Ward 2", complaints: 0 },
    { ward: "Ward 3", complaints: 0 },
    { ward: "Ward 4", complaints: 0 },
    { ward: "Ward 5", complaints: 0 },
  ]);

  const [issueTypeData, setIssueTypeData] = useState([
    { name: "Water Supply", value: 0, color: "hsl(217 91% 60%)" },
    { name: "Road Repair", value: 0, color: "hsl(189 94% 43%)" },
    { name: "Garbage", value: 0, color: "hsl(262 83% 58%)" },
    { name: "Street Lights", value: 0, color: "hsl(142 76% 36%)" },
    { name: "Others", value: 0, color: "hsl(38 92% 50%)" },
  ]);

  const [resolutionTrend, setResolutionTrend] = useState([
    { month: "Jan", resolved: 0, pending: 0 },
    { month: "Feb", resolved: 0, pending: 0 },
    { month: "Mar", resolved: 0, pending: 0 },
    { month: "Apr", resolved: 0, pending: 0 },
    { month: "May", resolved: 0, pending: 0 },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const API_BASE = "http://localhost:3000/api";
        const token = localStorage.getItem("authToken");
        const headers = { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        };

        // Fetch stats
        const statsResponse = await fetch(`${API_BASE}/grievances/admin/stats`, { headers });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success && statsData.data) {
            setStats(prev => prev.map(stat => {
              if (stat.label === "Total Complaints") return { ...stat, value: statsData.data.totalComplaints || 0 };
              if (stat.label === "Pending") return { ...stat, value: statsData.data.pendingComplaints || 0 };
              if (stat.label === "Resolved") return { ...stat, value: statsData.data.resolvedComplaints || 0 };
              return stat;
            }));
          }
        }

        // Fetch complaints
        const complaintsResponse = await fetch(`${API_BASE}/grievances`, { headers });
        if (complaintsResponse.ok) {
          const complaintsData = await complaintsResponse.json();
          if (complaintsData.success && Array.isArray(complaintsData.data)) {
            setComplaints(complaintsData.data);
          }
        }

        // Fetch analytics
        const analyticsResponse = await fetch(`${API_BASE}/grievances/admin/ward-stats`, { headers });
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          if (analyticsData.success && analyticsData.data) {
            if (Array.isArray(analyticsData.data.wardData)) {
              setWardData(analyticsData.data.wardData);
            }
            
            if (Array.isArray(analyticsData.data.issueTypeData)) {
              const categoryMap = {
                'Water Supply': 'Water Supply',
                'Road Repair': 'Road Repair', 
                'Garbage': 'Garbage',
                'Street Lights': 'Street Lights',
                'Water Management': 'Water Supply',
                'Road Maintenance': 'Road Repair',
                'Waste Management': 'Garbage',
                'Street Lighting': 'Street Lights'
              };
              
              const groupedTypes = {};
              analyticsData.data.issueTypeData.forEach(item => {
                const standardCategory = categoryMap[item.category] || 'Others';
                if (!groupedTypes[standardCategory]) groupedTypes[standardCategory] = 0;
                groupedTypes[standardCategory] += (item.count || 0);
              });
              
              setIssueTypeData([
                { name: "Water Supply", value: groupedTypes["Water Supply"] || 0, color: "hsl(217 91% 60%)" },
                { name: "Road Repair", value: groupedTypes["Road Repair"] || 0, color: "hsl(189 94% 43%)" },
                { name: "Garbage", value: groupedTypes["Garbage"] || 0, color: "hsl(262 83% 58%)" },
                { name: "Street Lights", value: groupedTypes["Street Lights"] || 0, color: "hsl(142 76% 36%)" },
                { name: "Others", value: groupedTypes["Others"] || 0, color: "hsl(38 92% 50%)" },
              ]);
            }
            
            if (Array.isArray(analyticsData.data.resolutionTrend)) {
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const trendData = {};
              for (let i = 0; i < 5; i++) {
                trendData[monthNames[i]] = { resolved: 0, pending: 0 };
              }
              
              analyticsData.data.resolutionTrend.forEach(item => {
                if ((item.status === "resolved" || item.status === "pending") && item.month) {
                  const monthName = monthNames[item.month - 1];
                  if (trendData[monthName]) {
                    trendData[monthName][item.status] = item.count || 0;
                  }
                }
              });
              
              setResolutionTrend(Object.entries(trendData).map(([month, counts]) => ({
                month,
                resolved: counts.resolved,
                pending: counts.pending
              })));
            }
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/grievances/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setStats(prev => prev.map(stat => {
          if (stat.label === "Total Complaints") return { ...stat, value: data.data.totalComplaints || 0 };
          if (stat.label === "Pending") return { ...stat, value: data.data.pendingComplaints || 0 };
          if (stat.label === "Resolved") return { ...stat, value: data.data.resolvedComplaints || 0 };
          return stat;
        }));
        setLastRefresh(Date.now());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const recentComplaints = useMemo(() => {
    if (!Array.isArray(complaints)) return [];
    return complaints.slice(0, 6).map((c) => ({
      id: c.complaintId || c._id,
      ward: c.ward || "—",
      issue: c.title || "Untitled",
      status: c.status || "pending",
      date: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "—",
      priority: c.priority || "medium",
    }));
  }, [complaints]);

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved": return "bg-success/20 text-success-foreground border-success";
      case "in-progress": return "bg-warning/20 text-warning-foreground border-warning";
      case "pending": return "bg-destructive/20 text-destructive-foreground border-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "low": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      {/* Centered Container with Max Width */}
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600 text-lg">Monitor and manage city grievances in real-time</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
            </div>
            <Button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing} 
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* KPI Cards - Uniform Height & Professional Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = 
              stat.label === "Total Complaints" ? FileText :
              stat.label === "Pending" ? AlertCircle :
              stat.label === "Resolved" ? CheckCircle2 :
              Star;
            
            const colorClasses = 
              stat.label === "Total Complaints" ? "bg-blue-500 text-white" :
              stat.label === "Pending" ? "bg-amber-500 text-white" :
              stat.label === "Resolved" ? "bg-green-500 text-white" :
              "bg-purple-500 text-white";
            
            const bgGradient = 
              stat.label === "Total Complaints" ? "from-blue-50 to-blue-100" :
              stat.label === "Pending" ? "from-amber-50 to-amber-100" :
              stat.label === "Resolved" ? "from-green-50 to-green-100" :
              "from-purple-50 to-purple-100";
            
            return (
              <Card 
                key={index} 
                className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full"
              >
                <div className={`h-2 bg-gradient-to-r ${bgGradient}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                      {stat.label}
                    </CardTitle>
                    <div className={`p-2.5 rounded-lg ${colorClasses} shadow-md`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2 mb-2">
                    {stat.isStar && stat.value !== "—" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-bold text-white">{stat.value}</span>
                        <StarRating rating={Math.round(parseFloat(stat.value))} readonly size="sm" />
                      </div>
                    ) : (
                      <span className="text-4xl font-bold text-white">{stat.value}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{stat.trend}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Charts Section - Clean Cards with Proper Spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ward Chart */}
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Complaints by Ward</CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">Distribution across city wards</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={wardData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="ward" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="complaints" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Issue Type Chart */}
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Issue Type Distribution</CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">Complaints categorized by type</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie 
                    data={issueTypeData} 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    dataKey="value" 
                    label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                  >
                    {issueTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Resolution Trend - Full Width */}
          <Card className="lg:col-span-2 border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Resolution Trend</CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">Monthly resolved vs pending complaints</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={resolutionTrend} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="resolved" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                    name="Resolved"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                    name="Pending"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Complaints - Clean List Cards */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Recent Complaints</CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">Latest submissions from citizens</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-300">
                {recentComplaints.length} Items
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {recentComplaints.length > 0 ? recentComplaints.map((complaint) => {
                const statusColor = 
                  complaint.status === "resolved" ? "bg-green-100 text-green-800 border-green-300" :
                  complaint.status === "in-progress" ? "bg-blue-100 text-blue-800 border-blue-300" :
                  "bg-amber-100 text-amber-800 border-amber-300";
                
                const priorityColor = 
                  complaint.priority === "high" ? "bg-red-500 text-white" :
                  complaint.priority === "medium" ? "bg-amber-500 text-white" :
                  "bg-green-500 text-white";
                
                return (
                  <div 
                    key={complaint.id} 
                    className="flex items-center justify-between p-5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {complaint.issue}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${statusColor} uppercase tracking-wide`}>
                          {complaint.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityColor} uppercase tracking-wide`}>
                          {complaint.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-5 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="font-mono">{complaint.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{complaint.ward}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{complaint.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No complaints found</p>
                  <p className="text-slate-400 text-sm mt-1">Complaints will appear here when submitted</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Advanced Analytics Module - Extension Only */}
        <AdvancedAnalytics />
      </div>
    </div>
  );
};

export default Dashboard;
