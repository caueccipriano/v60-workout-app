const CACHE = 'traco-v76';
const ASSETS = [
  './','./index.html','./manifest.json',
  './styles.css','./exercise-guides.css','./exercise-guides-v4.css','./exercise-videos.css',
  './v60-personal-progress.css','./v60-aesthetic-core.css','./v60-smart-sequence.css',
  './traco-brand.css','./traco-theme.css','./traco-performance.css','./traco-gym-ux.css','./traco-coach.css','./traco-body-coach.css','./traco-lab.css','./traco-evolution.css','./traco-rest-background.css','./traco-runtime.css','./traco-ux-polish.css','./traco-menu-planner.css',
  './app.js','./exercise-guides.js','./exercise-guides-v4.js','./exercise-videos.js',
  './v60-personal-progress.js','./v60-aesthetic-core.js','./v60-smart-sequence.js',
  './traco-brand.js','./traco-performance.js','./traco-gym-ux.js','./eu-bridge.js','./traco-coach.js','./traco-body-coach.js','./traco-lab.js','./traco-evolution.js','./traco-rest-background.js','./traco-runtime.js','./traco-ux-polish.js','./traco-menu-planner.js',
  './privacy.html','./terms.html','./support.html','./assets/icon.svg','./assets/traco-icon-180-v2.png','./assets/traco-icon-192-v2.png','./assets/traco-icon-512-v2.png'
];

async function cacheFallback(request){
  return caches.match(request,{ignoreSearch:true}) || caches.match('./index.html',{ignoreSearch:true});
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);

  if(url.origin !== self.location.origin){
    event.respondWith(fetch(request));
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .then(response => {
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy)).catch(()=>{});
          return response;
        })
        .catch(() => caches.match('./index.html',{ignoreSearch:true}))
    );
    return;
  }

  event.respondWith(
    fetch(request,{cache:'no-store'})
      .then(response => {
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(() => caches.match(request,{ignoreSearch:true}))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const kind = event.notification?.data?.kind || 'rest-finished';
  const target = new URL(event.notification?.data?.url || (kind==='photo-checkin'?'./?photo_due=1':'./?rest_done=1'), self.location.href).href;
  const messageType = kind==='photo-checkin' ? 'TRACO_PHOTO_FOCUS' : 'TRACO_REST_FOCUS';
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (const client of clients) {
      try {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({type:messageType});
          return;
        }
      } catch (_) {}
    }
    if (self.clients.openWindow) {
      const opened = await self.clients.openWindow(target);
      try { opened?.postMessage?.({type:messageType}); } catch (_) {}
    }
  })());
});
