
const CACHE_NAME = 'calculadora-v1';
const urlsToCache = ["./", "./index.html", "./styles.css", "./app.js", "./sweetalert2.min.css", "./sweetalert2.min.js", "./calculator.png", "./manifest.json"];

self.addEventListener('install', event => {
  // Instalar: Descargar archivos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Interceptar peticiones: Servir desde caché si no hay internet
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Devolver caché
        }
        return fetch(event.request); // O intentar internet
      })
  );
});
