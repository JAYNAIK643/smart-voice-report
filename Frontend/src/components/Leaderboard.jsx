import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Heart, FileText, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { apiService } from "@/services/apiService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const Leaderboard = ({ className }) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overall");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await apiService.getLeaderboard("all");
      
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
          previousRank: user.previousRank || index + 1,
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
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getRankBg = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 via-gray-300/10 to-transparent border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent border-orange-500/30";
      default:
        return "bg-card border-border/50 hover:border-primary/30";
    }
  };

  const getRankChangeIcon = (change) => {
    if (change > 0) {
      return (
        <motion.div
          initial={{ y: -5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-0.5 text-success text-xs"
        >
          <ChevronUp className="h-3 w-3" />
          <span>{change}</span>
        </motion.div>
      );
    } else if (change < 0) {
      return (
        <motion.div
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-0.5 text-destructive text-xs"
        >
          <ChevronDown className="h-3 w-3" />
          <span>{Math.abs(change)}</span>
        </motion.div>
      );
    }
    return (
      <div className="flex items-center text-muted-foreground text-xs">
        <Minus className="h-3 w-3" />
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  if (loading) {
    return (
      <section className={cn("py-16 md:py-24", className)}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <Card className="max-w-2xl mx-auto p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 mb-3 rounded-lg" />
            ))}
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("py-16 md:py-24 bg-muted/30", className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Community Champions</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Citizen <span className="text-primary">Leaderboard</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Recognizing our most active community members who are making a difference.
          </p>
        </motion.div>

        {/* Leaderboard Card */}
        <Card className="max-w-3xl mx-auto overflow-hidden border-border/50 shadow-card">
          <Tabs defaultValue="overall" className="w-full">
            <div className="border-b border-border/50 bg-muted/30 px-6 py-4">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-background/50">
                <TabsTrigger
                  value="overall"
                  onClick={() => setActiveTab("overall")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Trophy className="h-4 w-4 mr-1.5" />
                  Overall
                </TabsTrigger>
                <TabsTrigger
                  value="complaints"
                  onClick={() => setActiveTab("complaints")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Reports
                </TabsTrigger>
                <TabsTrigger
                  value="upvotes"
                  onClick={() => setActiveTab("upvotes")}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Heart className="h-4 w-4 mr-1.5" />
                  Upvotes
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overall" className="p-0 m-0">
              <LeaderboardList
                contributors={contributors.sort((a, b) => b.score - a.score)}
                sortKey="score"
                containerVariants={containerVariants}
                itemVariants={itemVariants}
                getRankIcon={getRankIcon}
                getRankBg={getRankBg}
                getRankChangeIcon={getRankChangeIcon}
              />
            </TabsContent>

            <TabsContent value="complaints" className="p-0 m-0">
              <LeaderboardList
                contributors={[...contributors].sort((a, b) => b.complaints_count - a.complaints_count)}
                sortKey="complaints_count"
                containerVariants={containerVariants}
                itemVariants={itemVariants}
                getRankIcon={getRankIcon}
                getRankBg={getRankBg}
                getRankChangeIcon={getRankChangeIcon}
              />
            </TabsContent>

            <TabsContent value="upvotes" className="p-0 m-0">
              <LeaderboardList
                contributors={[...contributors].sort((a, b) => b.upvotes_received - a.upvotes_received)}
                sortKey="upvotes_received"
                containerVariants={containerVariants}
                itemVariants={itemVariants}
                getRankIcon={getRankIcon}
                getRankBg={getRankBg}
                getRankChangeIcon={getRankChangeIcon}
              />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8"
        >
          {[
            { icon: Users, label: "Active Citizens", value: contributors.length },
            { icon: FileText, label: "Total Reports", value: contributors.reduce((a, b) => a + b.complaints_count, 0) },
            { icon: Heart, label: "Total Upvotes", value: contributors.reduce((a, b) => a + b.upvotes_received, 0) },
            { icon: TrendingUp, label: "Resolved Issues", value: contributors.reduce((a, b) => a + b.resolved_count, 0) },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const LeaderboardList = ({
  contributors,
  sortKey,
  containerVariants,
  itemVariants,
  getRankIcon,
  getRankBg,
  getRankChangeIcon,
}) => {
  if (contributors.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No contributors yet. Be the first!</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="divide-y divide-border/50"
    >
      {contributors.map((contributor, index) => (
        <motion.div
          key={contributor.user_id}
          variants={itemVariants}
          className={cn(
            "flex items-center gap-4 px-6 py-4 transition-all",
            getRankBg(index + 1)
          )}
        >
          {/* Rank */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background/50">
            {getRankIcon(index + 1)}
          </div>

          {/* Avatar */}
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {`C${index + 1}`}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate">
                {contributor.name || `Citizen #${contributor.user_id.slice(0, 8)}`}
              </p>
              {index < 3 && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  Top Contributor
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {contributor.complaints_count} reports
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {contributor.upvotes_received} upvotes
              </span>
            </div>
          </div>

          {/* Score & Rank Change */}
          <div className="text-right">
            <motion.p
              key={contributor.score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-lg font-bold text-foreground"
            >
              {sortKey === "score"
                ? contributor.score
                : sortKey === "complaints_count"
                ? contributor.complaints_count
                : contributor.upvotes_received}
            </motion.p>
            {getRankChangeIcon(contributor.rankChange)}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Leaderboard;
