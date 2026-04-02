/**
 * API Configuration - Mobile & Network Compatibility
 * Centralized API URL configuration for cross-device compatibility
 * 
 * Usage:
 * import { API_BASE_URL, apiFetch } from '@/config/api';
 * 
 * const response = await apiFetch('/api/grievances', { method: 'POST', body: data });
 */

// Get API URL from environment variable with fallback
const getApiUrl = () => {
  // Vite uses import.meta.env instead of process.env
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback for development
  return 'http://localhost:3000';
};

// Base API URL
export const API_BASE_URL = getApiUrl();

// Helper function to make API calls with proper error handling
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    throw error;
  }
};

// Helper for authenticated API calls
export const authApiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  
  return apiFetch(endpoint, authOptions);
};

export default {
  API_BASE_URL,
  apiFetch,
  authApiFetch,
};
