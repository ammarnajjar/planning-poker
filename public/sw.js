// Planning Poker Service Worker
// Native implementation following Angular's recommendation to use browser APIs directly

// Increment this version number whenever you deploy to force cache refresh
const CACHE_VERSION = 'v1.2.4';
const CACHE_NAME = `planning-poker-${CACHE_VERSION}`;

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.webmanifest'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version:', CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('planning-poker-') && name !== CACHE_NAME)
            .map(name => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    // For Supabase and external APIs, use network-first strategy
    if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com')) {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  // For same-origin requests, use different strategies based on resource type

  // API calls - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (JS, CSS, images) - cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - stale-while-revalidate
  if (request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - network first
  event.respondWith(networkFirst(request));
});

// Cache-first strategy: Try cache, fallback to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    throw error;
  }
}

// Network-first strategy: Try network, fallback to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Only cache GET requests (Cache API doesn't support POST/PATCH/DELETE)
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    // Only try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    throw error;
  }
}

// Stale-while-revalidate: Return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// Message handler for update checks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
    // Trigger update check
    self.registration.update();
  }
});

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Planning Poker';
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
