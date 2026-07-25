const CACHE = "royalpulse-v1"

// On install: cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([self.location.pathname.replace(/sw\.js$/, "")])
    )
  )
  self.skipWaiting()
})

// On activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  )
  self.clients.claim()
})

// Fetch strategy:
//   API calls  → network-first (never cache)
//   Everything → cache-first, fill from network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  // Network-only for API
  if (url.hostname.includes("sulthanpages.com")) {
    event.respondWith(fetch(event.request))
    return
  }

  // Cache-first for app shell & assets
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
    )
  )
})
