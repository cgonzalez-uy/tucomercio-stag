const CACHE_NAME = 'tucomercio-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Solo manejamos solicitudes GET
  if (event.request.method !== 'GET') {
    return;
  }

  // No cacheamos solicitudes a Firebase o solicitudes que requieren autenticación
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('www.googleapis.com') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('auth') ||
      event.request.headers.has('range')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si encontramos una coincidencia en el caché, la devolvemos
        if (response) {
          return response;
        }

        // Si no está en caché, hacemos la solicitud a la red
        return fetch(event.request)
          .then((response) => {
            // Si la respuesta no es válida, la devolvemos tal cual
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonamos la respuesta porque se va a consumir tanto por el navegador como por el caché
            const responseToCache = response.clone();

            // Agregamos la respuesta al caché
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Solo cacheamos recursos estáticos
                if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          });
      })
      .catch(() => {
        // Si falla la red, intentamos devolver una versión cacheada
        return caches.match(event.request);
      })
  );
});
