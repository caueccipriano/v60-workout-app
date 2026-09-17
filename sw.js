const CACHE = 'v60-v8';
const ASSETS = ['./','./index.html','./styles.css','./exercise-guides.css','./exercise-guides-v3.css','./app.js','./exercise-guides.js','./exercise-guides-v3.js','./manifest.json','./assets/icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request,{cache:'no-store'}).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});