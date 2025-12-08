const CACHE_NAME = 'looty-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://bienetrechien.com/wp-content/uploads/2025/12/Gemini_Generated_Image_zh832bzh832bzh83.png',
  'https://bienetrechien.com/wp-content/uploads/2025/08/Moov_Money_Flooz.png',
  'https://bienetrechien.com/wp-content/uploads/2025/08/Orange-Money-recrute-pour-ce-poste-22-Mars-2023.png',
  'https://bienetrechien.com/wp-content/uploads/2025/08/mtn-1.jpg',
  'https://bienetrechien.com/wp-content/uploads/2025/08/wave.png',
  'https://bienetrechien.com/wp-content/uploads/2025/08/mix-by-yass.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Handling navigation requests for SPA
        if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});