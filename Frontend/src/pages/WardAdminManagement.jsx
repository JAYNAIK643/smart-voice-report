import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, MapPin, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WardAdminManagement = () => {
  const [wardAdmins, setWardAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Ward Admin Management | SmartCity";
    
    // Only super admins can access this page
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    
    fetchWardAdmins();
  }, [user, navigate]);

  const fetchWardAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      // Fetch only ward admin users
      const response = await fetch(`http://localhost:3000/api/admin/users?role=ward_admin`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWardAdmins(data.data);
      }
    } catch (error) {
      console.error("Error fetching ward admins:", error);
      toast({ title: "Error", description: "Failed to load ward admins", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (index) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500", 
      "bg-pink-500",
      "bg-green-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  const handleWardClick = (wardName) => {
    navigate(`/admin/complaints?ward=${wardName}`);
  };

  if (user?.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ward admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-40 h-16 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Ward Admin Management</h1>
              <p className="text-xs text-gray-500">Super Admin Panel</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() || "SA"}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ward Administrator Management
              </h2>
              <p className="text-gray-600">
                Manage and oversee all ward administrators in the system
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {wardAdmins.length} Ward Admins
            </Badge>
          </div>

          {/* Ward Admins Grid */}
          {wardAdmins.length === 0 ? (
            <Card className="border border-gray-200">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Ward Admins Found</h3>
                <p className="text-gray-500 mb-6">
                  Ward administrators will appear here once created through the invitation system.
                </p>
                <Button onClick={() => navigate("/admin/users")}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Create Ward Admin
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wardAdmins.map((admin, index) => (
                <Card 
                  key={admin._id} 
                  className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => handleWardClick(admin.ward)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-semibold`}>
                        {admin.name?.slice(0, 2).toUpperCase() || "WA"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                          {admin.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Ward Admin
                          </Badge>
                          <Badge variant="outline" className="border-green-200 text-green-700">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{admin.ward}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Account Created:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WardAdminManagement;