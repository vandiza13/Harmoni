// ============================================================
// HARMONI — Service Worker
// Handles: caching, offline fallback, push notifications
// ============================================================

const CACHE_NAME = "harmoni-v1";
const STATIC_CACHE = "harmoni-static-v1";
const API_CACHE = "harmoni-api-v1";

// Static assets to pre-cache
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  "/api/health",
];

// ─── Install ───────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("SW: Failed to cache some assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, non-http
  if (
    request.method !== "GET" ||
    !request.url.startsWith("http") ||
    url.protocol === "chrome-extension:"
  ) {
    return;
  }

  // API routes: network first, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Next.js static assets: cache first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages: network first with offline fallback
  if (request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: network first
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// ─── Strategies ────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page
    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Harmoni — Offline</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center;
                 min-height: 100vh; margin: 0; background: #F9FBF8; color: #263238; }
          .container { text-align: center; padding: 2rem; }
          .emoji { font-size: 3rem; margin-bottom: 1rem; }
          h1 { font-size: 1.5rem; font-weight: 700; color: #4CAF50; }
          p { color: #607D8B; margin-top: 0.5rem; }
          button { margin-top: 1rem; padding: 0.75rem 1.5rem; background: #4CAF50;
                   color: white; border: none; border-radius: 12px; font-weight: 600;
                   cursor: pointer; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="emoji">📡</div>
          <h1>Tidak Ada Koneksi</h1>
          <p>Harmoni membutuhkan koneksi internet untuk bekerja.</p>
          <p>Periksa koneksi internet kamu dan coba lagi.</p>
          <button onclick="window.location.reload()">Coba Lagi</button>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

// ─── Push Notifications ────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Harmoni", body: event.data.text() };
  }

  const options = {
    body: data.body || data.message,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/dashboard" },
    actions: data.actions || [],
    tag: data.tag || "harmoni-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Harmoni", options)
  );
});

// ─── Notification click ────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});

// ─── Background sync ──────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(syncOfflineTransactions());
  }
});

async function syncOfflineTransactions() {
  // TODO: sync queued offline transactions
  console.log("SW: Syncing offline transactions...");
}
