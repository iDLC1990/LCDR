/* Работа без интернета: сохраняет сайт на устройстве.
   Всегда сначала пробует сеть (так обновления сайта доходят сразу), а если сети нет, берёт копию с устройства.
   Запросы к Supabase и Google не затрагиваются. */
const CACHE = 'lcdr-hub-v1';
const CORE = [
  './', 'index.html', 'css/style.css', 'icon.jpg',
  'js/config.js', 'js/diagonals.js', 'js/app.js', 'js/final1.js', 'js/final2.js', 'js/manual.js',
  'js/label.js', 'js/pnbase.js', 'js/special.js', 'js/sheets.js', 'js/livedata.js', 'js/statistic.js',
  'js/collapse.js', 'js/repairlog.js', 'js/photo.js', 'js/panelsn.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  const cdn = url.hostname === 'cdn.jsdelivr.net';
  if (!sameSite && !cdn) return; // Supabase, Google и остальное идут как обычно
  e.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ]);
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = (await cache.match(req)) ||
      (req.mode === 'navigate' ? ((await cache.match('index.html')) || (await cache.match('./'))) : null);
    if (hit) return hit;
    throw err;
  }
}
