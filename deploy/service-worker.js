/**
 * Service Worker para Analizador de Gastos TC v3.2
 * Permite que la app funcione offline
 */

const CACHE_NAME = 'gastos-tc-v3.2.0';
const urlsToCache = [
  './index.html',
  './reset-completo.html',
  './manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antiguo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First, luego Cache (para CDN y recursos externos)
self.addEventListener('fetch', event => {
  const { request } = event;

  // Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // Para recursos externos (CDN), intentar red primero
  if (request.url.includes('cdn.') ||
      request.url.includes('unpkg.') ||
      request.url.includes('cdnjs.')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clonar la respuesta para cachear
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar caché
          return caches.match(request);
        })
    );
  } else {
    // Para archivos locales, usar Cache First
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
        .catch(() => {
          // Si todo falla, retornar página offline (opcional)
          if (request.destination === 'document') {
            return caches.match('./index.html');
          }
        })
    );
  }
});

// Manejar mensajes desde la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
