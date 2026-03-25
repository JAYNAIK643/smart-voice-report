import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, Calendar, Target, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/**
 * Advanced Engagement System - Challenge Board
 * Displays active community challenges with fail-safe loading
 */
const ChallengeBoard = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/engagement/challenges`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChallenges(data.data || []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching challenges:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      setJoiningId(challengeId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/engagement/challenges/${challengeId}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Successfully joined the challenge!");
        fetchChallenges(); // Refresh challenges
      } else {
        toast.error(data.message || "Failed to join challenge");
      }
    } catch (err) {
      console.error("Error joining challenge:", err);
      toast.error("Failed to join challenge");
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !challenges) {
    // Fail silently - don't break the UI
    return null;
  }

  if (challenges.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Community Challenges
          </CardTitle>
          <CardDescription>No active challenges at the moment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Check back later for new challenges!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Community Challenges
        </CardTitle>
        <CardDescription>Join challenges and compete with other citizens</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {challenges.map((challenge, index) => {
              const progress = Math.min(
                (challenge.currentValue / challenge.targetValue) * 100,
                100
              );
              const daysLeft = Math.ceil(
                (new Date(challenge.endDate) - new Date()) / (1000 * 60 * 60 * 24)
              );

              return (
                <motion.div
                  key={challenge.challengeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-border bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                        <Badge
                          variant={
                            challenge.type === "ward"
                              ? "default"
                              : challenge.type === "city"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {challenge.type === "ward" ? challenge.ward : "City-wide"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{challenge.participants?.length || 0} joined</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{daysLeft} days left</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Goal: {challenge.targetValue}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {challenge.currentValue} / {challenge.targetValue}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {challenge.rewards && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            {challenge.rewards.description}
                          </span>
                        </div>
                        {challenge.rewards.points && (
                          <Badge variant="outline" className="bg-amber-500/10">
                            +{challenge.rewards.points} pts
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleJoinChallenge(challenge.challengeId)}
                      disabled={joiningId === challenge.challengeId}
                    >
                      {joiningId === challenge.challengeId ? (
                        "Joining..."
                      ) : (
                        <>
                          Join Challenge
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeBoard;
