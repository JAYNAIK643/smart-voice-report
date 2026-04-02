import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Gift, Award, Zap, Scroll, Sparkles, CheckCircle2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBadges } from "@/context/badges-context";
import { cn } from "@/lib/utils";

const RewardBanner = () => {
  const { availableBadges, earnedBadges, getUserProgress } = useBadges();
  const [progress, setProgress] = useState({ complaintsSubmitted: 0, complaintsResolved: 0 });
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchProgress = async () => {
      const userProgress = await getUserProgress();
      setProgress(userProgress);
    };
    fetchProgress();
  }, [getUserProgress]);

  useEffect(() => {
    setEarnedCount(earnedBadges.length);
    setTotalCount(availableBadges.length);
  }, [availableBadges, earnedBadges]);

  const isCompleted = earnedCount >= totalCount && totalCount > 0;
  const progressPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const rewards = [
    { icon: Gift, text: "Official \"Good Citizen Certificate\"", color: "text-yellow-400" },
    { icon: Award, text: "Public Recognition (Leaderboard + Ward Office)", color: "text-blue-400" },
    { icon: Zap, text: "Highest Priority Complaint Handling", color: "text-orange-400" },
    { icon: Scroll, text: "Appreciation from Municipal Authority", color: "text-purple-400" },
    { icon: Sparkles, text: "Eligible for Annual Government Rewards", color: "text-green-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Card
        className={cn(
          "relative overflow-hidden border-2 transition-all duration-300",
          "hover:scale-[1.01] hover:shadow-2xl",
          isCompleted
            ? "border-yellow-400/50 bg-gradient-to-br from-yellow-900/30 via-amber-800/20 to-orange-900/30"
            : "border-purple-500/30 bg-gradient-to-br from-purple-900/30 via-indigo-800/20 to-violet-900/30"
        )}
      >
        {/* Animated Glow Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className={cn(
              "absolute -inset-[1px] opacity-50 blur-xl",
              isCompleted
                ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 animate-pulse"
                : "bg-gradient-to-r from-purple-500 via-indigo-500 to-violet-500 animate-pulse"
            )}
            style={{ animationDuration: "3s" }}
          />
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ["-200%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "linear",
            }}
            style={{ width: "50%" }}
          />
        </div>

        {/* Content */}
        <div className="relative p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <motion.div
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full",
                "bg-gradient-to-br",
                isCompleted
                  ? "from-yellow-400 to-orange-500"
                  : "from-purple-400 to-indigo-600"
              )}
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Trophy className="h-8 w-8 text-white" />
            </motion.div>
            
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                🏆 Good Citizen Grand Reward
                {isCompleted && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-sm bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-semibold"
                  >
                    ACHIEVED!
                  </motion.span>
                )}
              </h2>
              <p className="text-gray-300 text-sm md:text-base">
                Citizens who unlock ALL badges will receive a special government recognition and grand reward.
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-6 p-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Your Progress</span>
              <span className="text-sm font-bold text-white">
                {earnedCount} / {totalCount} Badges
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={progressPercentage} 
                className={cn(
                  "h-3 bg-gray-700/50",
                  isCompleted ? "[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-orange-500" : "[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-indigo-500"
                )}
              />
              <motion.div
                className="absolute inset-0 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-full bg-white/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                />
              </motion.div>
            </div>
            {isCompleted ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center text-yellow-300 font-semibold flex items-center justify-center gap-2"
              >
                🎉 You are eligible for the Grand Reward!
              </motion.p>
            ) : (
              <p className="mt-2 text-xs text-gray-400 text-center">
                Complete all {totalCount} badges to unlock the Grand Reward
              </p>
            )}
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rewards.map((reward, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  "bg-white/5 hover:bg-white/10 transition-colors border border-white/5",
                  isCompleted && "border-yellow-400/20"
                )}
              >
                <reward.icon className={cn("h-5 w-5 flex-shrink-0", reward.color)} />
                <span className="text-sm text-gray-200">{reward.text}</span>
                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-yellow-400 ml-auto flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Bottom Badge */}
          <div className="mt-6 flex justify-center">
            <motion.div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                "border text-sm font-medium",
                isCompleted
                  ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-300"
                  : "bg-purple-400/10 border-purple-400/30 text-purple-300"
              )}
              whileHover={{ scale: 1.05 }}
            >
              <Star className="h-4 w-4" />
              <span>
                {isCompleted 
                  ? "Congratulations! You're a model citizen!" 
                  : "Keep earning badges to unlock this reward!"}
              </span>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default RewardBanner;
