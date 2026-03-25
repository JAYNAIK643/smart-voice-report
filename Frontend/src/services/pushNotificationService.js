/**
 * Mobile Experience Enhancement - Push Notification Service
 * Browser-based push notifications with opt-in design
 * FEATURE FLAG: Can be disabled via VITE_ENABLE_PUSH_NOTIFICATIONS
 */

/**
 * Check if push notifications are supported and enabled
 */
export const isPushEnabled = () => {
  const enablePush = import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false';
  return enablePush && 'Notification' in window && 'PushManager' in window;
};

/**
 * Request push notification permission
 * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
 */
export const requestNotificationPermission = async () => {
  if (!isPushEnabled()) {
    console.log('Push notifications not supported or disabled');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
};

/**
 * Check current notification permission status
 * @returns {string} Permission status
 */
export const getNotificationPermission = () => {
  if (!isPushEnabled()) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Show local notification (doesn't require push subscription)
 * @param {Object} options - Notification options
 * @returns {Promise<Notification|null>}
 */
export const showLocalNotification = async ({ title, body, icon, tag, data }) => {
  if (!isPushEnabled()) {
    console.log('Push notifications disabled');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: tag || 'default',
      requireInteraction: false,
      data,
      vibrate: [200, 100, 200],
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();
      
      // Navigate to relevant page if data provided
      if (data?.url) {
        window.location.href = data.url;
      }
    };

    return notification;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
};

/**
 * Subscribe to push notifications
 * @param {string} vapidPublicKey - VAPID public key from backend
 * @returns {Promise<PushSubscription|null>}
 */
export const subscribeToPush = async (vapidPublicKey) => {
  if (!isPushEnabled()) {
    console.log('Push notifications not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      return existingSubscription;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('✅ Push subscription created');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>}
 */
export const unsubscribeFromPush = async () => {
  if (!isPushEnabled()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const result = await subscription.unsubscribe();
      console.log('Push subscription cancelled');
      return result;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
};

/**
 * Get current push subscription
 * @returns {Promise<PushSubscription|null>}
 */
export const getPushSubscription = async () => {
  if (!isPushEnabled() || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
};

/**
 * Send push subscription to backend
 * @param {PushSubscription} subscription - Push subscription object
 * @returns {Promise<Object>}
 */
export const savePushSubscription = async (subscription) => {
  if (!subscription) {
    return { success: false, message: 'No subscription provided' };
  }

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:3000/api/notifications/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Push subscription saved to backend');
      return { success: true, data: result };
    } else {
      console.error('Failed to save push subscription:', result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    // Fail silently - local notifications will still work
    return { success: false, error: error.message };
  }
};

/**
 * Show complaint status update notification
 * @param {Object} complaint - Complaint data
 * @param {string} status - New status
 */
export const notifyComplaintStatusUpdate = async (complaint, status) => {
  const statusMessages = {
    'pending': 'Your complaint is being reviewed',
    'in_progress': 'Work has started on your complaint',
    'resolved': 'Your complaint has been resolved!',
    'rejected': 'Your complaint status has been updated',
  };

  await showLocalNotification({
    title: 'Complaint Status Update',
    body: statusMessages[status] || 'Your complaint status has been updated',
    tag: `complaint-${complaint.complaintId}`,
    data: {
      url: `/track-complaint?id=${complaint.complaintId}`,
      complaintId: complaint.complaintId,
    },
  });
};

/**
 * Show offline sync notification
 * @param {number} count - Number of synced complaints
 */
export const notifyOfflineSync = async (count) => {
  await showLocalNotification({
    title: 'Complaints Synced',
    body: `Successfully submitted ${count} offline ${count === 1 ? 'complaint' : 'complaints'}`,
    tag: 'offline-sync',
  });
};

/**
 * Show badge earned notification
 * @param {Object} badge - Badge data
 */
export const notifyBadgeEarned = async (badge) => {
  await showLocalNotification({
    title: 'Achievement Unlocked! 🎉',
    body: `You earned the "${badge.name}" badge`,
    tag: 'badge-earned',
    data: {
      url: '/leaderboard',
    },
  });
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if user has opted in to notifications
 * @returns {boolean}
 */
export const hasNotificationOptIn = () => {
  const optIn = localStorage.getItem('notification_opt_in');
  return optIn === 'true' && getNotificationPermission() === 'granted';
};

/**
 * Save notification opt-in preference
 * @param {boolean} optIn - User's opt-in choice
 */
export const saveNotificationOptIn = (optIn) => {
  localStorage.setItem('notification_opt_in', optIn ? 'true' : 'false');
};
