// SmartCity GRS Service Worker
// Progressive Web App capabilities with offline support

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `smartcity-grs-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Feature flag check - ENABLED for PWA functionality
// Can be disabled by setting VITE_ENABLE_PWA=false in .env
const PWA_ENABLED = true;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  if (!PWA_ENABLED) {
    console.log('PWA features disabled - skipping service worker installation');
    return;
  }

  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed', error);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (!PWA_ENABLED) {
    console.log('PWA features disabled - skipping service worker activation');
    return;
  }

  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('Service Worker: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (!PWA_ENABLED) {
    return; // Let browser handle fetch normally
  }

  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API calls (always fetch fresh)
  if (url.pathname.startsWith('/api/') || url.hostname === 'localhost:3000') {
    return;
  }

  // Network-first strategy for ALL requests to ensure fresh content
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache, then offline page
        return caches.match(request)
          .then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
      })
  );
});

// Background sync for offline complaint submissions
self.addEventListener('sync', (event) => {
  if (!PWA_ENABLED) {
    return;
  }

  if (event.tag === 'sync-offline-complaints') {
    console.log('Service Worker: Syncing offline complaints...');
    event.waitUntil(syncOfflineComplaints());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!PWA_ENABLED) {
    return;
  }

  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'You have a new update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('SmartCity GRS', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Helper function to sync offline complaints
async function syncOfflineComplaints() {
  try {
    // This will be called by the main app when online
    // The actual sync logic is in the offline service
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_COMPLAINTS'
      });
    });
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
