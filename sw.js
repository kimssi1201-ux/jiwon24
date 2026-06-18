const CACHE_NAME = "gov-support25-site-v120";
const ASSETS = [
  "./",
  "./styles.css?v=8",
  "./desktop.css",
  "./policy-detail.css?v=1",
  "./policy-detail.css?v=2",
  "./category-app-style.css?v=5",
  "./category-app-style.css?v=6",
  "./popular-filter-fix.css?v=1",
  "./popular-filter-fix.css?v=2",
  "./home-focus.css?v=2",
  "./deadline.js?v=2",
  "./deadline.js?v=3",
  "./deadline.js?v=4",
  "./deadline.js?v=5",
  "./deadline.js?v=6",
  "./policy-live-detail.js?v=6",
  "./policy-live-detail.js?v=7",
  "./policy-live-detail.js?v=8",
  "./policy-live-detail.js?v=9",
  "./policy-detail-actions.js?v=1",
  "./policy-detail-actions.js?v=3",
  "./policy-detail-actions.js?v=4",
  "./policy-detail-actions.js?v=6",
  "./app-shell.js?v=1",
  "./policy-shell.js?v=1",
  "./deadline-badge-fix.js?v=1",
  "./deadline-badge-fix.js?v=2",
  "./mobile-search-action.js?v=1",
  "./mobile-search-action.js?v=2",
  "./site.js?v=24",
  "./site.js?v=25",
  "./site.js?v=26",
  "./search-fix.js?v=2",
  "./click-snapshot.js?v=1",
  "./region-fix.js?v=21",
  "./age-merge-fix.js?v=1",
  "./target-foreigner-fix.js?v=2",
  "./region-label-fix.js?v=6",
  "./gyeonggi-gwangju-search-fix.js?v=6",
  "./category-app-style.js?v=11",
  "./category-app-style.js?v=12",
  "./agency-label-fix.js?v=3",
  "./policy-news.js?v=1",
  "./popular-filter-fix.js?v=2",
  "./category-match-fix.js?v=11",
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
  "./assets/logo-government-support25.svg?v=3",
  "./assets/app-icon-192.png?v=1",
  "./assets/app-icon-512.png?v=1",
  "./assets/app-icon-maskable-512.png?v=1",
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
    url.pathname.endsWith("/app-shell.js") ||
    url.pathname.endsWith("/policy-shell.js") ||
    url.pathname.endsWith("/deadline-badge-fix.js") ||
    url.pathname.endsWith("/mobile-search-action.js") ||
    url.pathname.endsWith("/deadline.js") ||
    url.pathname.endsWith("/search-fix.js") ||
    url.pathname.endsWith("/region-fix.js") ||
    url.pathname.endsWith("/age-merge-fix.js") ||
    url.pathname.endsWith("/target-foreigner-fix.js") ||
    url.pathname.endsWith("/region-label-fix.js") ||
    url.pathname.endsWith("/gyeonggi-gwangju-search-fix.js") ||
    url.pathname.endsWith("/category-match-fix.js") ||
    url.pathname.endsWith("/category-app-style.js") ||
    url.pathname.endsWith("/agency-label-fix.js") ||
    url.pathname.endsWith("/policy-news.js") ||
    url.pathname.endsWith("/popular-filter-fix.js") ||
    url.pathname.endsWith("/popular-filter-fix.css") ||
    url.pathname.endsWith("/category-app-style.css") ||
    url.pathname.endsWith("/policy-live-detail.js") ||
    url.pathname.endsWith("/policy-detail-actions.js") ||
    url.pathname.endsWith("/policy-detail.css") ||
    url.pathname.endsWith("/manifest.webmanifest") ||
    event.request.mode === "navigate";

  if (networkFirst) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
