import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flag,
  Users,
  HeartHandshake,
  Star,
  MessageCircle,
  Rocket,
  Award
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const iconMap = {
  flag: Flag,
  users: Users,
  "heart-handshake": HeartHandshake,
  star: Star,
  "message-circle": MessageCircle,
  rocket: Rocket,
};

const categoryColors = {
  milestone: "from-blue-500 to-cyan-500",
  engagement: "from-purple-500 to-pink-500",
  impact: "from-amber-500 to-orange-500",
  special: "from-emerald-500 to-teal-500",
};

const BadgeDisplay = ({ badge, earned = false, progress = 0, size = "md", showTooltip = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const IconComponent = iconMap[badge.icon] || Award;
  
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };
  
  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 36,
  };

  const badgeContent = (
    <motion.div
      className={cn(
        "relative rounded-full flex items-center justify-center cursor-pointer",
        sizeClasses[size],
        earned
          ? `bg-gradient-to-br ${categoryColors[badge.category] || categoryColors.milestone}`
          : "bg-muted border-2 border-dashed border-muted-foreground/30"
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={earned ? { scale: 0, rotate: -180 } : { scale: 1 }}
      animate={earned ? { scale: 1, rotate: 0 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Glow effect for earned badges */}
      {earned && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md -z-10",
            categoryColors[badge.category] || categoryColors.milestone
          )}
          animate={{
            scale: isHovered ? 1.3 : 1.1,
            opacity: isHovered ? 0.7 : 0.4,
          }}
        />
      )}
      
      {/* Progress ring for unearned badges */}
      {!earned && progress > 0 && (
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-primary/30"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: "283",
              strokeDashoffset: "283",
            }}
          />
        </svg>
      )}
      
      <IconComponent
        size={iconSizes[size]}
        className={cn(
          "transition-colors",
          earned ? "text-white" : "text-muted-foreground/50"
        )}
      />
      
      {/* Sparkle effect on hover for earned badges */}
      {earned && isHovered && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, (i % 2 === 0 ? 1 : -1) * 20],
                y: [0, (i < 2 ? -1 : 1) * 20],
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-popover border border-border"
        >
          <div className="space-y-1">
            <p className="font-semibold">{badge.name}</p>
            <p className="text-sm text-muted-foreground">{badge.description}</p>
            {!earned && progress > 0 && (
              <p className="text-xs text-primary font-medium">
                {Math.round(progress)}% complete
              </p>
            )}
            {earned && (
              <p className="text-xs text-green-500 font-medium">✓ Earned!</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BadgeDisplay;
