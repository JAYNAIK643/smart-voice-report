import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/apiService";

/**
 * Advanced Engagement System - Streak Widget
 * Displays user's activity streak with fail-safe loading
 */
const StreakWidget = ({ userId, compact = false }) => {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchStreakData();
  }, [userId]);

  const fetchStreakData = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/engagement/streak`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStreakData(data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching streak data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={compact ? "border-border/50" : ""}>
        <CardHeader className={compact ? "p-4" : ""}>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className={compact ? "p-4 pt-0" : ""}>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !streakData) {
    // Fail silently - don't break the UI
    return null;
  }

  const { currentStreak, longestStreak, isActive } = streakData;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <motion.div
          animate={{
            scale: isActive ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: isActive ? Infinity : 0,
          }}
        >
          <Flame className={`h-6 w-6 ${isActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
        </motion.div>
        <div>
          <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        {longestStreak > currentStreak && (
          <Badge variant="outline" className="ml-auto">
            Best: {longestStreak}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={isActive ? "text-orange-500" : "text-muted-foreground"} />
          Activity Streak
          {isActive && (
            <Badge variant="default" className="ml-auto bg-orange-500">
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{
                scale: isActive ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: isActive ? Infinity : 0,
              }}
            >
              <Flame className="h-8 w-8 text-orange-500 mb-2" />
            </motion.div>
            <p className="text-4xl font-bold text-foreground">{currentStreak}</p>
            <p className="text-sm text-muted-foreground">Current Streak</p>
          </motion.div>

          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted/30">
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <p className="text-4xl font-bold text-foreground">{longestStreak}</p>
            <p className="text-sm text-muted-foreground">Best Streak</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {isActive
                ? "Keep it going! Submit a complaint or upvote today to continue your streak."
                : currentStreak > 0
                ? "Your streak ended. Submit a complaint to start a new one!"
                : "Start your streak by submitting your first complaint!"}
            </span>
          </div>
        </div>

        {currentStreak >= 7 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
          >
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              🎉 Amazing! You've maintained a {currentStreak}-day streak!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreakWidget;
