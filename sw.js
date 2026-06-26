/* Learn with Adhi – offline layer (plan-v4 B1).
   Strategy (deliberately conservative so ONLINE behavior never changes):
   - Kid-world files are precached on install → the tablet works in the
     car / on hotel wifi, even for pages never opened before.
   - Pages & courses.json: network-first (fresh when online, cache when not).
     No stale-cache hell; deploys flow through immediately.
   - Same-origin static assets (sprites, auth.js): cache-first with a
     background refresh (stale-while-revalidate).
   - Google Fonts + the Firebase compat libs: cache-first runtime cache.
   - Firestore/auth API calls, /api/, /_vercel/: never intercepted.
   Wiring: when a NEW kid course ships, add its file to PRECACHE below
   (see the wiring checklist in CLAUDE.md). Bump CACHE_VERSION when
   removing/renaming files so old entries get cleaned up. */

const CACHE_VERSION = 'lwa-v2';

const PRECACHE = [
  /* hubs */
  '/kids.html',
  '/rayyan.html',
  '/raya.html',
  /* shared */
  '/assets/js/auth.js',
  '/assets/favicon-32.png',
  '/assets/on-indigo-512.png',
  /* Rayyan – adventures */
  '/courses/math/rayyan-math-grade2-v1.html',
  '/courses/math/rayyan-math-grade3.html',
  '/courses/math/rayyan-math-grade4.html',
  '/courses/math/rayyan-math-grade5.html',
  '/courses/math/rayyan-math-grade6.html',
  '/courses/math/rayyan-math-grade7.html',
  '/courses/math/rayyan-balance-v1.html',
  '/courses/coding/rayyan-coding-v1.html',
  '/courses/coding/rayyan-coding-v2.html',
  '/courses/coding/rayyan-coding-v3.html',
  '/courses/coding/rayyan-coding-v4.html',
  '/courses/coding/rayyan-coding-v5.html',
  '/courses/coding/rayyan-bridge-v1.html',
  '/courses/games/rayyan-masinis-v1.html',
  /* Rayyan – games */
  '/courses/tools/rayyan-train-run-v1.html',
  '/courses/tools/train_adventure_v3.html',
  /* Raya – courses */
  '/courses/math/raya-math-v1.html',
  '/courses/learning/raya-learning-visual-v1.html',
  '/courses/learning/raya-literacy-v1.html',
  '/courses/learning/raya-logic-v1.html',
  '/courses/learning/raya-world-v1.html',
  '/courses/learning/raya-story-v1.html',
  '/courses/learning/raya-tracing-v1.html',
  /* Raya – games */
  '/courses/games/raya-find-it-v1.html',
  '/courses/games/raya-akuarium-v1.html',
  /* vendored Three.js (the Akuarium 3D game depends on these) */
  '/assets/js/vendor/three.min.js',
  '/assets/js/vendor/OrbitControls.js',
  /* Kenney sprites (runner games, medal cabinet, space boss) */
  '/assets/img/kenney/platformer/cactus.png',
  '/assets/img/kenney/platformer/rock.png',
  '/assets/img/kenney/platformer/cloud1.png',
  '/assets/img/kenney/platformer/cloud2.png',
  '/assets/img/kenney/platformer/cloud3.png',
  '/assets/img/kenney/platformer/bush.png',
  '/assets/img/kenney/platformer/grass.png',
  '/assets/img/kenney/platformer/grassMid.png',
  '/assets/img/kenney/platformer/mushroomRed.png',
  '/assets/img/kenney/platformer/coinGold.png',
  '/assets/img/kenney/medals/medal1.png',
  '/assets/img/kenney/medals/medal2.png',
  '/assets/img/kenney/medals/medal3.png',
  '/assets/img/kenney/medals/medal4.png',
  '/assets/img/kenney/medals/medal5.png',
  '/assets/img/kenney/medals/medal6.png',
  '/assets/img/kenney/medals/medal7.png',
  '/assets/img/kenney/medals/medal8.png',
  '/assets/img/kenney/medals/medal9.png',
  '/assets/img/kenney/space/ufoRed.png',
  '/assets/img/kenney/space/ufoGreen.png',
  '/assets/img/kenney/space/enemyBlack3.png',
  '/assets/img/kenney/space/enemyRed1.png',
  '/assets/img/kenney/space/meteorBrown_big1.png',
];

/* Cross-origin hosts we cache-first (static libraries & fonts). */
const CACHED_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const CACHED_PREFIXES = ['https://www.gstatic.com/firebasejs/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      /* Add files one by one so a single 404 can't void the whole install. */
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('lwa-') && k !== CACHE_VERSION)
        .map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function networkFirst(req) {
  return fetch(req).then((res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
    }
    return res;
  }).catch(() =>
    caches.match(req, { ignoreSearch: true }).then((hit) =>
      /* Last resort for an uncached page: land on the kids hub. */
      hit || (req.mode === 'navigate' ? caches.match('/kids.html') : Promise.reject(new Error('offline')))
    )
  );
}

function cacheFirst(req) {
  return caches.match(req).then((hit) => {
    const refresh = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
      }
      return res;
    });
    /* Serve cache immediately when present; refresh in the background. */
    return hit ? (refresh.catch(() => {}), hit) : refresh;
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Cross-origin: only fonts + the Firebase compat libs are cached;
     everything else (Firestore, auth, analytics APIs) goes straight out. */
  if (url.origin !== self.location.origin) {
    if (CACHED_HOSTS.includes(url.host) || CACHED_PREFIXES.some((p) => req.url.startsWith(p))) {
      event.respondWith(cacheFirst(req));
    }
    return;
  }

  /* Same-origin paths that must never be intercepted. */
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return;

  /* Pages + the course manifest: fresh when online, cached when offline. */
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' ||
      url.pathname === '/assets/courses.json') {
    event.respondWith(networkFirst(req));
    return;
  }

  /* Everything else same-origin (sprites, JS, css, icons). */
  event.respondWith(cacheFirst(req));
});
