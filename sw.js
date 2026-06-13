const CACHE_NAME = "gov-support25-site-v21";
const ASSETS = [
  "./",
  "./index.html",
  "./category.html",
  "./policy.html",
  "./about.html",
  "./terms.html",
  "./privacy.html",
  "./styles.css?v=4",
  "./desktop.css",
  "./manifest.webmanifest",
  "./assets/claim-desk-hero.svg",
  "./assets/hero-phone-main.jpg?v=1",
  "./assets/hero-phone-hq-loader.js?v=1",
  "./assets/hero-phone-hq-01.txt?v=1",
  "./assets/hero-phone-hq-02.txt?v=1",
  "./assets/hero-phone-hq-03.txt?v=1",
  "./assets/hero-phone-hq-04.txt?v=1",
  "./assets/hero-phone-hq-05.txt?v=1",
  "./assets/hero-phone-hq-06.txt?v=1",
  "./assets/hero-phone-hq-07.txt?v=1",
  "./assets/hero-phone-hq-08.txt?v=1",
  "./assets/hero-phone-hq-09.txt?v=1",
  "./assets/illustration-support.svg",
  "./assets/illustration-refund.svg",
  "./assets/illustration-loan.svg",
  "./assets/icon-government-support25.svg?v=2",
  "./assets/logo-government-support25.svg?v=2",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const networkFirst =
    url.pathname.startsWith("/api/") ||
    url.pathname.endsWith("/site.js") ||
    url.pathname.endsWith("/site-data.js") ||
    event.request.mode === "navigate";

  if (networkFirst) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
