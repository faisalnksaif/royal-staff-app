import { ScrollViewStyleReset } from "expo-router/html"

const BASE = process.env.EXPO_BASE_URL ?? ""

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />

        {/* PWA */}
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RoyalPulse" />
        {/* iOS uses apple-touch-icon — 180px is the preferred size for modern iPhones */}
        <link rel="apple-touch-icon" sizes="180x180" href={`${BASE}/icons/icon-180.png`} />
        <link rel="apple-touch-icon" sizes="192x192" href={`${BASE}/icons/icon-192.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${BASE}/icons/icon-192.png`} />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker
                    .register('${BASE}/sw.js', { scope: '${BASE}/' })
                    .then(function (reg) { console.log('[SW] registered:', reg.scope); })
                    .catch(function (err) { console.warn('[SW] registration failed:', err); });
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
