const cacheKey = 'currency-converter';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheKey).then((cache) => {
            return cache.addAll([
                '/public/css/style.css',
                '/public/js/preact.js',
                '/public/js/app.js',
                '/'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});