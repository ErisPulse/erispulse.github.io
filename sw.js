const CACHE_NAME = 'erispulse-v2.1.0';
const EXTERNAL_LIBS = [
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/'
];

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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = event.request.url;
  
  // 检查是否为外部库
  const isExternalLib = EXTERNAL_LIBS.some(lib => requestUrl.startsWith(lib));
  
  // 检查是否为本地资源
  const isLocalResource = !requestUrl.startsWith('http') || 
    requestUrl.includes(self.location.hostname) ||
    requestUrl.startsWith('/') && !requestUrl.startsWith('//');
  
  if (isExternalLib) {
    // 对于外部库，使用缓存优先策略
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // 如果缓存中有，直接返回缓存内容
          if (response) {
            return response;
          }
          // 否则发起网络请求，并将结果添加到缓存中
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            });
        })
    );
  } else if (isLocalResource) {
    // 对于本地资源，使用网络优先策略
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 如果网络请求成功，更新缓存
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // 如果网络请求失败，使用缓存
          return caches.match(event.request);
        })
    );
  }
  // 对于其他请求，使用网络优先，失败后使用缓存的常规策略
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});