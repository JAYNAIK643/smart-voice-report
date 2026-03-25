import { motion } from "framer-motion";
import { Star, MessageSquare, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StarRating from "./StarRating";

const FeedbackSummaryCard = ({ 
  averageRating = 0, 
  totalFeedback = 0,
  averageTimeliness = 0,
  positivePercent = 0,
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full -translate-y-16 translate-x-16" />
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-warning fill-warning" />
            Citizen Feedback
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Main rating display */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-4xl font-bold text-foreground"
            >
              {averageRating.toFixed(1)}
            </motion.div>
            <div>
              <StarRating rating={Math.round(averageRating)} readonly size="md" />
              <p className="text-xs text-muted-foreground mt-1">
                Based on {totalFeedback} reviews
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              className="bg-muted/50 rounded-lg p-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Timeliness</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">
                  {averageTimeliness > 0 ? averageTimeliness.toFixed(1) : "—"}
                </span>
                <StarRating rating={Math.round(averageTimeliness)} readonly size="sm" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-muted/50 rounded-lg p-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-success">
                  {positivePercent}%
                </span>
                <span className="text-xs text-muted-foreground">4-5 stars</span>
              </div>
            </motion.div>
          </div>

          {/* Rating distribution bars */}
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star, index) => (
              <motion.div
                key={star}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <span className="text-xs text-muted-foreground w-3">{star}</span>
                <Star className="h-3 w-3 fill-warning text-warning" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-warning rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.random() * 100}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeedbackSummaryCard;
