// Offline support: keep a copy of every page and file the game has loaded,
// so a case keeps working without a connection once it has been opened.
const CACHE = "dead-signal-v3";
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
  // Build files (/_next/static/) have a new name in every version, so the copy
  // is always right: use it first. Everything else (pages, pictures) can change
  // under the same name: get the latest when online, use the copy when offline.
  const fromNetwork = () =>
    // A page request can't be re-sent with options, so fetch it by its address.
    fetch(req.mode === "navigate" ? req.url : req, { cache: "no-cache" }).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    });
  if (new URL(req.url).pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((r) => r || fromNetwork()));
  } else {
    const fallback = req.mode === "navigate" ? caches.match("/") : undefined;
    e.respondWith(fromNetwork().catch(() => caches.match(req).then((r) => r || fallback)));
  }
});
