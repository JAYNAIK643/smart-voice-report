import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, RefreshCw, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { apiService } from "@/services/apiService";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [metrics, setMetrics] = useState({
    resolutionRate: 0,
    avgResponseTime: "0h",
    totalComplaints: 0,
    resolved: 0,
    pending: 0,
    inProgress: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Reports & Analytics | SmartCity Admin";
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all grievances to compute analytics
      const grievancesResponse = await apiService.getAllGrievances();
      
      if (grievancesResponse.success && grievancesResponse.data) {
        const complaints = grievancesResponse.data;
        
        // Process monthly trends (last 6 months)
        const processedMonthlyData = processMonthlyTrends(complaints);
        setMonthlyData(processedMonthlyData);

        // Process category data
        const processedCategoryData = processCategoryData(complaints);
        setCategoryData(processedCategoryData);

        // Calculate metrics
        const totalComplaints = complaints.length;
        const resolved = complaints.filter(c => c.status === "resolved").length;
        const pending = complaints.filter(c => c.status === "pending").length;
        const inProgress = complaints.filter(c => c.status === "in-progress" || c.status === "in_progress").length;
        
        const resolutionRate = totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;
        
        // Calculate average resolution time
        const resolvedWithTime = complaints.filter(c => 
          c.status === "resolved" && c.resolvedAt && c.createdAt
        );
        let avgHours = 0;
        if (resolvedWithTime.length > 0) {
          const totalHours = resolvedWithTime.reduce((sum, c) => {
            const diff = (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
            return sum + diff;
          }, 0);
          avgHours = Math.round(totalHours / resolvedWithTime.length * 10) / 10;
        }

        setMetrics({
          resolutionRate,
          avgResponseTime: avgHours > 24 ? `${Math.round(avgHours / 24)}d` : `${avgHours}h`,
          totalComplaints,
          resolved,
          pending,
          inProgress
        });
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyTrends = (complaints) => {
    const months = [];
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthComplaints = complaints.filter(c => {
        const created = new Date(c.createdAt);
        return created >= monthDate && created <= monthEnd;
      });

      const total = monthComplaints.length;
      const resolved = monthComplaints.filter(c => c.status === "resolved").length;
      const pending = monthComplaints.filter(c => 
        c.status === "pending" || c.status === "in-progress" || c.status === "in_progress"
      ).length;

      months.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        total,
        resolved,
        pending
      });
    }
    
    return months;
  };

  const processCategoryData = (complaints) => {
    const categoryCount = {};
    
    complaints.forEach(c => {
      const category = c.category || "Other";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // Convert to array and sort by count
    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 categories
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      
      // Fetch all grievances for export
      const response = await apiService.getAllGrievances();
      if (!response.success || !response.data) {
        throw new Error("Failed to fetch data for export");
      }

      const complaints = response.data;
      const now = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });

      // Create CSV content
      let csvContent = "Smart City Grievance Report\n";
      csvContent += `Generated on: ${now}\n\n`;
      
      // Summary Section
      csvContent += "=== SUMMARY ===\n";
      csvContent += `Total Complaints,${metrics.totalComplaints}\n`;
      csvContent += `Resolved,${metrics.resolved}\n`;
      csvContent += `Pending,${metrics.pending}\n`;
      csvContent += `In Progress,${metrics.inProgress}\n`;
      csvContent += `Resolution Rate,${metrics.resolutionRate}%\n`;
      csvContent += `Avg Response Time,${metrics.avgResponseTime}\n\n`;

      // Monthly Trends Section
      csvContent += "=== MONTHLY TRENDS ===\n";
      csvContent += "Month,Total,Resolved,Pending\n";
      monthlyData.forEach(row => {
        csvContent += `${row.month},${row.total},${row.resolved},${row.pending}\n`;
      });
      csvContent += "\n";

      // Category Section
      csvContent += "=== COMPLAINTS BY CATEGORY ===\n";
      csvContent += "Category,Count\n";
      categoryData.forEach(row => {
        csvContent += `${row.category},${row.count}\n`;
      });
      csvContent += "\n";

      // Detailed Complaints List
      csvContent += "=== DETAILED COMPLAINTS LIST ===\n";
      csvContent += "Complaint ID,Title,Category,Ward,Status,Priority,Created Date,Resolved Date\n";
      complaints.forEach(c => {
        const title = (c.title || "").replace(/,/g, " ");
        const resolvedDate = c.resolvedAt ? new Date(c.resolvedAt).toLocaleDateString() : "N/A";
        csvContent += `${c.complaintId || c._id},"${title}",${c.category || "N/A"},${c.ward || "N/A"},${c.status},${c.priority || "N/A"},${new Date(c.createdAt).toLocaleDateString()},${resolvedDate}\n`;
      });

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `SmartCity_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports & Analytics</h1>
          <p className="text-sm text-gray-600">Comprehensive complaint statistics and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monthly Complaint Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Monthly Complaint Trends
        </h2>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" dot={{ fill: '#3b82f6', r: 4 }} />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" dot={{ fill: '#10b981', r: 4 }} />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No data available for the selected period
          </div>
        )}
      </div>

      {/* Complaints by Category */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Complaints by Category
        </h2>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Complaints" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No category data available
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <div className="text-4xl font-bold text-blue-600">{metrics.resolutionRate}%</div>
          </div>
          <div className="text-sm text-blue-900">Resolution Rate</div>
          <div className="text-xs text-blue-700 mt-1">
            {metrics.resolved} of {metrics.totalComplaints} resolved
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-green-600" />
            <div className="text-4xl font-bold text-green-600">{metrics.avgResponseTime}</div>
          </div>
          <div className="text-sm text-green-900">Avg Resolution Time</div>
          <div className="text-xs text-green-700 mt-1">
            Based on {metrics.resolved} resolved complaints
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-purple-600" />
            <div className="text-4xl font-bold text-purple-600">{metrics.totalComplaints}</div>
          </div>
          <div className="text-sm text-purple-900">Total Complaints</div>
          <div className="text-xs text-purple-700 mt-1">
            {metrics.pending} pending, {metrics.inProgress} in progress
          </div>
        </div>
      </div>

      {/* Status Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Status Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{metrics.totalComplaints}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{metrics.pending}</div>
            <div className="text-sm text-orange-800">Pending</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{metrics.inProgress}</div>
            <div className="text-sm text-blue-800">In Progress</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{metrics.resolved}</div>
            <div className="text-sm text-green-800">Resolved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;