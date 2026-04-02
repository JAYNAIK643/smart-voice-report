import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, AlertCircle, Save, RefreshCw, MapPin, Image as ImageIcon, ExternalLink, Video } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

const WardAdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Ward Complaints | SmartCity";
    fetchWardComplaints();
  }, [user]);

  const fetchWardComplaints = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWardComplaints();
      if (response.success) {
        setComplaints(response.data);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch complaints. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (complaintId, newStatus) => {
    setComplaints(complaints.map(c => 
      c.complaintId === complaintId ? { ...c, status: newStatus } : c
    ));
  };

  const handlePriorityChange = (complaintId, newPriority) => {
    setComplaints(complaints.map(c => 
      c.complaintId === complaintId ? { ...c, priority: newPriority } : c
    ));
  };

  const handleUpdate = async (complaint) => {
    try {
      setUpdatingIds(prev => new Set(prev).add(complaint.complaintId));
      
      const response = await apiService.updateGrievanceStatus(
        complaint.complaintId,
        complaint.status,
        complaint.priority
      );

      if (response.success) {
        toast({
          title: "Success!",
          description: `Complaint ${complaint.complaintId} updated successfully.${complaint.status === 'resolved' ? ' Email notification sent to the user.' : ''}`,
        });
        
        // Refresh complaints list to get updated data
        await fetchWardComplaints();
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update complaint. Please try again.",
      });
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(complaint.complaintId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in-progress": return <Clock className="h-5 w-5 text-blue-600" />;
      case "pending": return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Centered Container with Max Width */}
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        
        {/* Header Section - Centered */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ward Complaints Management</h1>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <p className="text-gray-600">
                  Managing complaints for: <span className="font-semibold text-green-600">{user?.ward}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchWardComplaints}
                variant="outline"
                className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Summary - Compact */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-700">
                {complaints.filter(c => c.status === "pending").length}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-700">
                {complaints.filter(c => c.status === "in-progress").length}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-700">
                {complaints.filter(c => c.status === "resolved").length}
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filter by Status</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === "all"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All ({complaints.length})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === "pending"
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                }`}
              >
                Pending ({complaints.filter(c => c.status === "pending").length})
              </button>
              <button
                onClick={() => setStatusFilter("in-progress")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === "in-progress"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                }`}
              >
                In Progress ({complaints.filter(c => c.status === "in-progress").length})
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  statusFilter === "resolved"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                }`}
              >
                Resolved ({complaints.filter(c => c.status === "resolved").length})
              </button>
            </div>
          </div>
        </div>

        {/* Complaints List - Each Card Centered */}
        {(() => {
          const filteredComplaints = statusFilter === "all" 
            ? complaints 
            : complaints.filter(c => c.status === statusFilter);
          
          return filteredComplaints.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === "all" ? "No Complaints Found" : `No ${statusFilter.replace('-', ' ')} Complaints`}
            </h3>
            <p className="text-gray-500">
              {statusFilter === "all" 
                ? `No complaints have been reported for ${user?.ward} yet.`
                : `No complaints with "${statusFilter.replace('-', ' ')}" status found.`}
            </p>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                View All Complaints
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.complaintId} className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
                
                {/* Card Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(complaint.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3">
                          {complaint.title}
                        </h2>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-mono text-gray-700 bg-white border border-gray-300 px-3 py-1 rounded-lg shadow-sm">
                            {complaint.complaintId}
                          </span>
                          <Badge className={`${getPriorityColor(complaint.priority)} border font-semibold px-3 py-1`}>
                            {complaint.priority?.toUpperCase()} PRIORITY
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(complaint.status)} border text-sm font-bold px-4 py-1.5 shadow-sm flex-shrink-0`}>
                      {complaint.status?.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="px-8 py-6 space-y-6">
                  
                  {/* Description */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Description</p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-gray-800 leading-relaxed">{complaint.description}</p>
                    </div>
                  </div>

                  {/* Complaint Image Section - Only show if image exists */}
                  {complaint.imageUrl && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Complaint Image
                      </p>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {complaint.latitude && complaint.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group cursor-pointer"
                            title="Click to view location on Google Maps"
                          >
                            <div className="relative inline-block">
                              <img
                                src={complaint.imageUrl}
                                alt="Complaint image"
                                className="max-h-[200px] w-auto rounded-lg border border-gray-300 shadow-sm object-contain group-hover:shadow-lg group-hover:border-green-400 transition-all duration-200"
                              />
                              <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                                <MapPin className="h-3 w-3" />
                                <span>View on Map</span>
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-green-600" />
                              GPS: {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                            </p>
                          </a>
                        ) : (
                          <div>
                            <img
                              src={complaint.imageUrl}
                              alt="Complaint image"
                              className="max-h-[200px] w-auto rounded-lg border border-gray-300 shadow-sm object-contain"
                            />
                            <p className="text-xs text-gray-400 mt-2 italic">
                              No GPS coordinates available for this complaint
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Complaint Video Section - Only show if video exists */}
                  {complaint.videoUrl && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Complaint Video
                      </p>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {complaint.latitude && complaint.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group cursor-pointer"
                            title="Click to view location on Google Maps"
                          >
                            <div className="relative inline-block">
                              <video
                                src={complaint.videoUrl}
                                controls
                                className="max-h-[200px] w-auto rounded-lg border border-gray-300 shadow-sm group-hover:shadow-lg group-hover:border-green-400 transition-all duration-200"
                                preload="metadata"
                              >
                                Your browser does not support the video tag.
                              </video>
                              <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                                <MapPin className="h-3 w-3" />
                                <span>View on Map</span>
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-green-600" />
                              GPS: {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                            </p>
                          </a>
                        ) : (
                          <div>
                            <video
                              src={complaint.videoUrl}
                              controls
                              className="max-h-[200px] w-auto rounded-lg border border-gray-300 shadow-sm"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                            <p className="text-xs text-gray-400 mt-2 italic">
                              No GPS coordinates available for this complaint
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Metadata Row */}
                  <div className="flex items-center gap-8 py-4 border-y border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Category</p>
                        <p className="font-semibold text-gray-900">{complaint.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Submitted</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(complaint.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Save className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Update Complaint
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Status Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint.complaintId, e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 cursor-pointer appearance-none shadow-sm
                                   hover:border-green-400 hover:shadow-md
                                   focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none
                                   transition-all duration-200
                                   [&>option]:bg-white [&>option]:text-gray-900 [&>option]:py-3 [&>option]:px-2
                                   [&>option:hover]:bg-green-50 [&>option:checked]:bg-green-100 [&>option:checked]:font-bold"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23059669'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.5rem'
                          }}
                        >
                          <option value="pending">🔴 Pending</option>
                          <option value="in-progress">🔵 In Progress</option>
                          <option value="resolved">✅ Resolved</option>
                        </select>
                      </div>

                      {/* Priority Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Priority</label>
                        <select
                          value={complaint.priority}
                          onChange={(e) => handlePriorityChange(complaint.complaintId, e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 cursor-pointer appearance-none shadow-sm
                                   hover:border-green-400 hover:shadow-md
                                   focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none
                                   transition-all duration-200
                                   [&>option]:bg-white [&>option]:text-gray-900 [&>option]:py-3 [&>option]:px-2
                                   [&>option:hover]:bg-green-50 [&>option:checked]:bg-green-100 [&>option:checked]:font-bold"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23059669'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.5rem'
                          }}
                        >
                          <option value="low">🟢 Low</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="high">🔴 High</option>
                        </select>
                      </div>

                      {/* Update Button */}
                      <div className="flex items-end">
                        <Button
                          onClick={() => handleUpdate(complaint)}
                          disabled={updatingIds.has(complaint.complaintId)}
                          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingIds.has(complaint.complaintId) ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Update</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        );
        })()}
      </div>
    </div>
  );
};

export default WardAdminComplaints;