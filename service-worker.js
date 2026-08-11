// Bump this whenever any cached file changes, so clients pick up the update.
const CACHE_VERSION = 'img2pdf-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/styles.css',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './js/utils.js',
  './js/pdf-lib.min.js',
  './js/app.js',
  './components/ui.js',
  './components/dragdrop.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first for the app shell, falling back to network, and caching
// same-origin GET requests as they come in so the app keeps working offline
// even for files not explicitly pre-cached above.
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline and not cached — for navigations, fall back to the app shell.
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        });
    })
  );
});
