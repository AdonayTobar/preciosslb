// sw.js  –  Versión 100 % fiable incluso cerrando todo en móvil
const CACHE = 'galvanissa-precios-v3'; // Incrementamos versión

// TODOS los archivos que quieres que funcionen 100 % offline
const ARCHIVOS_OBLIGATORIOS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com', // Tailwind (si se puede cachear, aunque es externo)
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(ARCHIVOS_OBLIGATORIOS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    // Solo cacheamos GET
    if (e.request.method !== 'GET') {
        return;
    }

    e.respondWith(
        caches.match(e.request).then(cached => {
            // SI está en cache → lo devolvemos directamente (aunque no haya internet)
            if (cached) return cached;

            // SI no está en cache → intentamos red
            return fetch(e.request).catch(() => {
                // Si falla la red y es la página principal → devolvemos index.html
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});


