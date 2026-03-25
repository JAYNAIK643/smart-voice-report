import { useState, useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/auth-context";

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { user, signOut } = useAuth();
  
  const [stats, setStats] = useState([
    { label: "Total Complaints", value: 0, icon: FileText, color: "primary", trend: "+0%" },
    { label: "Resolved Issues", value: 0, icon: CheckCircle, color: "success", trend: "+0%" },
    { label: "Pending Complaints", value: 0, icon: AlertCircle, color: "warning", trend: "-0%" },
    { label: "Avg Response Time", value: "4.2h", icon: Clock, color: "secondary", trend: "-0%" },
  ]);

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

  const [recentComplaints, setRecentComplaints] = useState([]);

  const statsRef = useRef([]);
  const chartsRef = useRef(null);
  const tableRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    document.title = "Admin Dashboard | SmartCity";
      
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { Authorization: `Bearer ${token}` };
        const API_BASE = "http://localhost:3000/api";
  
        // Stats
        const statsRes = await fetch(`${API_BASE}/grievances/admin/stats`, { headers });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats([
            { label: "Total Complaints", value: statsData.data.totalComplaints, icon: FileText, color: "primary", trend: "+12%" },
            { label: "Resolved Issues", value: statsData.data.resolvedComplaints, icon: CheckCircle, color: "success", trend: "+8%" },
            { label: "Pending Complaints", value: statsData.data.pendingComplaints, icon: AlertCircle, color: "warning", trend: "-5%" },
            { label: "Avg Response Time", value: "4.2h", icon: Clock, color: "secondary", trend: "-15%" },
          ]);
        }
  
        // Analytics
        const analyticsRes = await fetch(`${API_BASE}/grievances/admin/ward-stats`, { headers });
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success) {
          setWardData(analyticsData.data.wardData);
            
          // Category Mapping
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
            groupedTypes[standardCategory] += item.count;
          });
            
          setIssueTypeData([
            { name: "Water Supply", value: groupedTypes["Water Supply"] || 0, color: "hsl(217 91% 60%)" },
            { name: "Road Repair", value: groupedTypes["Road Repair"] || 0, color: "hsl(189 94% 43%)" },
            { name: "Garbage", value: groupedTypes["Garbage"] || 0, color: "hsl(262 83% 58%)" },
            { name: "Street Lights", value: groupedTypes["Street Lights"] || 0, color: "hsl(142 76% 36%)" },
            { name: "Others", value: groupedTypes["Others"] || 0, color: "hsl(38 92% 50%)" },
          ]);
  
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May"];
          const trend = monthNames.map((m, i) => {
            const found = analyticsData.data.resolutionTrend.find(t => t.month === i + 1);
            return {
              month: m,
              resolved: found?.status === "resolved" ? found.count : 0,
              pending: found?.status === "pending" ? found.count : 0
            };
          });
          setResolutionTrend(trend);
        }
  
        // Recent Complaints
        const complaintsRes = await fetch(`${API_BASE}/grievances`, { headers });
        const complaintsData = await complaintsRes.json();
        if (complaintsData.success) {
          setRecentComplaints(complaintsData.data.slice(0, 5).map(c => ({
            id: c.complaintId,
            ward: c.ward || "—",
            issue: c.title,
            status: c.status,
            date: new Date(c.createdAt).toISOString().slice(0, 10),
            priority: c.priority
          })));
        }
          
        // Update last updated time
        setLastUpdated(new Date());
  
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };
  
    fetchData();
  }, []);

  // GSAP animations
  useEffect(() => {
    gsap.fromTo(
      statsRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
    );
    gsap.fromTo(
      chartsRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 1, delay: 0.5, ease: "back.out(1.2)" }
    );
  }, []);

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
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 right-0 left-0 z-40 h-16 bg-card border-b border-border backdrop-blur-lg bg-card/80 shadow-sm">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SmartCity Admin Panel
              </h1>
              <p className="text-xs text-muted-foreground ml-1">Government Operations Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          ref={sidebarRef}
          className="fixed left-0 h-[calc(100vh-4rem)] bg-card border-r border-border overflow-hidden z-30 transition-all duration-500 shadow-sm"
          style={{ width: sidebarOpen ? 280 : 80 }}
        >
          <div className="p-4 space-y-1">
            {[
              { icon: LayoutDashboard, label: "Dashboard", active: true },
              { icon: FileText, label: "Complaints" },
              { icon: Users, label: "Users" },
              { icon: BarChart3, label: "Reports" },
              { icon: MessageSquare, label: "Feedback" },
              { icon: Settings, label: "Settings" },
            ].map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                  item.active 
                    ? "bg-primary/10 text-primary border-l-4 border-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </div>
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <button onClick={signOut} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 md:p-8 transition-all duration-500" style={{ marginLeft: sidebarOpen ? 280 : 80 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
              <p className="text-base text-muted-foreground mt-2">Welcome back, monitor city operations</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <Button variant="outline" size="sm" onClick={() => {
                setLastUpdated(new Date());
                window.location.reload();
              }} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} ref={el => statsRef.current[index] = el} className="relative overflow-hidden border-border/50 bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border rounded-xl p-6 flex flex-col min-h-[160px] shadow-sm hover:shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</p>
                    <div className={`text-5xl font-bold ${index === 0 ? 'text-white' : 'text-foreground'}`}>{stat.value}</div>
                  </div>
                  <div className={`p-4 rounded-lg ${stat.color === 'primary' ? 'bg-primary/10 text-primary' : stat.color === 'success' ? 'bg-success/10 text-success' : stat.color === 'warning' ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-secondary'} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-border/30">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" /> 
                    <span className="text-success">{stat.trend}</span> from last month
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div ref={chartsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-border/50 bg-card shadow-sm rounded-xl p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Complaints by Ward
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={wardData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                    <XAxis dataKey="ward" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }} />
                    <Bar dataKey="complaints" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card shadow-sm rounded-xl p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Issue Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={issueTypeData} cx="50%" cy="50%" labelLine={false} label={({name}) => name} outerRadius={80} fill="#8884d8" dataKey="value">
                      {issueTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm rounded-xl p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Resolution Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={resolutionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }} />
                    <Legend />
                    <Line type="monotone" dataKey="resolved" stroke="hsl(var(--success))" strokeWidth={3} dot={{ fill: "hsl(var(--success))", r: 5 }} />
                    <Line type="monotone" dataKey="pending" stroke="hsl(var(--warning))" strokeWidth={3} dot={{ fill: "hsl(var(--warning))", r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card shadow-sm rounded-xl mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Ward</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Issue</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Priority</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComplaints.map((complaint) => (
                      <tr key={complaint.id} className="border-b border-border/30 hover:bg-accent transition-colors duration-200 cursor-pointer">
                        <td className="py-3 px-4 text-sm font-medium text-foreground">#{complaint.id}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{complaint.ward}</td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate" title="{complaint.issue}">{complaint.issue}</td>
                        <td className="py-3 px-4"><Badge variant="outline" className={`${getStatusColor(complaint.status)} text-xs capitalize`}>{complaint.status}</Badge></td>
                        <td className="py-3 px-4"><Badge className={`${getPriorityColor(complaint.priority)} text-xs capitalize`}>{complaint.priority}</Badge></td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{complaint.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Admin;
