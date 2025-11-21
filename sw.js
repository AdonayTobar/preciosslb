const CACHE_NAME = 'catalogo-v2'; // Incrementamos versión para forzar actualización
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js'
];

// Instalación: Cachear archivos estáticos
self.addEventListener('install', event => {
    // Forzar que este SW tome el control inmediatamente
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Archivos cacheados');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activación: Limpiar cachés viejas y tomar control
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
