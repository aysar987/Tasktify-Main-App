const CACHE_NAME = 'tugasin-cache-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './css/style.css',
  './js/app.js',
  './js/state.js',
  './js/data.js',
  './js/icons.js',
  './js/components/topbar.js',
  './js/components/bottomnav.js',
  './js/components/providerCard.js',
  './js/components/taskCard.js',
  './js/components/chatRow.js',
  './js/components/infoRow.js',
  './js/components/quickButton.js',
  './js/pages/login.js',
  './js/pages/register.js',
  './js/pages/verify.js',
  './js/pages/forgot.js',
  './js/pages/reset.js',
  './js/pages/home.js',
  './js/pages/market.js',
  './js/pages/freelancer.js',
  './js/pages/activity.js',
  './js/pages/requestTask.js',
  './js/pages/taskSubmitted.js',
  './js/pages/taskAccepted.js',
  './js/pages/orderCanceled.js',
  './js/pages/chat.js',
  './js/pages/chatThread.js',
  './js/pages/profile.js',
  './js/pages/createMarketplace.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
