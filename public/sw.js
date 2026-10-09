// Offline support: keep a copy of every page and file the game has loaded,
// so a case keeps working without a connection once it has been opened.
const CACHE = "dead-signal-v1";
const PRECACHE = ["/", "/play", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Pages: try the network first so updates show up, fall back to the copy.
  // Everything else: use the copy first, it never changes between builds.
  const fromNetwork = () =>
    fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    });
  if (req.mode === "navigate") {
    e.respondWith(fromNetwork().catch(() => caches.match(req).then((r) => r || caches.match("/"))));
  } else {
    e.respondWith(caches.match(req).then((r) => r || fromNetwork()));
  }
});
