import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Medal, Award, Crown, TrendingUp, Users, Heart, 
  FileText, ChevronUp, ChevronDown, Minus, Star, Target,
  Flame, Calendar, ArrowUpRight, RefreshCw, ChevronLeft, ChevronRight
} from "lucide-react";
import { apiService } from "@/services/apiService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useBadges } from "@/context/badges-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RewardBanner from "@/components/RewardBanner";

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all"); // "all", "month", "week"
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchLeaderboard();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && contributors.length > 0) {
      const userRank = contributors.findIndex(c => c.user_id === user.id);
      setCurrentUserRank(userRank >= 0 ? userRank + 1 : null);
    }
  }, [user, contributors]);

  // Reset to first page when timeframe changes
  useEffect(() => {
    setCurrentPage(1);
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLeaderboard(timeframe);
      
      if (response.success && response.data.leaderboard) {
        const leaderboardData = response.data.leaderboard.map((user, index) => ({
          user_id: user.userId,
          name: user.name || `Citizen #${user.userId.slice(0, 8)}`, // Use name from API, fallback to Citizen #id
          complaints_count: user.complaintsCount,
          upvotes_received: user.upvotesReceived,
          resolved_count: user.resolvedCount,
          score: user.score,
          rank: index + 1,
          rankChange: user.rankChange || 0,
          level: Math.floor(user.score / 100) + 1,
          nextLevelProgress: (user.score % 100),
        }));
        setContributors(leaderboardData);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent border-yellow-500/40";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 via-gray-300/10 to-transparent border-gray-400/40";
      case 3:
        return "bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent border-orange-500/40";
      default:
        return "bg-card hover:bg-muted/50 border-border/50";
    }
  };

  const getRankChangeIcon = (change) => {
    if (change > 0) {
      return (
        <motion.div
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-0.5 text-success text-sm font-medium"
        >
          <ChevronUp className="h-4 w-4" />
          <span>{change}</span>
        </motion.div>
      );
    } else if (change < 0) {
      return (
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-0.5 text-destructive text-sm font-medium"
        >
          <ChevronDown className="h-4 w-4" />
          <span>{Math.abs(change)}</span>
        </motion.div>
      );
    }
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Minus className="h-4 w-4" />
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Trophy className="h-5 w-5" />
              <span className="font-medium">Community Champions</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Citizen <span className="text-primary">Leaderboard</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recognizing our most active community members who make our city better every day.
            </p>
          </motion.div>

          {/* Current User Rank Card */}
          {user && currentUserRank && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-md mx-auto mt-8"
            >
              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Your Current Rank</p>
                    <p className="text-2xl font-bold text-foreground">#{currentUserRank}</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    Top {Math.round((currentUserRank / contributors.length) * 100)}%
                  </Badge>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-8 border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, label: "Active Citizens", value: contributors.length, color: "text-primary" },
              { icon: FileText, label: "Total Reports", value: contributors.reduce((a, b) => a + b.complaints_count, 0), color: "text-secondary" },
              { icon: Heart, label: "Total Upvotes", value: contributors.reduce((a, b) => a + b.upvotes_received, 0), color: "text-destructive" },
              { icon: Target, label: "Issues Resolved", value: contributors.reduce((a, b) => a + b.resolved_count, 0), color: "text-success" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className={cn("h-8 w-8 mx-auto mb-2", stat.color)} />
                <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Grand Reward Banner */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <RewardBanner />
          </div>
        </div>
      </section>

      {/* Main Leaderboard */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full sm:w-auto">
                <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-muted">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Trophy className="h-4 w-4 mr-1.5" />
                    All Time
                  </TabsTrigger>
                  <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    This Month
                  </TabsTrigger>
                  <TabsTrigger value="week" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Flame className="h-4 w-4 mr-1.5" />
                    This Week
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Leaderboard List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : contributors.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Contributors Yet</h3>
                <p className="text-muted-foreground">Be the first to submit a complaint and appear on the leaderboard!</p>
              </Card>
            ) : (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {contributors
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((contributor, index) => (
                  <motion.div
                    key={contributor.user_id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 p-4 transition-all",
                      getRankBg(index + 1),
                      user?.id === contributor.user_id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex flex-col items-center justify-center w-14 gap-1">
                        {getRankIcon(index + 1)}
                        {getRankChangeIcon(contributor.rankChange)}
                      </div>

                      {/* Avatar & Level */}
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-primary/30">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                            {`C${index + 1}`}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                          Lv.{contributor.level}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground truncate">
                            {user?.id === contributor.user_id ? "You" : contributor.name || `Citizen #${contributor.user_id.slice(0, 8)}`}
                          </p>
                          {index < 3 && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Top Contributor
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {contributor.complaints_count} reports
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {contributor.upvotes_received} upvotes
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5" />
                            {contributor.resolved_count} resolved
                          </span>
                        </div>
                        {/* Level Progress */}
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={contributor.nextLevelProgress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {contributor.nextLevelProgress}/100 XP
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <motion.p
                          key={contributor.score}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="text-2xl font-bold text-foreground"
                        >
                          {contributor.score.toLocaleString()}
                        </motion.p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {contributors.length > itemsPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.ceil(contributors.length / itemsPerPage) },
                        (_, i) => i + 1
                      ).map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(Math.ceil(contributors.length / itemsPerPage), p + 1)
                        )
                      }
                      disabled={currentPage === Math.ceil(contributors.length / itemsPerPage)}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* How Scoring Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">How Scoring Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Earn points by being an active community member. Here's how the scoring system works:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { 
                icon: FileText, 
                title: "Submit Reports", 
                points: "+10 pts", 
                description: "Earn 10 points for every complaint you submit" 
              },
              { 
                icon: Heart, 
                title: "Receive Upvotes", 
                points: "+5 pts", 
                description: "Get 5 points when others upvote your complaints" 
              },
              { 
                icon: Target, 
                title: "Issues Resolved", 
                points: "+15 pts", 
                description: "Earn 15 bonus points when your issue is resolved" 
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center h-full border-border/50 hover:border-primary/30 transition-colors">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <Badge className="bg-success/10 text-success border-success/20 mb-3">
                    {item.points}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LeaderboardPage;
