const CACHE = 'traco-v6';
const ASSETS = ['./','./index.html','./styles.css','./exercise-guides.css','./exercise-guides-v4.css','./v60-personal-progress.css','./v60-aesthetic-core.css','./v60-smart-sequence.css','./traco-brand.css','./traco-theme.css','./app.js','./exercise-guides.js','./exercise-guides-v4.js','./exercise-videos.js','./v60-personal-progress.js','./v60-aesthetic-core.js','./v60-smart-sequence.js','./traco-brand.js','./manifest.json','./assets/icon.svg','./assets/traco-icon-180.png','./assets/traco-icon-192.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).catch(() => caches.match(event.request)));
});