 
const CACHE_NAME = 'erispulse-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/home.css',
  '/assets/css/market.css',
  '/assets/css/docs.css',
  '/assets/css/setting.css',
  '/assets/css/about.css',
  '/assets/js/main.js',
  '/assets/img/logo.png',
  '/manifest.json'
];

 
self.addEventListener('fetch', event => {
   
  if (event.request.destination === 'document' || 
      event.request.destination === 'script' ||
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
           
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          });
          
          return response || fetchPromise;
        })
    );
  } 
   
  else if (event.request.destination === 'image') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
   
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});