import { useEffect, useRef } from "react"
import { Platform } from "react-native"
import * as Notifications from "expo-notifications"
import { type EventSubscription } from "expo-modules-core"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { useQueryClient } from "@tanstack/react-query"
import { authService } from "../services/authService"
import useAuthStore from "../stores/useAuthStore"
import { syncWebPushIfGranted } from "../services/webPush"

/** Payload shapes the backend attaches to its pushes. */
type NotificationData = {
  type?: string
  ledgerName?: string
  ledgerId?: number
  workAssignmentId?: string
  scheduleId?: string
  status?: string
  /** Which end of the work the recipient is - sent on status/note pushes. */
  audience?: "assignee" | "assigner"
}

// Work pushes sent to the assignee ("you've been given work") vs to the
// assigner ("your assignee moved/missed it") - they land on different screens.
// Status and note pushes can go either way, so they carry `audience` instead.
const ASSIGNEE_WORK_TYPES = ["work_assigned", "work_due"]
const ASSIGNER_WORK_TYPES = ["work_overdue"]
const EITHER_WAY_WORK_TYPES = ["work_status_updated", "work_note_added"]

export function isWorkNotification(data?: { type?: string } | null): boolean {
  const type = data?.type
  return (
    !!type &&
    (ASSIGNEE_WORK_TYPES.includes(type) ||
      ASSIGNER_WORK_TYPES.includes(type) ||
      EITHER_WAY_WORK_TYPES.includes(type))
  )
}

/**
 * Where a work push should land. Staff only have the tab screen; admins are
 * blocked from that route entirely, so they always go to the admin screen -
 * opened on the tab matching the notification's direction.
 */
export function workRouteFor(data: NotificationData, role?: string): any {
  const isStaff = !role || role === "staff"
  if (isStaff) return "/(tabs)/work"

  // Older status pushes predate `audience` and only ever went to the assigner.
  const toAssigner = data.audience
    ? data.audience === "assigner"
    : ASSIGNER_WORK_TYPES.includes(data.type ?? "") || EITHER_WAY_WORK_TYPES.includes(data.type ?? "")
  return { pathname: "/(admin)/team-work", params: { tab: toAssigner ? "assigned" : "mine" } }
}

// expo-notifications is Android/iOS only - every entry point below has to be
// kept away from web, including this module-scope call.
const IS_NATIVE = Platform.OS !== "web"

if (IS_NATIVE) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}

/**
 * `useLastNotificationResponse` reads the native last-response store, which
 * throws on web. A hook can't be called conditionally, so the platform branch
 * lives here instead: `Platform.OS` is fixed for the life of the process, so
 * exactly one of these runs on a given platform and the hook count is stable.
 */
function useLastNotificationResponseSafe() {
  if (!IS_NATIVE) return null
  return Notifications.useLastNotificationResponse()
}

/**
 * Everything a notification tap should do, shared by the live listener and
 * the cold-start path so the two can never diverge.
 */
function handleNotificationTap(
  data: NotificationData,
  role: string | undefined,
  router: ReturnType<typeof useRouter>,
  queryClient: ReturnType<typeof useQueryClient>
) {
  queryClient.invalidateQueries({ queryKey: ["staff-outstanding"] })
  queryClient.invalidateQueries({ queryKey: ["staff-followups"] })
  queryClient.invalidateQueries({ queryKey: ["notifications"] })

  if (data?.ledgerId) {
    queryClient.invalidateQueries({ queryKey: ["customer-followups", String(data.ledgerId)] })
  }

  if (isWorkNotification(data)) {
    queryClient.invalidateQueries({ queryKey: ["work"] })
    router.push(workRouteFor(data, role))
    return
  }

  if (data?.ledgerName) {
    router.push({
      pathname: "/customer/[name]",
      params: {
        name: data.ledgerName,
        totalBalance: "0",
        drCr: "Dr",
        customerId: String(data.ledgerId ?? ""),
        mobile: "",
      },
    })
  }
}

export function usePushNotifications(enabled: boolean) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.user?.role)
  const lastResponse = useLastNotificationResponseSafe()
  // The effect only re-runs on `enabled`, so the listener would close over a
  // stale role - a ref keeps the current one available at tap time.
  const roleRef = useRef(role)
  roleRef.current = role

  // Notification ids already routed, so the cold-start response (which
  // persists and re-reports) can't navigate a second time for a tap the
  // live listener already handled.
  const handledResponseIds = useRef<Set<string>>(new Set())

  const notificationListener = useRef<EventSubscription | null>(null)
  const responseListener = useRef<EventSubscription | null>(null)

  useEffect(() => {
    if (!enabled || Platform.OS === "web") return

    async function register() {
      const { status: existing } = await Notifications.getPermissionsAsync()
      let status = existing
      if (existing !== "granted") {
        const { status: asked } = await Notifications.requestPermissionsAsync()
        status = asked
      }
      if (status !== "granted") return

      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      if (!projectId) return
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
      try {
        await authService.savePushToken(token)
      } catch {
        // non-fatal — notifications still work locally
      }
    }

    register()

    // Refresh all relevant data whenever a notification arrives
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      queryClient.invalidateQueries({ queryKey: ["staff-outstanding"] })
      queryClient.invalidateQueries({ queryKey: ["staff-followups"] })
      queryClient.invalidateQueries({ queryKey: ["customer-followups"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })

      // Work pushes carry their own cache - refresh it so an open list
      // updates in place without waiting for a manual pull.
      const data = notification.request.content.data as NotificationData
      if (isWorkNotification(data)) {
        queryClient.invalidateQueries({ queryKey: ["work"] })
      }
    })

    // Navigate when a notification is tapped while the app is running.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handledResponseIds.current.add(response.notification.request.identifier)
      const data = response.notification.request.content.data as NotificationData
      handleNotificationTap(data, roleRef.current, router, queryClient)
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [enabled])

  // Web (PWA): pushes arrive through the service worker in public/sw.js,
  // which posts "push-received" / "notification-tap" messages to open
  // windows. A tap with no window open launches the app with the payload in
  // `?notification=` instead - read once here, held until the user is loaded.
  const pendingWebTap = useRef<NotificationData | null>(null)
  if (!IS_NATIVE && pendingWebTap.current === null && typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get("notification")
    if (raw) {
      try {
        pendingWebTap.current = JSON.parse(raw)
      } catch {
        // malformed - ignore
      }
      params.delete("notification")
      const query = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (query ? `?${query}` : ""))
    }
  }

  useEffect(() => {
    if (IS_NATIVE || !enabled) return
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return

    // Permission granted on an earlier visit - keep the backend's copy current.
    syncWebPushIfGranted().catch(() => {})

    if (pendingWebTap.current) {
      const data = pendingWebTap.current
      pendingWebTap.current = null
      handleNotificationTap(data, roleRef.current, router, queryClient)
    }

    function onMessage(event: MessageEvent) {
      const msg = event.data as { type?: string; data?: NotificationData } | null
      if (msg?.type === "push-received") {
        queryClient.invalidateQueries({ queryKey: ["staff-outstanding"] })
        queryClient.invalidateQueries({ queryKey: ["staff-followups"] })
        queryClient.invalidateQueries({ queryKey: ["customer-followups"] })
        queryClient.invalidateQueries({ queryKey: ["notifications"] })
        if (isWorkNotification(msg.data)) {
          queryClient.invalidateQueries({ queryKey: ["work"] })
        }
      } else if (msg?.type === "notification-tap") {
        handleNotificationTap(msg.data ?? {}, roleRef.current, router, queryClient)
      }
    }

    navigator.serviceWorker.addEventListener("message", onMessage)
    return () => navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [enabled])

  // Cold start: a tap that launched the app from a killed state never reaches
  // the listener above, since it happened before this effect ran. This hook
  // reports that response instead - it persists and re-reports on re-render,
  // so it's cleared once handled and guarded by id against double navigation.
  useEffect(() => {
    if (!IS_NATIVE) return
    if (!lastResponse) return

    // Only a plain tap should navigate - action buttons are not a "open this".
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return

    // Auth rehydrates from storage asynchronously, so on a cold start this
    // runs before `enabled` flips true. Waiting rather than returning keeps
    // the response for the re-run once the user is loaded - otherwise the
    // tap is dropped, since `lastResponse` never changes again to retrigger.
    if (!enabled) return

    const id = lastResponse.notification.request.identifier
    if (handledResponseIds.current.has(id)) return
    handledResponseIds.current.add(id)

    const data = lastResponse.notification.request.content.data as NotificationData
    handleNotificationTap(data, role, router, queryClient)

    Notifications.clearLastNotificationResponse()
  }, [enabled, lastResponse, role])
}
