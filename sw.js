const CACHE_NAME = 'galvanissa-precios-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim(); // Tomar control de los clientes inmediatamente
        })
    );
});

// Estrategia: Stale-While-Revalidate
// 1. Sirve la caché INMEDIATAMENTE (rápido y funciona offline).
// 2. Va a la red en segundo plano para actualizar la caché para la PRÓXIMA vez.
self.addEventListener('fetch', event => {
    // Ignorar peticiones que no sean GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Si hay caché, la devolvemos YA. Si no, vamos a la red.
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // Clonamos y guardamos la nueva versión en caché
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si falla la red y no teníamos caché, no podemos hacer nada (o mostrar página offline genérica)
            });

            // Devolver caché si existe, si no, esperar a la red
            return cachedResponse || fetchPromise;
        })
    );
});

