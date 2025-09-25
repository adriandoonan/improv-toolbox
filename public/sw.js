const CACHE = "toolbox-v1";
const ASSETS = [
  "/", "/styles/every.css", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
});

self.addEventListener("fetch", e => {
  const { request } = e;
  // network-first for html, cache-first for others
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).catch(() => caches.match("/")));
  } else {
    e.respondWith(
      caches.match(request).then(res => res || fetch(request))
    );
  }
});