import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, MapPin, Clock, ArrowRight, Flame, Zap } from "lucide-react";
import { apiService } from "@/services/apiService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UpvoteButton from "@/components/UpvoteButton";
import { formatDistanceToNow } from "date-fns";

const TrendingIssues = () => {
  const [trendingComplaints, setTrendingComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingComplaints();
  }, []);

  const fetchTrendingComplaints = async () => {
    try {
      const response = await apiService.getPublicComplaints({ sort: 'upvotes', limit: 6 });
      if (response.success) {
        // Map backend field names to frontend expected format
        const mapped = (response.data || []).map(c => ({
          ...c,
          id: c._id || c.id,
          complaint_id: c.complaintId || c.complaint_id,
          upvote_count: c.upvoteCount || c.upvote_count || 0,
          created_at: c.createdAt || c.created_at
        }));
        setTrendingComplaints(mapped);
      }
    } catch (error) {
      console.error("Error fetching trending complaints:", error);
    } finally {
      setLoading(false);
    }
  };

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
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (trendingComplaints.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive mb-4">
            <Flame className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Hot Issues</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Trending <span className="text-primary">Issues</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See what matters most to your community. Upvote issues to help prioritize them.
          </p>
        </motion.div>

        {/* Trending Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {trendingComplaints.slice(0, 3).map((complaint, index) => (
            <motion.div key={complaint.id} variants={itemVariants}>
              <Card className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/30 hover:shadow-card transition-all duration-300 h-full">
                {/* Rank Badge */}
                {index < 3 && (
                  <div className="absolute top-3 right-3 z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                      className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg"
                          : index === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                          : "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                      }`}
                    >
                      {index === 0 ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        `#${index + 1}`
                      )}
                    </motion.div>
                  </div>
                )}

                <div className="p-5">
                  {/* Category & Status */}
                  <div className="flex items-center gap-2 mb-3">
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
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {complaint.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {complaint.description || "No description provided"}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {complaint.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">
                          {complaint.location}
                        </span>
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

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <UpvoteButton
                      complaintId={complaint.id}
                      initialCount={complaint.upvote_count || 0}
                      size="sm"
                    />
                    <Link
                      to={`/track?id=${complaint.complaint_id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg" asChild className="group">
            <Link to="/issues">
              <TrendingUp className="h-4 w-4 mr-2" />
              View All Issues
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default TrendingIssues;
