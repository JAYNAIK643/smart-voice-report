import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ThumbsUp } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";

const UpvoteButton = ({ 
  complaintId, 
  initialCount = 0, 
  variant = "heart", // "heart" or "thumbs"
  size = "default", // "sm", "default", "lg"
  className 
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already upvoted
  useEffect(() => {
    if (!user || !complaintId) return;

    const checkUpvote = async () => {
      try {
        // We'll need to get the grievance and check if user ID is in upvotedBy array
        // Since we don't have a direct endpoint for this, we'll rely on the backend
        // to handle duplicate prevention and set initial state based on props
        // The backend will reject duplicate upvotes anyway
      } catch (error) {
        console.error("Error checking upvote status:", error);
      }
    };

    checkUpvote();
  }, [user, complaintId]);

  // Removed Supabase realtime subscription - using direct API calls instead
  // Realtime updates will happen through component re-renders when parent data changes

  const handleUpvote = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upvote complaints",
        variant: "destructive",
      });
      return;
    }

    // Debug: Check if auth token exists
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("❌ No auth token found in localStorage");
      toast({
        title: "Authentication Error",
        description: "No authentication token found. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;
    if (isUpvoted) {
      toast({
        title: "Already upvoted",
        description: "You have already upvoted this complaint",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setIsAnimating(true);

    try {
      console.log(`🚀 Attempting to upvote complaint: ${complaintId}`);
      console.log(`🔐 Auth token present: ${!!token}`);
      
      // Use the API service to upvote
      const response = await apiService.upvoteGrievance(complaintId);
      
      console.log("✅ Upvote response:", response);
      
      if (response.success) {
        // Set upvoted state to true
        setIsUpvoted(true);
        // Update count from response or increment by 1
        setCount((prev) => prev + 1);
        
        toast({
          title: "Success",
          description: "Complaint upvoted successfully!",
        });
      } else {
        throw new Error(response.message || "Failed to upvote");
      }
    } catch (error) {
      console.error("💥 Upvote error:", error);
      console.error("💥 Error name:", error.name);
      console.error("💥 Error message:", error.message);
      console.error("💥 Error stack:", error.stack);
      
      // More specific error handling
      let errorMessage = "Failed to upvote. Please try again.";
      
      if (error.message.includes("401")) {
        errorMessage = "Authentication failed. Please log out and log back in.";
      } else if (error.message.includes("404")) {
        errorMessage = "Complaint not found.";
      } else if (error.message.includes("403")) {
        errorMessage = "You cannot upvote this complaint.";
      } else if (error.message.includes("400")) {
        errorMessage = "You have already upvoted this complaint.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const Icon = variant === "heart" ? Heart : ThumbsUp;

  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const buttonSizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    default: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <motion.button
      onClick={handleUpvote}
      disabled={isLoading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all",
        "border border-border bg-card hover:bg-muted",
        isUpvoted && "border-primary/50 bg-primary/10 text-primary",
        buttonSizeClasses[size],
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isUpvoted ? "filled" : "empty"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icon
            className={cn(
              sizeClasses[size],
              "transition-colors",
              isUpvoted ? "fill-primary text-primary" : "text-muted-foreground"
            )}
          />
        </motion.div>
      </AnimatePresence>

      {/* Particle burst animation */}
      <AnimatePresence>
        {isAnimating && isUpvoted && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-primary"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.span
        key={count}
        initial={{ y: isUpvoted ? -10 : 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-semibold tabular-nums"
      >
        {count}
      </motion.span>
    </motion.button>
  );
};

export default UpvoteButton;
