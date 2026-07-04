// sw.js — Service Worker de Study Hub
// Gère la mise en cache de l'application (offline) et l'installabilité de la PWA.

const CACHE_VERSION = "v3";
const APP_SHELL_CACHE = `study-hub-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `study-hub-runtime-${CACHE_VERSION}`;

// Fichiers essentiels de l'application (même origine) à mettre en cache
// dès l'installation, pour un fonctionnement 100% hors ligne.
const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/controls.css",
  "./css/notes.css",
  "./css/tags.css",
  "./css/social.css",
  "./css/attachments.css",
  "./css/modals.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/posts.js",
  "./js/ui.js",
  "./js/utils.js",
  "./js/notifications.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

// --- Installation : on précharge l'app shell ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting()),
  );
});

// --- Activation : on nettoie les anciennes versions de cache ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// --- Stratégie "stale-while-revalidate" : sert le cache immédiatement,
// puis met à jour le cache en arrière-plan avec la version réseau ---
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    }),
  );
}

// --- Gestion des requêtes ---
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // On ne gère que les requêtes GET (POST/PUT ne sont pas mises en cache)
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navigation (chargement de page) : réseau en priorité,
  // avec repli sur l'app shell en cache si hors ligne.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(APP_SHELL_CACHE)
            .then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(
          () =>
            caches.match("./index.html") ||
            caches.match(request) ||
            new Response(
              "<h1>Hors ligne</h1><p>Study Hub n'a pas pu charger cette page.</p>",
              { headers: { "Content-Type": "text/html; charset=UTF-8" } },
            ),
        ),
    );
    return;
  }

  // Fichiers de l'application (même origine) : cache d'abord, réseau en secours.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request)
            .then((response) => {
              const copy = response.clone();
              caches
                .open(APP_SHELL_CACHE)
                .then((cache) => cache.put(request, copy));
              return response;
            })
            .catch(() => cached)
        );
      }),
    );
    return;
  }

  // Ressources externes (polices, icônes CDN) : stale-while-revalidate,
  // sans jamais bloquer l'installation si elles sont indisponibles.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});
