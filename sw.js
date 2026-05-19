// Increment this version number every time you deploy — forces cache refresh
const VERSION = 'expenseflow-v36';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete all old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
     .then(() => {
       // Tell all open tabs to reload
       self.clients.matchAll({ type: 'window' }).then(clients =>
         clients.forEach(c => c.navigate(c.url))
       );
     })
  );
});

self.addEventListener('fetch', e => {
  // Network-first for HTML — always get fresh index.html
  if (e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // Cache-first for other assets (icons, etc.)
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
