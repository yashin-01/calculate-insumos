const CACHE_NAME = 'calculadora-insumos-v2';
const urlsToCache = ["./", "./index.html", "./styles.css", "./app.js", "./sweetalert2.min.css", "./sweetalert2.min.js", "./favicon-32x32.png", "./android-chrome-192x192.png", "./manifest.json"];

// Instalación: Cachear archivos
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Archivos cacheados exitosamente');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activar inmediatamente
  );
});

// Activación: Limpiar cachés antiguas
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estrategia "Cache First" (ideal para apps offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Servir desde caché
        }
        // Si no está en caché, intentar red
        return fetch(event.request).then(fetchResponse => {
          // Cachear nuevas peticiones exitosas
          if (fetchResponse && fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        // Fallback si no hay red ni caché
        console.log('[SW] Sin conexión y sin caché para:', event.request.url);
      })
  );
});
