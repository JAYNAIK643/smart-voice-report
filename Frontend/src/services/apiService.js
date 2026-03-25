// MongoDB Backend API service
const API_URL = "http://localhost:3000/api";

const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const apiService = {
  // User Profile & Stats
  getUserProfile: async () => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch profile");
      return data;
    } catch (error) {
      console.error("getUserProfile error:", error);
      throw error;
    }
  },

  getUserBadges: async () => {
    try {
      const response = await fetch(`${API_URL}/users/badges`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch badges");
      return data;
    } catch (error) {
      console.error("getUserBadges error:", error);
      throw error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await fetch(`${API_URL}/users/stats`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch stats");
      return data;
    } catch (error) {
      console.error("getUserStats error:", error);
      throw error;
    }
  },

  // Leaderboard
  getLeaderboard: async (timeframe = "all") => {
    try {
      const response = await fetch(`${API_URL}/leaderboard?timeframe=${timeframe}`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch leaderboard");
      return data;
    } catch (error) {
      console.error("getLeaderboard error:", error);
      throw error;
    }
  },

  getLeaderboardStats: async (timeframe = "all") => {
    try {
      const response = await fetch(`${API_URL}/leaderboard/stats?timeframe=${timeframe}`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch leaderboard stats");
      return data;
    } catch (error) {
      console.error("getLeaderboardStats error:", error);
      throw error;
    }
  },

  // Grievances
  createGrievance: async (grievanceData) => {
    try {
      const response = await fetch(`${API_URL}/grievances`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(grievanceData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create grievance");
      return data;
    } catch (error) {
      console.error("createGrievance error:", error);
      throw error;
    }
  },

  getMyGrievances: async () => {
    try {
      const response = await fetch(`${API_URL}/grievances/my`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch grievances");
      return data;
    } catch (error) {
      console.error("getMyGrievances error:", error);
      throw error;
    }
  },

  getAllGrievances: async () => {
    try {
      const response = await fetch(`${API_URL}/grievances`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch all grievances");
      return data;
    } catch (error) {
      console.error("getAllGrievances error:", error);
      throw error;
    }
  },

  updateGrievanceStatus: async (grievanceId, status, priority = null) => {
    try {
      const body = { status };
      if (priority) body.priority = priority;
      
      const response = await fetch(`${API_URL}/grievances/${grievanceId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update grievance status");
      return data;
    } catch (error) {
      console.error("updateGrievanceStatus error:", error);
      throw error;
    }
  },

  upvoteGrievance: async (grievanceId) => {
    try {
      const headers = getAuthHeaders();
      console.log(`📡 Sending upvote request to: ${API_URL}/grievances/${grievanceId}/upvote`);
      console.log(`📋 Request headers:`, headers);
      
      const response = await fetch(`${API_URL}/grievances/${grievanceId}/upvote`, {
        method: "POST",
        headers: headers,
      });
      
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response ok: ${response.ok}`);
      
      const data = await response.json();
      console.log(`📥 Response data:`, data);
      
      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}: Failed to upvote`);
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      console.error("💥 upvoteGrievance error:", error);
      throw error;
    }
  },

  getGrievanceById: async (complaintId) => {
    try {
      // Public endpoint - no authentication needed
      const response = await fetch(`${API_URL}/grievances/id/${complaintId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch grievance");
      return data;
    } catch (error) {
      console.error("getGrievanceById error:", error);
      throw error;
    }
  },

  getRecentActivity: async (limit = 10) => {
    try {
      const response = await fetch(`${API_URL}/users/recent-activity?limit=${limit}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch recent activity");
      return data;
    } catch (error) {
      console.error("getRecentActivity error:", error);
      throw error;
    }
  },

  // Admin Dashboard Stats
  getAdminDashboardStats: async () => {
    try {
      const response = await fetch(`${API_URL}/grievances/admin/stats`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch admin stats");
      return data;
    } catch (error) {
      console.error("getAdminDashboardStats error:", error);
      throw error;
    }
  },

  // Admin User Management
  getAllUsers: async (role = null) => {
    try {
      const url = role ? `${API_URL}/admin/users?role=${role}` : `${API_URL}/admin/users`;
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch users");
      return data;
    } catch (error) {
      console.error("getAllUsers error:", error);
      throw error;
    }
  },

  assignUserRole: async (userId, role, ward = null) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/assign-role`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, ward }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to assign role");
      return data;
    } catch (error) {
      console.error("assignUserRole error:", error);
      throw error;
    }
  },

  toggleUserStatus: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/toggle-status/${userId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to toggle status");
      return data;
    } catch (error) {
      console.error("toggleUserStatus error:", error);
      throw error;
    }
  },

  // Public Complaints
  getPublicComplaints: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${API_URL}/grievances/public?${queryString}` : `${API_URL}/grievances/public`;
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch public complaints");
      return data;
    } catch (error) {
      console.error("getPublicComplaints error:", error);
      throw error;
    }
  },

  // Feedback
  submitFeedback: async (feedbackData) => {
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(feedbackData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit feedback");
      return data;
    } catch (error) {
      console.error("submitFeedback error:", error);
      throw error;
    }
  },

  getAllFeedback: async () => {
    try {
      const response = await fetch(`${API_URL}/feedback/all`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch feedback");
      return data;
    } catch (error) {
      console.error("getAllFeedback error:", error);
      throw error;
    }
  },

  getComplaintFeedback: async (complaintId) => {
    try {
      const response = await fetch(`${API_URL}/feedback/${complaintId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        // Return null if no feedback found, don't throw error
        if (response.status === 404) return { success: true, data: null };
        throw new Error(data.message || "Failed to fetch complaint feedback");
      }
      return data;
    } catch (error) {
      console.error("getComplaintFeedback error:", error);
      throw error;
    }
  },

  checkPendingFeedback: async () => {
    try {
      const response = await fetch(`${API_URL}/feedback/pending`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to check pending feedback");
      return data;
    } catch (error) {
      console.error("checkPendingFeedback error:", error);
      throw error;
    }
  },

  skipFeedback: async (complaintId) => {
    try {
      const response = await fetch(`${API_URL}/feedback/skip`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ complaintId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to skip feedback");
      return data;
    } catch (error) {
      console.error("skipFeedback error:", error);
      throw error;
    }
  },

  // Ward Admin Management
  createWardAdminInvitation: async (invitationData) => {
    try {
      const response = await fetch(`${API_URL}/ward-admin/invite`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(invitationData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send invitation");
      return data;
    } catch (error) {
      console.error("createWardAdminInvitation error:", error);
      throw error;
    }
  },

  getPendingInvitations: async () => {
    try {
      const response = await fetch(`${API_URL}/ward-admin/invitations`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch invitations");
      return data;
    } catch (error) {
      console.error("getPendingInvitations error:", error);
      throw error;
    }
  },

  resendWardAdminInvitation: async (invitationId) => {
    try {
      const response = await fetch(`${API_URL}/ward-admin/invitations/${invitationId}/resend`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to resend invitation");
      return data;
    } catch (error) {
      console.error("resendWardAdminInvitation error:", error);
      throw error;
    }
  },

  getWardComplaints: async () => {
    try {
      const response = await fetch(`${API_URL}/ward-admin/complaints`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch ward complaints");
      return data;
    } catch (error) {
      console.error("getWardComplaints error:", error);
      throw error;
    }
  },

  updateNotificationPreferences: async (preferences) => {
    try {
      const response = await fetch(`${API_URL}/users/preferences`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update preferences");
      return data;
    } catch (error) {
      console.error("updateNotificationPreferences error:", error);
      throw error;
    }
  },

  // Advanced Analytics
  getGrievanceTrends: async (range = "monthly", startDate = null, endDate = null) => {
    try {
      let url = `${API_URL}/analytics/trends?range=${range}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("getGrievanceTrends error:", error);
      return { success: false, data: [] };
    }
  },

  getWardPerformance: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/ward-performance`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("getWardPerformance error:", error);
      return { success: false, data: [] };
    }
  },

  getResolutionTimeAnalytics: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/resolution-time`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("getResolutionTimeAnalytics error:", error);
      return { success: false, data: [] };
    }
  },

  getCategoryCorrelation: async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/category-correlation`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("getCategoryCorrelation error:", error);
      return { success: false, data: [] };
    }
  },

  // Enhanced Analytics for Reports
  getEnhancedAnalytics: async (timeframe = "1y") => {
    try {
      const response = await fetch(`${API_URL}/analytics/enhanced?timeframe=${timeframe}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch analytics");
      return data;
    } catch (error) {
      console.error("getEnhancedAnalytics error:", error);
      return { success: false, data: null };
    }
  },
};
