import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, Filter, MapPin, Clock, ArrowUpDown, 
  Flame, TrendingUp, Calendar, Grid, List, X
} from "lucide-react";
import { apiService } from "@/services/apiService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpvoteButton from "@/components/UpvoteButton";
import VoiceSearch from "@/components/voice/VoiceSearch";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const PublicIssues = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trending"); // "trending", "newest", "oldest"
  const [viewMode, setViewMode] = useState("grid"); // "grid", "list"

  useEffect(() => {
    fetchComplaints();
  }, [sortBy]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPublicComplaints({ 
        sort: sortBy === 'trending' ? 'upvotes' : sortBy === 'newest' ? 'newest' : 'oldest',
        limit: 50 
      });
      
      if (response.success) {
        // Map backend field names to frontend expected format
        const mapped = (response.data || []).map(c => ({
          ...c,
          id: c._id || c.id,
          complaint_id: c.complaintId || c.complaint_id,
          upvote_count: c.upvoteCount || c.upvote_count || 0,
          created_at: c.createdAt || c.created_at
        }));
        setComplaints(mapped);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch = 
      searchQuery === "" ||
      complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      categoryFilter === "all" || 
      complaint.category?.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus = 
      statusFilter === "all" || 
      complaint.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ["all", "roads", "water", "garbage", "lighting", "other"];
  const statuses = ["all", "pending", "in-progress", "resolved"];

  const getCategoryColor = (category) => {
    const colors = {
      roads: "bg-warning/10 text-warning border-warning/20",
      water: "bg-secondary/10 text-secondary border-secondary/20",
      garbage: "bg-success/10 text-success border-success/20",
      lighting: "bg-accent/10 text-accent border-accent/20",
      other: "bg-muted text-muted-foreground border-border",
    };
    return colors[category?.toLowerCase()] || colors.other;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-warning/10 text-warning",
      "in-progress": "bg-secondary/10 text-secondary",
      resolved: "bg-success/10 text-success",
    };
    return colors[status] || colors.pending;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Community Issues</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Public <span className="text-primary">Issues</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Browse and upvote issues reported by your community. Your vote helps prioritize what matters most.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Voice Search - NEW */}
            <VoiceSearch 
              onSearch={(query) => setSearchQuery(query)}
              placeholder="Search issues by voice or text..."
              className="w-full lg:w-96"
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Tabs value={sortBy} onValueChange={setSortBy}>
                <TabsList className="bg-muted">
                  <TabsTrigger value="trending" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Flame className="h-4 w-4 mr-1" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="newest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    Newest
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* View Mode */}
              <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded transition-colors",
                    viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded transition-colors",
                    viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {(searchQuery || categoryFilter !== "all" || statusFilter !== "all") && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {statusFilter}
                  <button onClick={() => setStatusFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Issues Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className={cn(
              "gap-4",
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "flex flex-col"
            )}>
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Skeleton className={viewMode === "grid" ? "h-64 rounded-xl" : "h-32 rounded-xl"} />
                </motion.div>
              ))}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Issues Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters to find what you're looking for."
                  : "No issues have been reported yet. Be the first to report one!"}
              </p>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filteredComplaints.length} of {complaints.length} issues
              </p>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  "gap-4",
                  viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "flex flex-col"
                )}
              >
                {filteredComplaints.map((complaint, index) => (
                  <motion.div key={complaint.id} variants={itemVariants}>
                    <Card className={cn(
                      "group overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-card transition-all duration-300",
                      viewMode === "list" && "flex items-center"
                    )}>
                      <div className={cn("p-5 flex-1", viewMode === "list" && "flex items-center gap-4")}>
                        {/* Rank indicator for top 3 */}
                        {sortBy === "trending" && index < 3 && (
                          <div className={cn(
                            "mb-3",
                            viewMode === "list" && "mb-0"
                          )}>
                            <Badge className={cn(
                              "font-bold",
                              index === 0 && "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
                              index === 1 && "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800",
                              index === 2 && "bg-gradient-to-r from-orange-400 to-orange-600 text-white"
                            )}>
                              #{index + 1} Trending
                            </Badge>
                          </div>
                        )}

                        <div className={viewMode === "list" ? "flex-1" : ""}>
                          {/* Category & Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getCategoryColor(complaint.category)}`}
                            >
                              {complaint.category || "General"}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </Badge>
                          </div>

                          {/* Title */}
                          <h3 className={cn(
                            "font-semibold text-foreground mb-2 group-hover:text-primary transition-colors",
                            viewMode === "grid" ? "text-lg line-clamp-2" : "text-base line-clamp-1"
                          )}>
                            {complaint.title}
                          </h3>

                          {/* Description */}
                          {viewMode === "grid" && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {complaint.description || "No description provided"}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {complaint.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[100px]">{complaint.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(complaint.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Upvote Button */}
                        <div className={cn(
                          viewMode === "grid" ? "mt-4 pt-3 border-t border-border/50" : "ml-auto"
                        )}>
                          <UpvoteButton
                            complaintId={complaint.id}
                            initialCount={complaint.upvote_count || 0}
                            size={viewMode === "grid" ? "default" : "sm"}
                          />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default PublicIssues;
