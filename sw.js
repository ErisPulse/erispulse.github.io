// 更新 sw.js
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

// 添加动态缓存策略
self.addEventListener('fetch', event => {
  // 对于文档和重要资源使用 cache-first 策略
  if (event.request.destination === 'document' || 
      event.request.destination === 'script' ||
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // 返回缓存版本同时更新缓存
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
  // 对于图片等资源使用 network-first 策略
  else if (event.request.destination === 'image') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
  // 其他请求使用默认策略
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});