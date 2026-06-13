const CACHE_NAME = "gov-support25-site-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./category.html",
  "./policy.html",
  "./about.html",
  "./terms.html",
  "./privacy.html",
  "./styles.css",
  "./desktop.css",
  "./site-data.js",
  "./site.js",
  "./manifest.webmanifest",
  "./assets/claim-desk-hero.svg",
  "./assets/illustration-support.svg",
  "./assets/illustration-refund.svg",
  "./assets/illustration-loan.svg",
  "./assets/icon-government-support25.svg",
  "./assets/logo-government-support25.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
