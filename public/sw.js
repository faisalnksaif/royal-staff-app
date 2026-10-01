const SHELL_CACHE = "royalpulse-shell-v2"
const ASSET_CACHE = "royalpulse-assets-v2"
const MAX_ASSET_ENTRIES = 80

const SHELL_URLS = ["/", "/manifest.json", "/icons/icon-180.png", "/icons/icon-192.png", "/icons/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, ASSET_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Web Push. The backend sends {title, body, data}; `data` is the same payload
// native pushes carry, so the app routes taps with the same logic.
self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = { body: event.data ? event.data.text() : "" }
  }
  const title = payload.title || "Royal Pulse"
  const data = payload.data || {}

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: payload.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data,
      }),
      // Let an open app refresh its lists, like the native received-listener.
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => clients.forEach((c) => c.postMessage({ type: "push-received", data }))),
    ])
  )
})

// Tap: focus an open window and hand it the payload, or open a fresh one with
// the payload in the URL (the app picks it up once the user is loaded).
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = event.notification.data || {}

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const client = clients.find((c) => new URL(c.url).origin === self.location.origin)
      if (client) {
        return client.focus().then(() => client.postMessage({ type: "notification-tap", data }))
      }
      return self.clients.openWindow("/?notification=" + encodeURIComponent(JSON.stringify(data)))
    })
  )
})

// Old bundles pile up across deploys (every build has new hashed filenames).
async function trimAssetCache() {
  const cache = await caches.open(ASSET_CACHE)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - MAX_ASSET_ENTRIES; i++) await cache.delete(keys[i])
}

// Strategy:
//   Cross-origin (API etc.) → not intercepted at all
//   Page navigations        → network-first, so every launch gets the latest
//                             index.html (and so the latest bundle); cached
//                             shell when offline
//   /_expo/static, fonts    → cache-first (filenames are content-hashed)
//   Other same-origin GETs  → stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put("/", clone))
          }
          return response
        })
        .catch(() => caches.match("/"))
    )
    return
  }

  if (url.pathname.startsWith("/_expo/static/") || url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches
                .open(ASSET_CACHE)
                .then((cache) => cache.put(request, clone))
                .then(trimAssetCache)
            }
            return response
          })
      )
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
