// import { useEffect, useState, useMemo } from "react";
// import { gsap } from "gsap";
// import { motion } from "framer-motion";
// import { MessageSquare, Star, ThumbsUp, Clock, TrendingUp } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import StarRating from "@/components/StarRating";
// import useFeedback from "@/hooks/useFeedback";

// const Feedback = () => {
//   const { allFeedback, stats, loading } = useFeedback();

//   useEffect(() => {
//     document.title = "Feedback | SmartCity Admin";
    
//     gsap.fromTo(
//       ".feedback-content",
//       { opacity: 0, y: 20 },
//       { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
//     );
//   }, []);

//   const getInitials = (userId) => {
//     return userId.slice(0, 2).toUpperCase();
//   };

//   // Rating distribution
//   const ratingDistribution = useMemo(() => {
//     const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
//     allFeedback.forEach(f => {
//       distribution[f.rating] = (distribution[f.rating] || 0) + 1;
//     });
//     return distribution;
//   }, [allFeedback]);

//   const getRatingPercent = (rating) => {
//     if (allFeedback.length === 0) return 0;
//     return Math.round((ratingDistribution[rating] / allFeedback.length) * 100);
//   };

//   return (
//     <div className="feedback-content">
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-foreground mb-2">Citizen Feedback</h1>
//         <p className="text-muted-foreground">Review and analyze citizen satisfaction</p>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//         >
//           <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
//             <div className="absolute top-0 right-0 w-20 h-20 bg-warning/10 rounded-full -translate-y-10 translate-x-10" />
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm text-muted-foreground">Average Rating</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center gap-3">
//                 <p className="text-4xl font-bold text-foreground">
//                   {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
//                 </p>
//                 <div>
//                   <StarRating rating={Math.round(stats.averageRating)} readonly size="sm" />
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2">Based on {stats.totalFeedback} reviews</p>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//         >
//           <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
//             <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-10 translate-x-10" />
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm text-muted-foreground">Total Feedback</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center gap-2">
//                 <MessageSquare className="h-8 w-8 text-primary" />
//                 <p className="text-4xl font-bold text-foreground">{stats.totalFeedback}</p>
//               </div>
//               <p className="text-xs text-success mt-2">
//                 <TrendingUp className="inline h-3 w-3 mr-1" />
//                 From resolved complaints
//               </p>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//         >
//           <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
//             <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-full -translate-y-10 translate-x-10" />
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm text-muted-foreground">Positive Reviews</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center gap-2">
//                 <ThumbsUp className="h-8 w-8 text-success" />
//                 <p className="text-4xl font-bold text-foreground">{stats.positivePercent}%</p>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2">4-5 star ratings</p>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//         >
//           <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
//             <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-10 translate-x-10" />
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm text-muted-foreground">Timeliness Rating</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex items-center gap-2">
//                 <Clock className="h-8 w-8 text-secondary" />
//                 <p className="text-4xl font-bold text-foreground">
//                   {stats.averageTimeliness > 0 ? stats.averageTimeliness.toFixed(1) : "—"}
//                 </p>
//               </div>
//               <p className="text-xs text-muted-foreground mt-2">Average response satisfaction</p>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>

//       {/* Rating Distribution */}
//       <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 mb-8">
//         <CardHeader>
//           <CardTitle>Rating Distribution</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {[5, 4, 3, 2, 1].map((star) => (
//               <motion.div
//                 key={star}
//                 className="flex items-center gap-3"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.5 + (5 - star) * 0.1 }}
//               >
//                 <div className="flex items-center gap-1 w-12">
//                   <span className="text-sm font-medium">{star}</span>
//                   <Star className="h-4 w-4 fill-warning text-warning" />
//                 </div>
//                 <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
//                   <motion.div
//                     className="h-full bg-gradient-to-r from-warning to-warning/70 rounded-full"
//                     initial={{ width: 0 }}
//                     animate={{ width: `${getRatingPercent(star)}%` }}
//                     transition={{ delay: 0.7 + (5 - star) * 0.1, duration: 0.5 }}
//                   />
//                 </div>
//                 <span className="text-sm text-muted-foreground w-12 text-right">
//                   {ratingDistribution[star]} ({getRatingPercent(star)}%)
//                 </span>
//               </motion.div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Feedback List */}
//       <h2 className="text-xl font-bold mb-4">Recent Feedback</h2>
      
//       {loading ? (
//         <div className="space-y-4">
//           {[1, 2, 3].map((i) => (
//             <Card key={i} className="border-border/50 animate-pulse">
//               <CardContent className="p-6">
//                 <div className="flex items-start gap-4">
//                   <div className="h-12 w-12 rounded-full bg-muted" />
//                   <div className="flex-1 space-y-2">
//                     <div className="h-4 bg-muted rounded w-1/3" />
//                     <div className="h-3 bg-muted rounded w-1/2" />
//                     <div className="h-3 bg-muted rounded w-full" />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : allFeedback.length === 0 ? (
//         <Card className="border-border/50">
//           <CardContent className="p-12 text-center">
//             <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//             <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
//             <p className="text-muted-foreground">
//               Feedback will appear here when citizens rate resolved complaints
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {allFeedback.map((feedback, index) => (
//             <motion.div
//               key={feedback.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//             >
//               <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 hover:shadow-elevated transition-smooth">
//                 <CardContent className="p-6">
//                   <div className="flex items-start gap-4">
//                     <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-accent">
//                       <AvatarFallback className="bg-transparent text-primary-foreground font-semibold">
//                         {getInitials(feedback.user_id)}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1">
//                       <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
//                         <div>
//                           <h3 className="font-semibold text-foreground">Citizen Feedback</h3>
//                           <p className="text-xs text-muted-foreground">
//                             {new Date(feedback.created_at).toLocaleDateString("en-US", {
//                               month: "long",
//                               day: "numeric",
//                               year: "numeric"
//                             })}
//                           </p>
//                         </div>
//                         <div className="flex items-center gap-3">
//                           <StarRating rating={feedback.rating} readonly size="sm" />
//                           {feedback.timeliness_rating && (
//                             <Badge variant="outline" className="text-xs">
//                               <Clock className="h-3 w-3 mr-1" />
//                               Timeliness: {feedback.timeliness_rating}/5
//                             </Badge>
//                           )}
//                         </div>
//                       </div>
//                       {feedback.comment && (
//                         <p className="text-sm text-muted-foreground mb-3">
//                           "{feedback.comment}"
//                         </p>
//                       )}
//                       <div className="flex items-center gap-4">
//                         <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
//                           Resolved Complaint
//                         </Badge>
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Feedback;
import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import useFeedback from "@/hooks/useFeedback";
import StarRating from "@/components/StarRating";

const Feedback = () => {
  const { allFeedback, stats, loading } = useFeedback();

  useEffect(() => {
    document.title = "Citizen Feedback | SmartCity Admin";
  }, []);

  const getAvatarColor = (index) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Citizen Feedback</h1>
        <p className="text-sm text-gray-600">Review and analyze citizen satisfaction</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Average Rating</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—"}
            </span>
            <StarRating rating={Math.round(stats.averageRating)} readonly size="sm" />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Based on {stats.totalFeedback} reviews
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Total Feedback</div>
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-3xl font-bold text-gray-900">{stats.totalFeedback}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">+30% from last month</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm text-gray-600 mb-2">Positive Reviews</div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.positivePercent}%</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">4-5 star ratings</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Loading feedback...
            </div>
          ) : allFeedback.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No feedback available yet.
            </div>
          ) : (
            allFeedback.slice(0, 10).map((item, index) => (
              <div key={item.id || index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-semibold text-sm`}>
                    {getInitials(item.userName || "Anonymous")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{item.userName || "Anonymous"}</h3>
                      <StarRating rating={item.rating} readonly size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Complaint #{item.complaintId} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700">{item.comment}</p>
                    {item.helpful > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{item.helpful} found helpful</span>
                      </div>
                    )}
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

export default Feedback;