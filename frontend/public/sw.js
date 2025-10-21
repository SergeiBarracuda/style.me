const CACHE_NAME = 'beauty-marketplace-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/styles/globals.css'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching essential assets');
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (error) {
        console.error('[Service Worker] Precaching failed:', error);
      }
    })()
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');

  event.waitUntil(
    (async () => {
      // Enable navigation preload if supported
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests from different origins (like Google Maps API)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try to get the response from cache first
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);

          // Update cache in the background (stale-while-revalidate strategy)
          event.waitUntil(
            (async () => {
              try {
                const networkResponse = await fetch(event.request);
                if (networkResponse && networkResponse.status === 200) {
                  await cache.put(event.request, networkResponse.clone());
                }
              } catch (error) {
                // Network update failed, but we already served from cache
                console.log('[Service Worker] Background update failed:', error);
              }
            })()
          );

          return cachedResponse;
        }

        // Not in cache, try network
        console.log('[Service Worker] Fetching from network:', event.request.url);
        const networkResponse = await fetch(event.request);

        // Cache successful responses for future use
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();

          // Don't cache API requests
          if (!event.request.url.includes('/api/')) {
            await cache.put(event.request, responseToCache);
          }
        }

        return networkResponse;
      } catch (error) {
        console.log('[Service Worker] Fetch failed, serving offline page:', error);

        // If both cache and network fail, show offline page for navigation requests
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          const offlineResponse = await cache.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }
        }

        // Return a simple offline response for other requests
        return new Response('Offline - No cached data available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      }
    })()
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Beauty Marketplace', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
