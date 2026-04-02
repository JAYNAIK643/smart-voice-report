import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Lock, CheckCircle2, Zap, TrendingUp, Star, X, Target, Gift, Clock, Shield, Users, Sparkles } from "lucide-react";
import BadgeDisplay from "./BadgeDisplay";
import { useBadges } from "@/context/badges-context";
import { cn } from "@/lib/utils";

const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3, basic: 4 };

const BadgesSection = () => {
  const { availableBadges, earnedBadges, loading, getBadgeProgress, getUserProgress } = useBadges();
  const [progress, setProgress] = useState({ complaintsSubmitted: 0, complaintsResolved: 0, upvotesReceived: 0, currentStreak: 0 });
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      const userProgress = await getUserProgress();
      setProgress(userProgress);
    };
    loadProgress();
  }, [getUserProgress]);

  const earnedBadgeIds = earnedBadges.map(eb => eb.badge_id || eb.badgeId);

  // Sort badges by tier (highest first) then by earned status
  const sortedBadges = [...availableBadges].sort((a, b) => {
    const tierA = a.tier || "basic";
    const tierB = b.tier || "basic";
    const earnedA = earnedBadgeIds.includes(a.id) ? 0 : 1;
    const earnedB = earnedBadgeIds.includes(b.id) ? 0 : 1;
    
    if (earnedA !== earnedB) return earnedA - earnedB;
    return (tierOrder[tierA] || 4) - (tierOrder[tierB] || 4);
  });

  const categorizedBadges = {
    tier: sortedBadges.filter(b => b.category === 'tier'),
    impact: sortedBadges.filter(b => b.category === 'impact'),
    streak: sortedBadges.filter(b => b.category === 'streak'),
    engagement: sortedBadges.filter(b => b.category === 'engagement'),
    milestone: sortedBadges.filter(b => b.category === 'milestone'),
    special: sortedBadges.filter(b => b.category === 'special'),
  };

  const categoryLabels = {
    tier: "🏆 Tier Badges",
    impact: "✅ Impact Badges",
    streak: "🔥 Streak Badges",
    engagement: "❤️ Engagement Badges",
    milestone: "🎯 Milestone Badges",
    special: "⭐ Special Badges",
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedCount = earnedBadges.length;
  const totalCount = availableBadges.length;

  const openBadgeDetail = (badge, earned, progress, tier) => {
    setSelectedBadge({ badge, earned, progress, tier });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBadge(null);
  };

  return (
    <>
      {/* Badge Detail Modal */}
      <BadgeDetailModal
        isOpen={modalOpen}
        onClose={closeModal}
        badge={selectedBadge?.badge}
        earned={selectedBadge?.earned}
        progress={selectedBadge?.progress}
        tier={selectedBadge?.tier}
      />

      <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Your Badges
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              <Star className="w-3 h-3 mr-1" />
              {earnedCount}/{totalCount} Earned
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collection Progress</span>
            <span className="font-medium text-primary">{Math.round((earnedCount / totalCount) * 100) || 0}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 text-center border border-blue-200/50">
            <p className="text-2xl font-bold text-blue-600">{progress.complaintsSubmitted}</p>
            <p className="text-xs text-muted-foreground">Complaints</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-lg p-3 text-center border border-green-200/50">
            <p className="text-2xl font-bold text-green-600">{progress.complaintsResolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 text-center border border-purple-200/50">
            <p className="text-2xl font-bold text-purple-600">{progress.upvotesReceived || 0}</p>
            <p className="text-xs text-muted-foreground">Upvotes</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg p-3 text-center border border-orange-200/50">
            <p className="text-2xl font-bold text-orange-600">{progress.currentStreak || 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>

        {/* Badge Cards by Category */}
        {Object.entries(categorizedBadges).map(([category, badges]) => {
          if (badges.length === 0) return null;
          
          return (
            <div key={category} className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {categoryLabels[category]}
                <Badge variant="outline" className="text-xs">
                  {badges.filter(b => earnedBadgeIds.includes(b.id)).length}/{badges.length}
                </Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {badges.map((badge, index) => {
                  const isEarned = earnedBadgeIds.includes(badge.id);
                  const badgeProgress = getBadgeProgress(badge, progress);
                  const tier = badge.tier || "basic";
                  
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <BadgeCard
                        badge={badge}
                        earned={isEarned}
                        progress={badgeProgress}
                        tier={tier}
                        onClick={() => openBadgeDetail(badge, isEarned, badgeProgress, tier)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state - Show preview cards */}
        {availableBadges.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-4 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Start earning badges!</p>
              <p className="text-sm">Submit complaints and engage with the community to unlock badges.</p>
            </div>
            
            {/* Preview locked badges */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 opacity-50">
              {[
                { icon: "🥉", name: "Bronze Contributor", desc: "10+ complaints" },
                { icon: "🥈", name: "Silver Contributor", desc: "25+ complaints" },
                { icon: "🥇", name: "Gold Contributor", desc: "50+ complaints" },
              ].map((preview, i) => (
                <div key={i} className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 text-center">
                  <span className="text-2xl">{preview.icon}</span>
                  <p className="font-medium text-sm mt-2">{preview.name}</p>
                  <p className="text-xs text-muted-foreground">{preview.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      </Card>
    </>
  );
};

// Badge Card Component
const BadgeCard = ({ badge, earned, progress, tier, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const tierStyles = {
    platinum: "border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30",
    gold: "border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30",
    silver: "border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30",
    bronze: "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    basic: "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30",
  };

  const tierBadgeStyles = {
    platinum: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    gold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    silver: "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
    bronze: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    basic: "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300",
  };

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer",
        earned 
          ? tierStyles[tier] || tierStyles.basic
          : "border-border/50 bg-card/50 opacity-80",
        isHovered && earned && "shadow-lg scale-[1.02]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={earned ? { y: -2 } : {}}
    >
      {/* Earned badge indicator */}
      {earned && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        {/* Badge Icon */}
        <div className="flex-shrink-0">
          <BadgeDisplay badge={badge} earned={earned} progress={progress} size="lg" />
        </div>

        {/* Badge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-semibold text-sm">{badge.name}</h5>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", tierBadgeStyles[tier])}>
              {tier}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {badge.description}
          </p>

          {/* Progress bar for locked badges */}
          {!earned && progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
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

          {/* Benefits */}
          {badge.benefits && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                <Zap className="w-3 h-3" />
                <span>Benefits</span>
              </div>
              <p className={cn(
                "text-[10px] mt-0.5 line-clamp-2",
                earned ? "text-foreground" : "text-muted-foreground"
              )}>
                {badge.benefits}
              </p>
            </div>
          )}

          {/* Lock indicator */}
          {!earned && progress === 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Badge Detail Modal Component
const BadgeDetailModal = ({ isOpen, onClose, badge, earned, progress, tier }) => {
  if (!badge) return null;

  const tierStyles = {
    platinum: { bg: "from-indigo-500 to-purple-600", text: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700" },
    gold: { bg: "from-yellow-400 to-amber-500", text: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700" },
    silver: { bg: "from-slate-400 to-gray-500", text: "text-slate-600", badge: "bg-slate-100 text-slate-700" },
    bronze: { bg: "from-amber-500 to-orange-600", text: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
    basic: { bg: "from-gray-400 to-gray-500", text: "text-gray-600", badge: "bg-gray-100 text-gray-700" },
  };

  const style = tierStyles[tier] || tierStyles.basic;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <Card className="border-2 shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className={cn(
                "relative bg-gradient-to-br p-6 text-white",
                earned ? style.bg : "from-gray-400 to-gray-500"
              )}>
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Badge icon */}
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    {badge.icon && badge.icon.length <= 2 ? (
                      <span className="text-4xl">{badge.icon}</span>
                    ) : (
                      <Award className="w-8 h-8" />
                    )}
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold">{badge.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn("text-xs", style.badge)}>
                        {tier.toUpperCase()}
                      </Badge>
                      {earned ? (
                        <Badge className="bg-green-500 text-white text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-white border-white/50 text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-5">
                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>

                {/* Unlock Criteria */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Unlock Criteria</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {badge.requirement === 'complaintsSubmitted' && `Submit ${badge.value} complaints`}
                    {badge.requirement === 'complaintsResolved' && `Have ${badge.value} complaints resolved`}
                    {badge.requirement === 'upvotesReceived' && `Receive ${badge.value} upvotes`}
                    {badge.requirement === 'currentStreak' && `Maintain a ${badge.value}-day activity streak`}
                    {badge.requirement === 'longestStreak' && `Maintain a ${badge.value}-day longest streak`}
                    {badge.requirement === 'leaderboardRank' && `Reach Top ${badge.value} on leaderboard`}
                    {badge.requirement === 'trustScore' && `Achieve ${badge.value}% trust score`}
                  </p>
                </div>

                {/* Progress (for locked badges) */}
                {!earned && progress > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Progress</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* Government Benefits */}
                {badge.benefits && (
                  <div className="border-2 border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="w-5 h-5 text-primary" />
                      <span className="font-bold text-foreground">🎁 Government Benefits</span>
                    </div>
                    <ul className="space-y-2">
                      {badge.benefits.split('+').map((benefit, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className={cn(earned ? "text-foreground" : "text-muted-foreground")}>
                            {benefit.trim()}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Stats */}
                {earned && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Earned</p>
                      <p className="text-sm font-semibold">Active</p>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <Shield className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-semibold">Verified</p>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded-lg">
                      <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Tier</p>
                      <p className="text-sm font-semibold capitalize">{tier}</p>
                    </div>
                  </div>
                )}

                {/* CTA for locked badges */}
                {!earned && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-center text-muted-foreground">
                      Keep engaging with the community to unlock this badge!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BadgesSection;
