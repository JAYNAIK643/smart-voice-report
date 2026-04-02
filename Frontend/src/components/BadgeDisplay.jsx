import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flag,
  Users,
  HeartHandshake,
  Star,
  MessageCircle,
  Rocket,
  Award,
  CheckCircle2,
  Lock,
  TrendingUp,
  Zap
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

const tierColors = {
  basic: {
    gradient: "from-gray-400 to-gray-500",
    border: "border-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
    glow: "shadow-gray-200"
  },
  bronze: {
    gradient: "from-amber-600 to-amber-700",
    border: "border-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    glow: "shadow-amber-200"
  },
  silver: {
    gradient: "from-slate-400 to-slate-500",
    border: "border-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-600",
    glow: "shadow-slate-200"
  },
  gold: {
    gradient: "from-yellow-400 to-yellow-600",
    border: "border-yellow-400",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    glow: "shadow-yellow-200"
  },
  platinum: {
    gradient: "from-indigo-400 to-purple-500",
    border: "border-indigo-400",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    glow: "shadow-indigo-200"
  }
};

const categoryColors = {
  milestone: "from-blue-500 to-cyan-500",
  engagement: "from-purple-500 to-pink-500",
  impact: "from-amber-500 to-orange-500",
  special: "from-emerald-500 to-teal-500",
  tier: "from-violet-500 to-purple-500",
  streak: "from-red-500 to-orange-500"
};

const BadgeDisplay = ({ badge, earned = false, progress = 0, size = "md", showTooltip = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const IconComponent = iconMap[badge.icon] || Award;
  const tier = badge.tier || "basic";
  const tierStyle = tierColors[tier] || tierColors.basic;
  
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
          ? `bg-gradient-to-br ${categoryColors[badge.category] || tierStyle.gradient}`
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
            categoryColors[badge.category] || tierStyle.gradient
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
      
      {/* Icon or Emoji */}
      {badge.icon && badge.icon.length <= 2 ? (
        <span className={cn("text-xl", size === "lg" && "text-3xl")}>
          {badge.icon}
        </span>
      ) : (
        <IconComponent
          size={iconSizes[size]}
          className={cn(
            "transition-colors",
            earned ? "text-white" : "text-muted-foreground/50"
          )}
        />
      )}
      
      {/* Lock icon for locked badges */}
      {!earned && progress === 0 && (
        <div className="absolute -bottom-1 -right-1 bg-muted rounded-full p-0.5">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      
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
          className="max-w-xs bg-popover border border-border p-3"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{badge.name}</p>
              {earned && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            <p className="text-sm text-muted-foreground">{badge.description}</p>
            {badge.benefits && (
              <div className="pt-1 border-t border-border">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Benefits:
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{badge.benefits}</p>
              </div>
            )}
            {!earned && progress > 0 && (
              <div className="pt-1 border-t border-border">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
            {earned && (
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Badge Unlocked!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BadgeDisplay;
