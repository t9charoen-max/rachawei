/* Service worker — ราชาวัสดุ Desk ให้เปิดจากหน้าจอโฮมได้ถาวร */
const CACHE_VERSION = 'rachawatsadu-desk-v1'
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const SHELL_URL = '/desk/'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => cache.addAll([SHELL_URL, '/desk/manifest.webmanifest'])),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

function isDeskAsset(url) {
  return (
    url.pathname.startsWith('/desk/assets/') ||
    url.pathname.startsWith('/desk/icons/') ||
    url.pathname === '/desk/favicon.svg' ||
    url.pathname === '/desk/manifest.webmanifest' ||
    /\.(js|css|png|svg|woff2?|webmanifest)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/desk')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          const cache = await caches.open(RUNTIME_CACHE)
          cache.put(SHELL_URL, fresh.clone())
          return fresh
        } catch {
          return (await caches.match(SHELL_URL)) || Response.error()
        }
      })(),
    )
    return
  }

  if (isDeskAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE)
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || network
      })(),
    )
  }
})
