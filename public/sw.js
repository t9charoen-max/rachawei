/* Service worker ราชาหวายสุรินทร์ — ให้เปิดแบบแอปและโหลดซ้ำเร็ว */
const CACHE_VERSION = 'rachawei-v1940';
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(RUNTIME_CACHE));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(js|css|png|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // อย่ายุ่งกับส่วน rachawatsadu / desk (แอปแยกต่างหาก)
  if (url.pathname.startsWith('/rachawatsadu') || url.pathname.startsWith('/desk')) return;

  // หน้าเว็บ: network-first เพื่อให้ได้เวอร์ชันล่าสุด, ตกหล่นใช้แคช
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put('/', fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match('/');
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // ไฟล์ static (js/css/รูป): stale-while-revalidate
  if (isCacheableAsset(url) || url.pathname.startsWith('/products/') || url.pathname.startsWith('/catalog/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })(),
    );
  }
});
