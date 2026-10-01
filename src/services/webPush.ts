import { Platform } from "react-native"
import api from "./apiClient"

/**
 * Web Push for the PWA build. Native builds use expo-notifications instead
 * (see usePushNotifications) - everything here is a no-op off web.
 *
 * Browser support: Android/desktop Chrome, Edge, Firefox work in a tab or
 * installed. iOS (16.4+) only delivers to a PWA added to the Home Screen,
 * and only lets a user gesture trigger the permission prompt.
 */

export type WebPushStatus =
  | "unsupported" // no service worker / PushManager (or not web)
  | "needs-install" // iOS Safari tab - must Add to Home Screen first
  | "default" // can ask
  | "granted"
  | "denied"

function isIOS(): boolean {
  const ua = navigator.userAgent
  // iPadOS reports itself as Mac; touch support gives it away.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function getWebPushStatus(): WebPushStatus {
  if (Platform.OS !== "web" || typeof window === "undefined") return "unsupported"
  if (isIOS() && !isStandalone()) return "needs-install"
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported"
  }
  return Notification.permission as WebPushStatus
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(padded)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function getPublicKey(): Promise<string> {
  const res = await api.http.request<{ data: { publicKey: string } }>({
    path: "/auth/web-push/public-key",
    method: "GET",
    secure: true,
    format: "json",
  })
  return res.data.data.publicKey
}

/**
 * Subscribes this browser (reusing an existing subscription when there is
 * one) and saves it on the logged-in staff record. Safe to call on every
 * launch - the backend keys subscriptions by endpoint.
 */
async function subscribeAndSave(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    const publicKey = await getPublicKey()
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
  }
  await api.http.request({
    path: "/auth/web-push-subscription",
    method: "PUT",
    secure: true,
    format: "json",
    body: subscription.toJSON(),
  })
}

/**
 * Asks for permission (must run from a tap on iOS) and subscribes.
 * Returns the resulting permission status.
 */
export async function enableWebPush(): Promise<WebPushStatus> {
  const permission = await Notification.requestPermission()
  if (permission === "granted") await subscribeAndSave()
  return permission as WebPushStatus
}

/** Re-saves the subscription when permission was already granted earlier. */
export async function syncWebPushIfGranted(): Promise<void> {
  if (getWebPushStatus() !== "granted") return
  await subscribeAndSave()
}

/**
 * On logout: detach this browser from the account so the next person to log
 * in on it doesn't get the previous user's pushes. Best-effort.
 */
export async function disableWebPush(): Promise<void> {
  if (getWebPushStatus() !== "granted") return
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return
    await api.http
      .request({
        path: "/auth/web-push-subscription",
        method: "DELETE",
        secure: true,
        format: "json",
        body: { endpoint: subscription.endpoint },
      })
      .catch(() => {})
    await subscription.unsubscribe()
  } catch {
    // ignore - logout must never fail on this
  }
}
