// Service Worker für Offline-Unterstützung und Caching
const CACHE_VERSION = '20260108.1203';
const CACHE_NAME = `galerie-sifi-v${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/navigation.js',
  '/js/content-loader.js',
  '/js/exhibition-swipe.js',
  '/recognition.js',
  '/Content/exhibitions.json',
  '/images/logo.png',
  '/images/icons/home.png',
  '/images/icons/camera.png',
  '/images/icons/number2.png',
  '/images/icons/map.png',
  '/images/icons/menue.png',
  '/images/icons/arrow_left.png',
  '/images/icons/arrow_right.png',
  '/images/icons/prev.png',
  '/images/icons/next.png',
  '/fonts/TWKLausanne-350.ttf',
  '/screens/home.html',
  '/screens/scanner.html',
  '/screens/exhibitions/exhibition-1.html',
  '/screens/exhibitions/exhibition-2.html',
  '/screens/exhibitions/exhibition-3.html'
];

// Installation: Caching von statischen Assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing... Version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.warn('Cache installation error:', err);
    })
  );
  // Sofort aktivieren ohne auf alte Tabs zu warten
  self.skipWaiting();
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch-Event: Cache-First für statische Assets, Network-First für API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Externe CDN-Requests (TensorFlow, etc.) - Network First
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request) || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Lokale Assets - Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // Erfolgreich vom Netzwerk - Cache aktualisieren
        if (response && response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      }).catch(() => {
        // Offline - aus Cache antworten oder Error-Response
        return caches.match(request) || new Response('Offline', { status: 503 });
      });
    })
  );
});
