// import { useState, useEffect } from "react";
// import { useAuth } from "@/context/auth-context";
// import { apiService } from "@/services/apiService";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Heart, MapPin, Calendar, User } from "lucide-react";
// import { toast } from "sonner";

// const AllComplaints = () => {
//   const { user, isAuthenticated } = useAuth();
//   const [complaints, setComplaints] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filters, setFilters] = useState({
//     sortBy: 'newest',
//     category: '',
//     status: ''
//   });
//   const [upvotedComplaints, setUpvotedComplaints] = useState(new Set());

//   // Fetch complaints with filters
//   const fetchComplaints = async () => {
//     try {
//       setLoading(true);
//       const data = await apiService.getPublicComplaints(filters);
//       setComplaints(data.data || []);
//     } catch (error) {
//       console.error("Error fetching complaints:", error);
//       toast.error("Failed to load complaints");
//       setComplaints([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchComplaints();
//   }, [filters.sortBy, filters.category, filters.status]);

//   // Handle upvote
//   const handleUpvote = async (complaintId) => {
//     if (!isAuthenticated) {
//       toast.error("Please log in to upvote complaints");
//       return;
//     }
    
//     try {
//       await apiService.upvoteGrievance(complaintId);
      
//       // Update local state to reflect the upvote
//       setComplaints(prevComplaints => 
//         prevComplaints.map(complaint => 
//           complaint.complaintId === complaintId
//             ? { ...complaint, upvoteCount: (complaint.upvoteCount || 0) + 1 }
//             : complaint
//         )
//       );
      
//       setUpvotedComplaints(prev => new Set([...prev, complaintId]));
//       toast.success("Complaint upvoted successfully!");
//     } catch (error) {
//       console.error("Error upvoting complaint:", error);
//       toast.error(error.message || "Failed to upvote complaint");
//     }
//   };

//   // Handle filter changes
//   const handleFilterChange = (filterName, value) => {
//     setFilters(prev => ({
//       ...prev,
//       [filterName]: value
//     }));
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   // Get status badge color
//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'resolved':
//         return 'bg-green-100 text-green-800';
//       case 'in-progress':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'pending':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 pt-24">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">All Complaints</h1>
//           <p className="text-gray-600">See complaints submitted by all citizens in the community</p>
//         </div>

//         {/* Filters */}
//         <Card className="mb-6">
//           <CardContent className="pt-6">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
//                 <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="newest">Newest</SelectItem>
//                     <SelectItem value="most-upvoted">Most Upvoted</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                 <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="All Categories" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="">All Categories</SelectItem>
//                     <SelectItem value="infrastructure">Infrastructure</SelectItem>
//                     <SelectItem value="sanitation">Sanitation</SelectItem>
//                     <SelectItem value="traffic">Traffic</SelectItem>
//                     <SelectItem value="electricity">Electricity</SelectItem>
//                     <SelectItem value="water">Water</SelectItem>
//                     <SelectItem value="other">Other</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                 <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="All Status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="">All Status</SelectItem>
//                     <SelectItem value="pending">Pending</SelectItem>
//                     <SelectItem value="in-progress">In Progress</SelectItem>
//                     <SelectItem value="resolved">Resolved</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <div className="flex items-end">
//                 <Button 
//                   variant="outline" 
//                   onClick={() => setFilters({ sortBy: 'newest', category: '', status: '' })}
//                   className="w-full"
//                 >
//                   Clear Filters
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Complaints List */}
//         {loading ? (
//           <div className="text-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//             <p className="mt-4 text-gray-600">Loading complaints...</p>
//           </div>
//         ) : complaints.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-600">No complaints found matching your criteria.</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {complaints.map((complaint) => (
//               <Card key={complaint._id || complaint.complaintId} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
//                 <CardHeader className="pb-3">
//                   <div className="flex justify-between items-start">
//                     <CardTitle className="text-lg leading-tight max-h-12 overflow-hidden text-ellipsis">
//                       {complaint.title}
//                     </CardTitle>
//                     <Badge className={`${getStatusColor(complaint.status)} text-xs`}>
//                       {complaint.status?.replace('-', ' ') || 'pending'}
//                     </Badge>
//                   </div>
//                 </CardHeader>
                
//                 <CardContent className="space-y-4">
//                   {/* Description */}
//                   <p className="text-sm text-gray-600 max-h-20 overflow-hidden text-ellipsis">
//                     {complaint.description}
//                   </p>
                  
//                   {/* Details */}
//                   <div className="space-y-2 text-xs text-gray-500">
//                     <div className="flex items-center gap-1">
//                       <User className="w-3 h-3" />
//                       <span>
//                         {complaint.userId?.name || "Anonymous Citizen"}
//                       </span>
//                     </div>
                    
//                     {complaint.address && (
//                       <div className="flex items-center gap-1">
//                         <MapPin className="w-3 h-3" />
//                         <span>{complaint.address}</span>
//                       </div>
//                     )}
                    
//                     <div className="flex items-center gap-1">
//                       <Calendar className="w-3 h-3" />
//                       <span>{formatDate(complaint.createdAt)}</span>
//                     </div>
                    
//                     <div className="flex items-center gap-1">
//                       <span className="text-xs font-medium text-gray-700">Category:</span>
//                       <Badge variant="secondary" className="text-xs capitalize">
//                         {complaint.category}
//                       </Badge>
//                     </div>
//                   </div>
                  
//                   {/* Upvote Section */}
//                   <div className="flex items-center justify-between pt-3 border-t">
//                     <Button
//                       variant={upvotedComplaints.has(complaint.complaintId) ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => handleUpvote(complaint.complaintId)}
//                       disabled={!isAuthenticated || upvotedComplaints.has(complaint.complaintId)}
//                       className="flex items-center gap-1"
//                     >
//                       <Heart 
//                         className={`w-4 h-4 ${(isAuthenticated && upvotedComplaints.has(complaint.complaintId)) ? 'fill-current' : ''}`} 
//                       />
//                       {complaint.upvoteCount || 0}
//                     </Button>
                    
//                     {upvotedComplaints.has(complaint.complaintId) && (
//                       <span className="text-xs text-green-600 font-medium">Upvoted</span>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AllComplaints;
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { apiService } from "@/services/apiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, MapPin, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const AllComplaints = () => {
  const { isAuthenticated } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvotedComplaints, setUpvotedComplaints] = useState(new Set());

  const [filters, setFilters] = useState({
    sortBy: "newest",
    category: "all",
    status: "all",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // ✅ SAFE FETCH (FIXED)
  const fetchComplaints = async () => {
    try {
      setLoading(true);

      // Build query params - convert "all" to empty string for API
      const params = {
        sortBy: filters.sortBy,
        category: filters.category === "all" ? "" : filters.category,
        status: filters.status === "all" ? "" : filters.status,
      };

      const response = await apiService.getPublicComplaints(params);

      const complaintsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.complaints)
        ? response.complaints
        : [];

      setComplaints(complaintsList);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load complaints");
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filters.sortBy, filters.category, filters.status]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.sortBy, filters.category, filters.status]);

  // ✅ UPVOTE HANDLER - Uses complaintId field from backend
  const handleUpvote = async (complaint) => {
    if (!isAuthenticated) {
      toast.error("Please log in to upvote complaints");
      return;
    }

    // Check if already upvoted
    if (upvotedComplaints.has(complaint._id)) {
      toast.info("You already upvoted this complaint");
      return;
    }

    try {
      // Backend expects complaintId (string like "CMP-123"), not _id
      const response = await apiService.upvoteGrievance(complaint.complaintId);

      if (response.success) {
        // Optimistically update UI
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === complaint._id
              ? { ...c, upvoteCount: response.data.upvoteCount }
              : c
          )
        );

        setUpvotedComplaints((prev) => new Set([...prev, complaint._id]));
        toast.success("Upvoted successfully!");
      }
    } catch (error) {
      console.error("Upvote error:", error);
      
      // Enhanced error handling
      if (error.response?.status === 401) {
        toast.error("Please login to upvote");
      } else if (error.response?.status === 403) {
        toast.error("Not allowed to upvote");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Unable to upvote, try again");
      }
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">All Complaints</h1>
          <p className="text-gray-400">
            View complaints submitted by all citizens
          </p>
        </div>

        {/* FILTERS */}
        <Card className="mb-6">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.sortBy}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, sortBy: v }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most-upvoted">Most Upvoted</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, category: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Road Maintenance">Road</SelectItem>
                <SelectItem value="Water Supply">Water</SelectItem>
                <SelectItem value="Street Lighting">Street Light</SelectItem>
                <SelectItem value="Waste Management">Waste</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, status: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() =>
                setFilters({ sortBy: "newest", category: "all", status: "all" })
              }
            >
              Clear
            </Button>
          </CardContent>
        </Card>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Complaints Found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaints
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((c) => (
              <Card 
                key={c._id} 
                className="transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2">{c.title}</CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(c.status)}>
                        {c.status}
                      </Badge>
                      {(c.upvoteCount || c.upvotedBy?.length || 0) >= 5 && (
                        <Badge variant="secondary" className="text-xs">
                          🔥 Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-500 line-clamp-3">{c.description}</p>

                  <div className="text-xs text-gray-500 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <User size={12} /> 
                      <span>{c.userId?.name || "Citizen"}</span>
                    </div>
                    {c.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} /> 
                        <span className="line-clamp-1">{c.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} /> 
                      <span>{formatDate(c.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <Button
                      size="sm"
                      variant={
                        upvotedComplaints.has(c._id)
                          ? "default"
                          : "outline"
                      }
                      disabled={upvotedComplaints.has(c._id)}
                      onClick={() => handleUpvote(c)}
                      className="gap-1.5"
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${
                          upvotedComplaints.has(c._id) ? "fill-current" : ""
                        }`}
                      />
                      <span>{c.upvoteCount || c.upvotedBy?.length || 0}</span>
                    </Button>

                    {upvotedComplaints.has(c._id) && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Upvoted
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>

            {/* Pagination */}
            {complaints.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.ceil(complaints.length / itemsPerPage) },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(Math.ceil(complaints.length / itemsPerPage), p + 1)
                    )
                  }
                  disabled={currentPage === Math.ceil(complaints.length / itemsPerPage)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllComplaints;
