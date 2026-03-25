import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { apiService } from "@/services/apiService";
import { useAuth } from "@/context/auth-context";

const ComplaintsContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case "SET_COMPLAINTS": {
      return {
        ...state,
        complaints: action.payload,
      };
    }
    case "ADD_COMPLAINT": {
      return {
        ...state,
        complaints: [action.payload, ...state.complaints],
      };
    }
    case "UPDATE_COMPLAINT": {
      const { complaintId, patch } = action.payload;
      return {
        ...state,
        complaints: state.complaints.map((c) =>
          c.complaintId === complaintId
            ? { ...c, ...patch, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    }
    default:
      return state;
  }
}

export function ComplaintsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { complaints: [] });
  const [loading, setLoading] = useState(true);
  const { isManagement } = useAuth();

  // Fetch grievances from MongoDB backend on mount
  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
          setLoading(false);
          return;
        }

        // Management (Admin/Ward Admin) fetches ALL grievances (filtered on backend), regular users fetch only their own
        const response = isManagement 
          ? await apiService.getAllGrievances()
          : await apiService.getMyGrievances();
          
        if (response.success) {
          dispatch({ type: "SET_COMPLAINTS", payload: response.data });
        }
      } catch (error) {
        console.error("Error fetching grievances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, [isManagement]);

  const value = useMemo(() => {
    const complaints = state.complaints;

    const addComplaint = (complaint) => {
      dispatch({ type: "ADD_COMPLAINT", payload: complaint });
    };

    const updateComplaint = (complaintId, patch) => {
      dispatch({ type: "UPDATE_COMPLAINT", payload: { complaintId, patch } });
    };

    const updateGrievanceStatus = async (grievanceId, status, priority = null) => {
      try {
        // Update on backend
        const response = await apiService.updateGrievanceStatus(grievanceId, status, priority);
        
        if (response.success) {
          // Update local state immediately for instant UI feedback
          dispatch({ 
            type: "UPDATE_COMPLAINT", 
            payload: { 
              complaintId: response.data.grievance.complaintId, 
              patch: { 
                status: response.data.grievance.status,
                priority: response.data.grievance.priority,
                updatedAt: response.data.grievance.updatedAt
              } 
            } 
          });
          
          // Trigger refetch to ensure all dashboard stats are updated
          await refetchComplaints();
          
          return response;
        }
      } catch (error) {
        console.error("Error updating grievance status:", error);
        throw error;
      }
    };

    const getComplaintById = (complaintId) =>
      complaints.find((c) => c.complaintId === complaintId) || null;

    const refetchComplaints = async () => {
      try {
        // Management (Admin/Ward Admin) fetches ALL grievances, regular users fetch only their own
        const response = isManagement
          ? await apiService.getAllGrievances()
          : await apiService.getMyGrievances();
          
        if (response.success) {
          dispatch({ type: "SET_COMPLAINTS", payload: response.data });
        }
      } catch (error) {
        console.error("Error refetching grievances:", error);
      }
    };

    return {
      complaints,
      addComplaint,
      updateComplaint,
      updateGrievanceStatus,
      getComplaintById,
      refetchComplaints,
      loading,
    };
  }, [state.complaints, loading, isManagement]);

  return (
    <ComplaintsContext.Provider value={value}>
      {children}
    </ComplaintsContext.Provider>
  );
}

export function useComplaints() {
  const ctx = useContext(ComplaintsContext);
  if (!ctx) throw new Error("useComplaints must be used within ComplaintsProvider");
  return ctx;
}
