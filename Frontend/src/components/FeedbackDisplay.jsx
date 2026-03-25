import { motion } from "framer-motion";
import { MessageSquare, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StarRating from "./StarRating";

const FeedbackDisplay = ({ feedback, showUser = true }) => {
  if (!feedback) return null;

  const getInitials = (userId) => {
    // Generate initials from user ID hash
    return userId.slice(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {showUser && (
              <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-accent flex-shrink-0">
                <AvatarFallback className="bg-transparent text-primary-foreground text-sm font-semibold">
                  {getInitials(feedback.user_id)}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <StarRating rating={feedback.rating} readonly size="sm" />
                
                {feedback.timeliness_rating && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Timeliness: {feedback.timeliness_rating}/5</span>
                  </div>
                )}
              </div>
              
              {feedback.comment && (
                <p className="text-sm text-muted-foreground">
                  "{feedback.comment}"
                </p>
              )}
              
              <p className="text-xs text-muted-foreground/60 mt-2">
                {new Date(feedback.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeedbackDisplay;
