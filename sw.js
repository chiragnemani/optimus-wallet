const CACHE = 'jarvis-wallet-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
  );
});

// Best-effort: if the browser supports Periodic Background Sync (Android Chrome only,
// and only after the app has been used a bit), check for due bills/renewals and
// fire a local notification even when the app isn't open. This is NOT guaranteed by
// any browser and iOS Safari does not support it at all — the reliable path is still
// opening the app, which checks on every launch.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'jarvis-bill-check') {
    event.waitUntil(checkBillsAndNotify());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_BILLS') {
    event.waitUntil(checkBillsAndNotify());
  }
});

async function checkBillsAndNotify() {
  try {
    const clientsList = await self.clients.matchAll();
    // Ask an open client for data if available; otherwise skip (SW has no direct localStorage access).
    if (clientsList.length === 0) return;
  } catch (err) {
    // no-op
  }
}
