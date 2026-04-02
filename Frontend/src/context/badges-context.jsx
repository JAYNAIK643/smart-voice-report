import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { apiService } from "@/services/apiService";

const BadgesContext = createContext(undefined);

export const BadgesProvider = ({ children }) => {
  const { user } = useAuth();
  const [availableBadges, setAvailableBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [newBadge, setNewBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAvailableBadges = useCallback(async () => {
    try {
      const response = await apiService.getUserBadges();
      if (response.success && response.data.availableBadges) {
        setAvailableBadges(response.data.availableBadges);
      }
    } catch (error) {
      console.error("Error fetching available badges:", error);
    }
  }, []);

  const fetchEarnedBadges = useCallback(async () => {
    if (!user) {
      setEarnedBadges([]);
      return;
    }

    try {
      const response = await apiService.getUserBadges();
      if (response.success && response.data.earnedBadges) {
        setEarnedBadges(response.data.earnedBadges);
      }
    } catch (error) {
      console.error("Error fetching earned badges:", error);
      setEarnedBadges([]);
    }
  }, [user]);

  const getUserProgress = useCallback(async () => {
    if (!user) return { 
      complaintsSubmitted: 0, 
      complaintsResolved: 0, 
      upvotesReceived: 0, 
      upvotesGiven: 0,
      currentStreak: 0,
      longestStreak: 0,
      leaderboardRank: 999,
      trustScore: 0
    };

    try {
      const response = await apiService.getUserStats();
      if (response.success && response.data) {
        return {
          complaintsSubmitted: response.data.complaintsSubmitted || 0,
          complaintsResolved: response.data.complaintsResolved || 0,
          upvotesReceived: response.data.upvotesReceived || 0,
          upvotesGiven: response.data.upvotesGiven || 0,
          currentStreak: response.data.currentStreak || 0,
          longestStreak: response.data.longestStreak || 0,
          leaderboardRank: response.data.leaderboardRank || 999,
          trustScore: response.data.trustScore || 0,
        };
      }
    } catch (error) {
      console.error("Error fetching user progress:", error);
    }

    return { 
      complaintsSubmitted: 0, 
      complaintsResolved: 0, 
      upvotesReceived: 0, 
      upvotesGiven: 0,
      currentStreak: 0,
      longestStreak: 0,
      leaderboardRank: 999,
      trustScore: 0
    };
  }, [user]);

  const checkForNewBadges = useCallback(async () => {
    if (!user) return;
    await fetchEarnedBadges();
  }, [user, fetchEarnedBadges]);

  const dismissNewBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  useEffect(() => {
    fetchAvailableBadges();
  }, [fetchAvailableBadges]);

  useEffect(() => {
    if (user) {
      fetchEarnedBadges();
      setLoading(false);
    } else {
      setEarnedBadges([]);
      setLoading(false);
    }
  }, [user, fetchEarnedBadges]);

  // Subscribe to real-time badge updates (disabled for MongoDB)
  // MongoDB backend handles badge updates automatically
  useEffect(() => {
    // Real-time updates handled by polling or WebSocket if needed
    // For now, we refetch on user change
  }, [user]);

  const hasBadge = useCallback((badgeName) => {
    return earnedBadges.some(eb => eb.name === badgeName || eb.badge?.name === badgeName);
  }, [earnedBadges]);

  const getBadgeProgress = useCallback((badge, progress) => {
    if (!badge) return 0;
    
    let current = 0;
    const requirementField = badge.requirement || badge.requirement_type;
    
    if (requirementField === 'complaints_submitted' || requirementField === 'complaintsSubmitted') {
      current = progress.complaintsSubmitted;
    } else if (requirementField === 'complaints_resolved' || requirementField === 'complaintsResolved') {
      current = progress.complaintsResolved;
    } else if (requirementField === 'upvotes_received' || requirementField === 'upvotesReceived') {
      current = progress.upvotesReceived || 0;
    } else if (requirementField === 'upvotes_given' || requirementField === 'upvotesGiven') {
      current = progress.upvotesGiven || 0;
    } else if (requirementField === 'currentStreak') {
      current = progress.currentStreak || 0;
    } else if (requirementField === 'longestStreak') {
      current = progress.longestStreak || 0;
    } else if (requirementField === 'leaderboardRank') {
      // For leaderboard rank, lower is better, so invert the progress
      const rank = progress.leaderboardRank || 999;
      current = rank <= badge.value ? badge.value : 0;
      return rank <= badge.value ? 100 : Math.max(0, Math.min(100, ((badge.value - rank + 50) / badge.value) * 100));
    } else if (requirementField === 'trustScore') {
      current = progress.trustScore || 0;
    }
    
    const targetValue = badge.value || badge.requirement_value;
    return Math.min((current / targetValue) * 100, 100);
  }, []);

  return (
    <BadgesContext.Provider
      value={{
        availableBadges,
        earnedBadges,
        newBadge,
        loading,
        hasBadge,
        getBadgeProgress,
        getUserProgress,
        checkForNewBadges,
        dismissNewBadge,
        refreshBadges: fetchEarnedBadges
      }}
    >
      {children}
    </BadgesContext.Provider>
  );
};

export const useBadges = () => {
  const context = useContext(BadgesContext);
  if (context === undefined) {
    throw new Error("useBadges must be used within a BadgesProvider");
  }
  return context;
};
