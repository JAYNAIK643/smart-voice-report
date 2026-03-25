import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layout, BarChart3, TrendingUp, Eye, Edit, Trash2, Share2, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import DashboardBuilder from "@/components/analytics-advanced/DashboardBuilder";
import DashboardRenderer from "@/components/analytics-advanced/DashboardRenderer";

const CustomDashboards = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/advanced-analytics/dashboards", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setDashboards(data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedDashboard(null);
    setShowBuilder(true);
  };

  const handleEdit = (dashboard) => {
    setSelectedDashboard(dashboard);
    setShowBuilder(true);
  };

  const handleView = (dashboard) => {
    setSelectedDashboard(dashboard);
    setShowBuilder(false);
  };

  const handleDelete = async (dashboardId) => {
    if (!confirm("Are you sure you want to delete this dashboard?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/advanced-analytics/dashboards/${dashboardId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Dashboard deleted successfully",
        });
        fetchDashboards();
      }
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (dashboardData) => {
    try {
      const url = selectedDashboard
        ? `http://localhost:3000/api/advanced-analytics/dashboards/${selectedDashboard._id}`
        : "http://localhost:3000/api/advanced-analytics/dashboards";
      const method = selectedDashboard ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dashboardData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Dashboard ${selectedDashboard ? "updated" : "created"} successfully`,
        });
        setShowBuilder(false);
        setSelectedDashboard(null);
        fetchDashboards();
      }
    } catch (error) {
      console.error("Error saving dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to save dashboard",
        variant: "destructive",
      });
    }
  };

  if (showBuilder) {
    return (
      <DashboardBuilder
        dashboard={selectedDashboard}
        onSave={handleSave}
        onCancel={() => {
          setShowBuilder(false);
          setSelectedDashboard(null);
        }}
      />
    );
  }

  if (selectedDashboard && !showBuilder) {
    return (
      <DashboardRenderer
        dashboard={selectedDashboard}
        onBack={() => setSelectedDashboard(null)}
        onEdit={() => handleEdit(selectedDashboard)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Custom Dashboards
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage personalized analytics dashboards
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
          <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Create Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Dashboards</p>
                <p className="text-2xl font-bold">{dashboards.length}</p>
              </div>
              <Layout className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Public</p>
                <p className="text-2xl font-bold">{dashboards.filter(d => d.isPublic).length}</p>
              </div>
              <Share2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold">
                  {dashboards.reduce((sum, d) => sum + (d.viewCount || 0), 0)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Widgets</p>
                <p className="text-2xl font-bold">
                  {dashboards.reduce((sum, d) => sum + (d.widgets?.length || 0), 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboards Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboards...</p>
        </div>
      ) : dashboards.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Layout className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Dashboards Yet</h3>
            <p className="text-gray-600 mb-4">Create your first custom dashboard to get started</p>
            <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          <AnimatePresence>
            {dashboards.map((dashboard) => (
              <motion.div
                key={dashboard._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader onClick={() => handleView(dashboard)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {dashboard.name}
                          {dashboard.isPublic && (
                            <Badge variant="outline" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">{dashboard.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span>{dashboard.widgets?.length || 0} widgets</span>
                      <span>{dashboard.viewCount || 0} views</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      {dashboard.tags?.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(dashboard);
                        }}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(dashboard);
                        }}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(dashboard._id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CustomDashboards;
