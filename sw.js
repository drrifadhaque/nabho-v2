/* Nabho Bazaar — service worker
   Goal: app-like cold start. Shell + catalog cached, images cache-first,
   navigation network-first with offline fallback. */

const VERSION = 'nb-v2-2026-10-17';
const SHELL = `${VERSION}-shell`;
const IMAGES = `${VERSION}-img`;
const DATA = `${VERSION}-data`;

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/logo.webp',
  './assets/fragment-mono.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './data/products.json',
  './data/categories.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_FILES).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Product photos + category art: cache-first, fill on miss
  if (/\.(jpg|jpeg|png|webp|avif|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // Catalog JSON: stale-while-revalidate
  if (/\/data\/.*\.json$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(DATA).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Navigations: network-first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL);
          return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
        })
    );
    return;
  }

  // Everything else: cache-first with network fill
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).catch(() => hit || Response.error()))
  );
});

// Allow the page to trigger an immediate update
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
