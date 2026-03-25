import { useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useBadges } from "@/context/badges-context";
import { apiService } from "@/services/apiService";

/**
 * Hook to check and award upvote-related badges
 * - Rising Voice: Received 5 upvotes
 * - Community Champion: Received 25 upvotes
 * - Civic Hero: Received 100 upvotes
 * - Active Voter: Upvoted 10 complaints
 * - Community Supporter: Upvoted 50 complaints
 * 
 * NOTE: Supabase removed - now uses MongoDB backend API
 */
export const useUpvoteBadges = () => {
  const { user } = useAuth();
  const { availableBadges, earnedBadges } = useBadges();

  const checkAndAwardBadges = useCallback(async () => {
    if (!user) return [];

    try {
      // Get user stats from backend API
      const statsResponse = await apiService.getUserStats();
      
      if (!statsResponse.success) return [];

      const totalUpvotesReceived = statsResponse.data?.totalUpvotesReceived || 0;
      const totalUpvotesGiven = statsResponse.data?.totalUpvotesGiven || 0;

      // Get already earned badge IDs
      const earnedBadgeIds = new Set(earnedBadges.map((eb) => eb.badge_id || eb.badgeId));

      // Find badges to award
      const badgesToAward = availableBadges.filter((badge) => {
        if (earnedBadgeIds.has(badge.id || badge._id)) return false;

        if (
          badge.requirement_type === "upvotes_received" &&
          totalUpvotesReceived >= badge.requirement_value
        ) {
          return true;
        }

        if (
          badge.requirement_type === "upvotes_given" &&
          totalUpvotesGiven >= badge.requirement_value
        ) {
          return true;
        }

        return false;
      });

      // Badge awarding would be done through backend API
      // For now, just return badges that should be awarded
      return badgesToAward;
    } catch (error) {
      console.error("Error checking upvote badges:", error);
      return [];
    }
  }, [user, availableBadges, earnedBadges]);

  // Check badges periodically (no realtime without Supabase)
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkAndAwardBadges();

    // Poll every 30 seconds instead of realtime
    const interval = setInterval(checkAndAwardBadges, 30000);

    return () => clearInterval(interval);
  }, [user, checkAndAwardBadges]);

  return { checkAndAwardBadges };
};

export default useUpvoteBadges;
