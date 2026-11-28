/* Sababa Tours – service worker (PWA)
   - app shell + static assets work offline
   - pages: network first, falls back to the cached app, then /offline.html
   - API / Firebase / payment calls are NEVER cached (cross-origin non-image requests pass straight through)
   Bump VERSION to force every visitor to refresh the caches. */
const VERSION = "sababa-v5";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const IMAGES = `${VERSION}-images`;
const SHELL_URLS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  "/logo-day.png",
  "/logo-night.png",
];
const IMAGE_HOSTS = ["images.unsplash.com", "randomuser.me"];
const MAX_IMAGES = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => Promise.all(SHELL_URLS.map((u) => cache.add(u).catch(() => {})))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [SHELL, ASSETS, IMAGES];
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put("/", res.clone()); // every route is the same SPA shell
    return res;
  } catch (err) {
    return (await cache.match("/")) || (await cache.match("/offline.html")) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && (res.ok || res.type === "opaque")) {
    cache.put(request, res.clone());
    if (cacheName === IMAGES) trim(IMAGES, MAX_IMAGES);
  }
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const net = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!/^https?:$/.test(url.protocol)) return;
  if (url.pathname.startsWith("/__/")) return; // Firebase auth handler: never cache or intercept

  // page navigations
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // photos from the allowed hosts (destination pictures, avatars)
  if (url.origin !== self.location.origin) {
    if (request.destination === "image" && IMAGE_HOSTS.includes(url.hostname)) {
      event.respondWith(cacheFirst(request, IMAGES).catch(() => Response.error()));
    }
    return; // API, Firebase, Google etc: network only
  }

  // same-origin
  if (url.pathname.startsWith("/static/")) {
    event.respondWith(cacheFirst(request, ASSETS)); // hashed file names: safe to keep forever
    return;
  }
  event.respondWith(staleWhileRevalidate(request, ASSETS));
});
