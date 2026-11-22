// Cambia il numero di versione ogni volta che aggiorni i file dell'app.
const V = "finanze-v38";
const FILES = ["./", "index.html", "style.css", "app.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  "fonts/Poppins-Regular.ttf", "fonts/Poppins-Medium.ttf", "fonts/Poppins-SemiBold.ttf", "fonts/Poppins-Bold.ttf", "fonts/Poppins-ExtraBold.ttf"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(res => {
    const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
