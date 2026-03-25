import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/apiService";

export const useFeedback = (complaintId = null) => {
  const [feedback, setFeedback] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalFeedback: 0,
    averageTimeliness: 0,
    positivePercent: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch feedback for a specific complaint
  const fetchComplaintFeedback = useCallback(async () => {
    if (!complaintId) return;

    try {
      const response = await apiService.getComplaintFeedback(complaintId);
      setFeedback(response.data);
    } catch (error) {
      console.error("Error fetching complaint feedback:", error);
      setFeedback(null);
    }
  }, [complaintId]);

  // Fetch all feedback with stats
  const fetchAllFeedback = useCallback(async () => {
    try {
      const response = await apiService.getAllFeedback();
      
      if (response.success) {
        // Map feedback to include user names for display
        const mappedFeedback = (response.data.feedback || []).map(f => ({
          id: f._id,
          complaintId: f.complaintId,
          userId: f.userId._id,
          userName: f.userId.name,
          userEmail: f.userId.email,
          rating: f.rating,
          timelinessRating: f.timelinessRating,
          comment: f.comment,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        }));
        
        setAllFeedback(mappedFeedback);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching all feedback:", error);
      setAllFeedback([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user should see feedback modal for resolved complaints
  const checkPendingFeedback = useCallback(async () => {
    try {
      const response = await apiService.checkPendingFeedback();
      return response.data;
    } catch (error) {
      console.error("Error checking pending feedback:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (complaintId) {
      fetchComplaintFeedback();
    } else {
      fetchAllFeedback();
    }
  }, [complaintId, fetchComplaintFeedback, fetchAllFeedback]);

  return {
    feedback,
    allFeedback,
    stats,
    loading,
    refetch: complaintId ? fetchComplaintFeedback : fetchAllFeedback,
    checkPendingFeedback
  };
};

export default useFeedback;
