import { useEffect, useMemo, useState } from "react";
import { Search, Filter, MoreVertical, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useComplaints } from "@/context/complaints-context";

const Complaints = () => {
  const { complaints, updateComplaint, updateGrievanceStatus } = useComplaints();
  const location = useLocation();
  const navigate = useNavigate();

  // Get ward filter from query param
  const queryParams = new URLSearchParams(location.search);
  const wardParam = queryParams.get("ward");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const handleStatusChange = async (complaintId, newStatus, currentPriority) => {
    try {
      await updateGrievanceStatus(complaintId, newStatus, currentPriority);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handlePriorityChange = async (complaintId, currentStatus, newPriority) => {
    try {
      await updateGrievanceStatus(complaintId, currentStatus, newPriority);
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  useEffect(() => {
    document.title = wardParam 
      ? `Complaints - ${wardParam} | SmartCity Admin`
      : "Complaints Management | SmartCity Admin";
  }, [wardParam]);

  const filteredComplaints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return complaints.filter((c) => {
      // Apply ward filter if present in URL
      if (wardParam && c.ward !== wardParam) {
        return false;
      }

      const matchesQuery =
        !q ||
        c.complaintId?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [complaints, searchQuery, statusFilter, priorityFilter, wardParam]);

  const getStatusBadge = (status) => {
    const styles = {
      resolved: "bg-green-100 text-green-700 border border-green-200",
      "in-progress": "bg-orange-100 text-orange-700 border border-orange-200",
      pending: "bg-red-100 text-red-700 border border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: "bg-red-500 text-white",
      medium: "bg-orange-500 text-white",
      low: "bg-green-500 text-white",
    };
    return styles[priority] || "bg-gray-500 text-white";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {wardParam ? `Complaints for ${wardParam}` : "Complaints Management"}
          </h1>
          <p className="text-sm text-gray-600">
            {wardParam 
              ? `Showing filtered complaints for ${wardParam}` 
              : "View and manage all citizen complaints"}
          </p>
        </div>
        {wardParam && (
          <button 
            onClick={() => navigate("/admin/complaints")}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Ward Filter
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            All Complaints
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 h-10 border-gray-300"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredComplaints.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No complaints match your filters.
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div
                key={complaint.complaintId}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        #{complaint.complaintId} - {complaint.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Ward: {complaint.ward || "—"}</span>
                      <span>•</span>
                      <span>Date: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.complaintId, e.target.value, complaint.priority)}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label="Update status"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      
                      <select
                        value={complaint.priority}
                        onChange={(e) => handlePriorityChange(complaint.complaintId, complaint.status, e.target.value)}
                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label="Update priority"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Complaints;
