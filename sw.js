// A unique name for the cache
const CACHE_NAME = 'torid-ai-pwa-cache-v1';

// List of files that make up the "app shell"
const appShellFiles = [
  '/',
  '/index.html',
  '/index.tsx',
  // NOTE: External resources from CDNs will be cached on first use via the 'fetch' event handler
];

// The install event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(appShellFiles);
    })
  );
});

// The activate event is fired when the service worker is activated.
// This is a good place to clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// The fetch event is fired for every network request.
// We'll use a "cache-first" strategy.
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // If we got a valid response, clone it and put it in the cache.
        if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(error => {
        console.error('[Service Worker] Fetch failed; returning offline page if available.', error);
        // You could return a custom offline page here if you had one cached.
      });

      // Return the cached response if it exists, otherwise wait for the network response.
      return cachedResponse || fetchPromise;
    })
  );
});
