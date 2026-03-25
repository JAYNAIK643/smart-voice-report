import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'sonner';

// NOTE: Supabase removed - notifications now use local state only
// TODO: Implement backend API for notifications if needed

const NotificationsContext = createContext(undefined);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    in_app_enabled: true,
    email_enabled: true,
    push_enabled: false,
    sound_enabled: true,
  });
  const { user } = useAuth();
  const audioContextRef = useRef(null);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!preferences.sound_enabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(830, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      setTimeout(() => {
        const oscillator2 = ctx.createOscillator();
        const gainNode2 = ctx.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(ctx.destination);

        oscillator2.frequency.setValueAtTime(1046, ctx.currentTime);
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0, ctx.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        oscillator2.start(ctx.currentTime);
        oscillator2.stop(ctx.currentTime + 0.4);
      }, 100);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [preferences.sound_enabled]);

  // Show browser push notification
  const showPushNotification = useCallback((title, message) => {
    if (!preferences.push_enabled || Notification.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'smartcity-notification',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show push notification:', error);
    }
  }, [preferences.push_enabled]);

  // Handle new notification arrival
  const handleNewNotification = useCallback((notification) => {
    // Show toast notification
    if (preferences.in_app_enabled) {
      const toastType = notification.type === 'error' ? 'error' 
        : notification.type === 'warning' ? 'warning'
        : notification.type === 'success' ? 'success'
        : 'info';

      toast[toastType](notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }

    // Play sound
    playNotificationSound();

    // Show push notification
    showPushNotification(notification.title, notification.message);
  }, [preferences.in_app_enabled, playNotificationSound, showPushNotification]);

  // Fetch user preferences - now uses local storage
  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      // Load from localStorage
      const stored = localStorage.getItem(`notif_prefs_${user.id}`);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, [user]);

  // Update preference - now uses local storage
  const updatePreference = useCallback(async (key, value) => {
    if (!user) return;

    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    try {
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Error updating preference:', error);
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  }, [user, preferences]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      // Load from localStorage for now
      const stored = localStorage.getItem(`notifications_${user.id}`);
      setNotifications(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
        if (user) localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        if (user) localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notifications and preferences when user changes
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // Realtime subscription removed - Supabase no longer used
  // TODO: Implement WebSocket or polling for real-time notifications if needed
  useEffect(() => {
    // No realtime subscription without Supabase
  }, [user, handleNewNotification]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      loading,
      unreadCount,
      preferences,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      updatePreference,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
