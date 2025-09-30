const CACHE = "toolbox-v2";
const CORE_ASSETS = [
  "/styles/every.css",
  "/styles/theme.css",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];
const SHELL_URL = "/";
const ASTRO_BUNDLE_REGEX = /["'](\/_astro\/[^"']+\.(?:css|js))(?:\?[^"']*)?["']/g;

function shouldCache(request, response) {
  return (
    request.url.startsWith(self.location.origin) &&
    response &&
    response.ok &&
    ["style", "script", "font"].includes(request.destination)
  );
}

async function precacheShell(cache) {
  try {
    const response = await fetch(SHELL_URL, { cache: "no-cache" });
    if (!response || !response.ok) return;

    await cache.put(SHELL_URL, response.clone());
    const html = await response.text();
    const bundleUrls = new Set();
    let match;
    while ((match = ASTRO_BUNDLE_REGEX.exec(html)) !== null) {
      bundleUrls.add(match[1]);
    }
    if (bundleUrls.size === 0) return;
    await Promise.all(
      Array.from(bundleUrls, url => cache.add(url).catch(err => console.warn(`Failed to cache ${url}`, err)))
    );
  } catch (err) {
    console.warn("Service worker failed to precache shell assets", err);
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE_ASSETS);
    await precacheShell(cache);
  })());
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch (err) {
          const cached = await caches.match(request);
          return cached || caches.match(SHELL_URL);
        }
      })()
    );
    return;
  }

  const respondFromNetwork = async () => {
    try {
      const response = await fetch(request);
      if (shouldCache(request, response)) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (err) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw err;
    }
  };

  event.respondWith(caches.match(request).then(cached => cached || respondFromNetwork()));
});
