import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

// NOTE: Supabase removed - now uses localStorage

const DEFAULT_PREFERENCES = {
  in_app_enabled: true,
  email_enabled: true,
  push_enabled: false,
  sound_enabled: true,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    setLoading(true);
    try {
      // Load from localStorage
      const stored = localStorage.getItem(`notif_prefs_${user.id}`);
      if (stored) {
        setPreferences(JSON.parse(stored));
      } else {
        // Save default preferences
        localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(DEFAULT_PREFERENCES));
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreference = useCallback(async (key, value) => {
    if (!user) return;

    // Optimistic update
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    try {
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Error updating notification preference:', error);
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  }, [user, preferences]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    updatePreference,
    refetch: fetchPreferences,
  };
}
