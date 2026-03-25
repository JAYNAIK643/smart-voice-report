import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Trophy } from "lucide-react";
import BadgeDisplay from "./BadgeDisplay";
import { useBadges } from "@/context/badges-context";

const BadgesSection = () => {
  const { availableBadges, earnedBadges, loading, getBadgeProgress, getUserProgress } = useBadges();
  const [progress, setProgress] = useState({ complaintsSubmitted: 0, complaintsResolved: 0 });

  useEffect(() => {
    const loadProgress = async () => {
      const userProgress = await getUserProgress();
      setProgress(userProgress);
    };
    loadProgress();
  }, [getUserProgress]);

  const earnedBadgeIds = earnedBadges.map(eb => eb.badge_id);

  const categorizedBadges = {
    milestone: availableBadges.filter(b => b.category === 'milestone'),
    engagement: availableBadges.filter(b => b.category === 'engagement'),
    impact: availableBadges.filter(b => b.category === 'impact'),
    special: availableBadges.filter(b => b.category === 'special'),
  };

  const categoryLabels = {
    milestone: "Milestone Badges",
    engagement: "Engagement Badges",
    impact: "Impact Badges",
    special: "Special Badges",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-14 h-14 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedCount = earnedBadges.length;
  const totalCount = availableBadges.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Your Badges
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{earnedCount}</span>
            <span>/</span>
            <span>{totalCount}</span>
            <span>earned</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collection Progress</span>
            <span className="font-medium">{Math.round((earnedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{progress.complaintsSubmitted}</p>
            <p className="text-sm text-muted-foreground">Complaints Submitted</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{progress.complaintsResolved}</p>
            <p className="text-sm text-muted-foreground">Complaints Resolved</p>
          </div>
        </div>

        {/* Badges by category */}
        {Object.entries(categorizedBadges).map(([category, badges]) => {
          if (badges.length === 0) return null;
          
          return (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {categoryLabels[category]}
              </h4>
              <div className="flex flex-wrap gap-4">
                {badges.map((badge, index) => {
                  const isEarned = earnedBadgeIds.includes(badge.id);
                  const badgeProgress = getBadgeProgress(badge, progress);
                  
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <BadgeDisplay
                        badge={badge}
                        earned={isEarned}
                        progress={badgeProgress}
                        size="md"
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {availableBadges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No badges available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgesSection;
