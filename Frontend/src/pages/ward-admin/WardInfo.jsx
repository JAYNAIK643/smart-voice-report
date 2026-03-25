import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, FileText, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { apiService } from "@/services/apiService";
import { useNavigate } from "react-router-dom";

const WardAdminWardInfo = () => {
  const [wardStats, setWardStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "My Ward Information | SmartCity";
    fetchWardStats();
  }, [user]);

  const fetchWardStats = async () => {
    try {
      setLoading(true);
      // This will use the existing ward complaints API to get statistics
      const response = await apiService.getWardComplaints();
      if (response.success) {
        const complaints = response.data;
        setWardStats({
          totalComplaints: complaints.length,
          resolvedComplaints: complaints.filter(c => c.status === "resolved").length,
          pendingComplaints: complaints.filter(c => c.status === "pending").length,
          inProgressComplaints: complaints.filter(c => c.status === "in-progress").length
        });
      }
    } catch (error) {
      console.error("Error fetching ward stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getResolutionRate = () => {
    if (wardStats.totalComplaints === 0) return 0;
    return Math.round((wardStats.resolvedComplaints / wardStats.totalComplaints) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ward information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Ward Information</h1>
        <p className="text-gray-300 mt-1">
          View statistics and information about your assigned ward: {user?.ward}
        </p>
      </div>

      {/* Ward Overview Card */}
      <Card className="border border-gray-200 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MapPin className="h-5 w-5 text-green-400" />
            Ward Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Ward Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Assigned Ward:</span>
                  <span className="font-medium text-white">{user?.ward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Role:</span>
                  <Badge className="bg-green-100 text-green-800">Ward Administrator</Badge>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Resolution Rate:</span>
                  <span className="font-medium text-green-400">{getResolutionRate()}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Active Complaints:</span>
                  <span className="font-medium text-white">{wardStats.pendingComplaints + wardStats.inProgressComplaints}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Complaints</p>
                <p className="text-2xl font-bold text-white">{wardStats.totalComplaints}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      
        <Card className="border border-gray-200 bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{wardStats.resolvedComplaints}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      
        <Card className="border border-gray-200 bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Pending</p>
                <p className="text-2xl font-bold text-red-400">{wardStats.pendingComplaints}</p>
              </div>
              <FileText className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      
        <Card className="border border-gray-200 bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">{wardStats.inProgressComplaints}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-gray-200 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-green-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/ward-admin/complaints")}
            >
              <FileText className="h-5 w-5" />
              <span>View All Complaints</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/ward-admin/dashboard")}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Ward Dashboard</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => window.location.href = "/"}
            >
              <MapPin className="h-5 w-5" />
              <span>Back to Home</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WardAdminWardInfo;