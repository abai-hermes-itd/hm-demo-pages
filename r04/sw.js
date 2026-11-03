/* CAM-MEAS-R04 service worker (R04-0.3): lets the test page open without the PC server.
 * Research only. Page: network first (so updates arrive when the server is up), cache fallback.
 * POST /trial and POST /photo are never touched: when offline they fail and the page keeps the data
 * (localStorage for trials, IndexedDB for photos) until "Отправить неотправленные". */
const CACHE = "cam-meas-r04-0.4";
const BASE = self.registration.scope; // e.g. http://localhost:5174/ or https://user.github.io/repo/
const PAGE = BASE;
const ASSET_PATHS = ["manifest.webmanifest", "icon-192.png", "icon-512.png"].map((a) => new URL(a, BASE).pathname);
const ASSETS = ["manifest.webmanifest", "icon-192.png", "icon-512.png"].map((a) => new URL(a, BASE).href);
const PAGE_PATHS = [new URL(BASE).pathname, new URL("index.html", BASE).pathname];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(new Request(PAGE, { cache: "reload" })).then(() => c.addAll(ASSETS))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (ASSET_PATHS.includes(url.pathname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
    return;
  }
  if (PAGE_PATHS.includes(url.pathname)) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(PAGE, copy)); }
        return res;
      }).catch(() => caches.match(PAGE).then((r) => r || new Response("Нет сохранённой копии страницы. Откройте её один раз при запущенном сервере.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }))),
    );
  }
});
