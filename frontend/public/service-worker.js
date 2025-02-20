const CACHE_NAME = 'cred-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

const API_CACHE_NAME = 'cred-api-cache-v1';
const API_BASE_URL = '/api';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Helper function to check if a request is an API call
const isApiRequest = (request) => {
  return request.url.includes(API_BASE_URL);
};

// Helper function to check if we're online
const isOnline = () => {
  return self.navigator.onLine;
};

// Helper function to serialize the request as a cache key
const createCacheKey = (request) => {
  const headers = Array.from(request.headers.entries())
    .filter(([key]) => key === 'authorization')
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  return `${request.url}|${headers}`;
};

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(isApiRequest(event.request) ? API_CACHE_NAME : CACHE_NAME);
      
      try {
        // Try to fetch from network first
        const response = await fetch(event.request);
        
        // Cache successful responses
        if (response.ok) {
          if (isApiRequest(event.request)) {
            const cacheKey = createCacheKey(event.request);
            await cache.put(cacheKey, response.clone());
          } else {
            await cache.put(event.request, response.clone());
          }
        }
        
        return response;
      } catch (error) {
        // If offline, try to get from cache
        const cacheKey = isApiRequest(event.request) ? createCacheKey(event.request) : event.request;
        const cachedResponse = await cache.match(cacheKey);
        
        if (cachedResponse) {
          // Add offline indicator to the response
          const data = await cachedResponse.json();
          return new Response(JSON.stringify({
            ...data,
            isOffline: true,
            cachedAt: cachedResponse.headers.get('cached-at') || new Date().toISOString()
          }), {
            headers: {
              'Content-Type': 'application/json',
              'X-Is-Offline': 'true'
            }
          });
        }
        
        // If not in cache, return offline fallback
        if (event.request.mode === 'navigate') {
          return cache.match('/offline.html');
        }
        
        throw error;
      }
    })()
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
