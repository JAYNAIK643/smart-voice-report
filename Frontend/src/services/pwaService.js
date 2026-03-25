/**
 * Mobile Experience Enhancement - PWA Service Worker Registration
 * Progressive Web App initialization with fail-safe design
 */

/**
 * Register service worker for PWA capabilities
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export const registerServiceWorker = async () => {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported in this browser');
    return null;
  }

  // Feature flag check
  const enablePWA = import.meta.env.VITE_ENABLE_PWA !== 'false';
  if (!enablePWA) {
    console.log('PWA features disabled via feature flag');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('✅ Service Worker registered successfully');

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🔄 New service worker found, installing...');

      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('✨ New content is available; please refresh.');
          
          // Show update notification to user
          if (window.confirm('New version available! Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_OFFLINE_COMPLAINTS') {
        console.log('📥 Received sync request from service worker');
        // Trigger sync in the app
        import('./offlineService').then(({ syncOfflineComplaints }) => {
          syncOfflineComplaints();
        });
      }
    });

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service worker controller changed');
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    // Fail silently - app continues to work without PWA features
    return null;
  }
};

/**
 * Unregister service worker (for debugging/testing)
 * @returns {Promise<boolean>}
 */
export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister service worker:', error);
    return false;
  }
};

/**
 * Check if app is running as PWA
 * @returns {boolean}
 */
export const isPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Request background sync permission (for offline complaint sync)
 * @returns {Promise<boolean>}
 */
export const requestBackgroundSync = async () => {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-offline-complaints');
    console.log('✅ Background sync registered');
    return true;
  } catch (error) {
    console.error('❌ Background sync registration failed:', error);
    return false;
  }
};

/**
 * Show install prompt for PWA
 * @param {Event} deferredPrompt - The beforeinstallprompt event
 * @returns {Promise<boolean>}
 */
export const showInstallPrompt = async (deferredPrompt) => {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return false;
  }

  try {
    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    return outcome === 'accepted';
  } catch (error) {
    console.error('Failed to show install prompt:', error);
    return false;
  }
};

/**
 * Check if app can be installed
 * @returns {boolean}
 */
export const canInstall = () => {
  return !isPWA() && 'BeforeInstallPromptEvent' in window;
};

// Auto-register service worker on load (non-blocking)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    registerServiceWorker().catch(error => {
      console.error('Service worker registration failed on load:', error);
    });
  });
}
