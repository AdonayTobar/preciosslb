importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

workbox.setConfig({ debug: false });

// Cachea todo lo estático con Stale-while-revalidate (perfecto para GitHub Pages)
// NOTA: Usamos NetworkFirst para navegación para asegurar que siempre se intente bajar la última versión
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: 'paginas',
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200]  // importante: acepta respuestas opaque (GitHub Pages)
            })
        ]
    })
);

// Cachea CSS, JS, imágenes, fuentes → Cache First
workbox.routing.registerRoute(
    /\.(?:css|js|png|jpg|jpeg|svg|gif|woff2|woff|ttf)$/,
    new workbox.strategies.CacheFirst({
        cacheName: 'assets',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
            }),
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200]
            })
        ]
    })
);

// Fallback offline: si todo falla, muestra tu index.html
workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.mode === 'navigate') {
        return caches.match('index.html');
    }
    return Response.error();
});

// Forzar que el SW tome control inmediatamente el control
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());




