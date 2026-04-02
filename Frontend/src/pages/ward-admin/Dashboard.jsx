import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend, Tooltip } from "recharts";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import AdvancedAnalytics from "@/components/analytics/AdvancedAnalytics";

// API Configuration for mobile/laptop compatibility
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api`;

const WardAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState([
    { label: "Total Complaints", value: 0, icon: TrendingUp, color: "primary", trend: "+12% this month" },
    { label: "Pending", value: 0, icon: TrendingUp, color: "warning", trend: "+5% this month" },
    { label: "In Progress", value: 0, icon: TrendingUp, color: "info", trend: "+8% this month" },
    { label: "Resolved", value: 0, icon: TrendingUp, color: "success", trend: "+18% this month" },
  ]);
  
  const [complaints, setComplaints] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statsRef = useRef([]);
  const chartsRef = useRef(null);

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
    const fetchWardData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        };

        // Fetch ward complaints
        const complaintsResponse = await fetch(`${API_URL}/ward-admin/complaints`, { headers });
        if (complaintsResponse.ok) {
          const complaintsData = await complaintsResponse.json();
          if (complaintsData.success && Array.isArray(complaintsData.data)) {
            const wardComplaints = complaintsData.data;
            setComplaints(wardComplaints);
            
            // Calculate stats
            const total = wardComplaints.length;
            const pending = wardComplaints.filter(c => c.status === "pending").length;
            const inProgress = wardComplaints.filter(c => c.status === "in-progress").length;
            const resolved = wardComplaints.filter(c => c.status === "resolved").length;
            
            setStats([
              { label: "Total Complaints", value: total, icon: TrendingUp, color: "primary", trend: "+12% this month" },
              { label: "Pending", value: pending, icon: TrendingUp, color: "warning", trend: "+5% this month" },
              { label: "In Progress", value: inProgress, icon: TrendingUp, color: "info", trend: "+8% this month" },
              { label: "Resolved", value: resolved, icon: TrendingUp, color: "success", trend: "+18% this month" },
            ]);
            
            // Calculate issue type distribution
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
            wardComplaints.forEach(complaint => {
              const standardCategory = categoryMap[complaint.category] || 'Others';
              if (!groupedTypes[standardCategory]) groupedTypes[standardCategory] = 0;
              groupedTypes[standardCategory]++;
            });
            
            setIssueTypeData([
              { name: "Water Supply", value: groupedTypes["Water Supply"] || 0, color: "hsl(217 91% 60%)" },
              { name: "Road Repair", value: groupedTypes["Road Repair"] || 0, color: "hsl(189 94% 43%)" },
              { name: "Garbage", value: groupedTypes["Garbage"] || 0, color: "hsl(262 83% 58%)" },
              { name: "Street Lights", value: groupedTypes["Street Lights"] || 0, color: "hsl(142 76% 36%)" },
              { name: "Others", value: groupedTypes["Others"] || 0, color: "hsl(38 92% 50%)" },
            ]);
          }
        }
      } catch (error) {
        console.error("Ward dashboard error:", error);
        toast({
          title: "Error",
          description: "Failed to load ward data",
          variant: "destructive"
        });
      }
    };

    fetchWardData();
  }, [toast]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/ward-admin/complaints", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const wardComplaints = data.data;
        setComplaints(wardComplaints);
        
        const total = wardComplaints.length;
        const pending = wardComplaints.filter(c => c.status === "pending").length;
        const inProgress = wardComplaints.filter(c => c.status === "in-progress").length;
        const resolved = wardComplaints.filter(c => c.status === "resolved").length;
        
        setStats([
          { label: "Total Complaints", value: total, icon: TrendingUp, color: "primary", trend: "+12% this month" },
          { label: "Pending", value: pending, icon: TrendingUp, color: "warning", trend: "+5% this month" },
          { label: "In Progress", value: inProgress, icon: TrendingUp, color: "info", trend: "+8% this month" },
          { label: "Resolved", value: resolved, icon: TrendingUp, color: "success", trend: "+18% this month" },
        ]);
        
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
      ward: c.ward || user?.ward || "—",
      issue: c.title || "Untitled",
      status: c.status || "pending",
      date: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "—",
      priority: c.priority || "medium",
    }));
  }, [complaints, user]);

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
    <div className="dashboard-content w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ward Admin Dashboard</h1>
          <p className="text-gray-300">Manage complaints for {user?.ward || "your ward"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-300">
            Last updated: {new Date(lastRefresh).toLocaleTimeString()}
          </div>
          <Button onClick={handleManualRefresh} disabled={isRefreshing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="border-gray-200 shadow-sm bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 text-green-400`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-xs text-gray-300">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-gray-200 shadow-sm bg-gray-800">
          <CardHeader><CardTitle className="text-white">Issue Type Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={issueTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name}) => name}>
                  {issueTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm bg-gray-800">
          <CardHeader><CardTitle className="text-white">Resolution Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={resolutionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{r: 4}} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm bg-gray-800">
        <CardHeader><CardTitle className="text-white">Recent Complaints in {user?.ward || "Your Ward"}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentComplaints.length > 0 ? recentComplaints.map((complaint) => (
              <div key={complaint.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-700">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-white">{complaint.issue}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>{complaint.status}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>{complaint.priority}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>ID: {complaint.id}</span>
                    <span>Ward: {complaint.ward}</span>
                    <span>{complaint.date}</span>
                  </div>
                </div>
              </div>
            )) : <p className="text-gray-300 text-center py-8">No complaints found in your ward</p>}
          </div>
        </CardContent>
      </Card>
      
      {/* Advanced Analytics Module - Extension Only */}
      <AdvancedAnalytics />
    </div>
  );
};

export default WardAdminDashboard;
