import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showLabel = false,
  label = "Rating"
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10"
  };

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex flex-col gap-1">
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= displayRating;
          
          return (
            <motion.button
              key={value}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(value)}
              onMouseEnter={() => !readonly && setHoverRating(value)}
              onMouseLeave={() => !readonly && setHoverRating(0)}
              className={cn(
                "relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm",
                !readonly && "cursor-pointer hover:scale-110 transition-transform"
              )}
              whileHover={!readonly ? { scale: 1.15 } : {}}
              whileTap={!readonly ? { scale: 0.95 } : {}}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFilled ? "filled" : "empty"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "transition-colors duration-200",
                      isFilled 
                        ? "fill-warning text-warning" 
                        : "text-muted-foreground/40"
                    )}
                  />
                </motion.div>
              </AnimatePresence>
              
              {/* Glow effect for filled stars */}
              {isFilled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.3, scale: 1.5 }}
                  className="absolute inset-0 bg-warning rounded-full blur-md -z-10"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StarRating;
