import { useEffect, useRef } from "react"
import { Platform } from "react-native"
import * as Notifications from "expo-notifications"
import { type EventSubscription } from "expo-modules-core"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { useQueryClient } from "@tanstack/react-query"
import { authService } from "../services/authService"
import useAuthStore from "../stores/useAuthStore"

/** Payload shapes the backend attaches to its pushes. */
type NotificationData = {
  type?: string
  ledgerName?: string
  ledgerId?: number
  workAssignmentId?: string
  scheduleId?: string
  status?: string
}

// Work pushes sent to the assignee ("you've been given work") vs to the
// assigner ("your assignee moved/missed it") - they land on different screens.
const ASSIGNEE_WORK_TYPES = ["work_assigned", "work_due"]
const ASSIGNER_WORK_TYPES = ["work_status_updated", "work_overdue"]

function isWorkNotification(data?: NotificationData): boolean {
  const type = data?.type
  return !!type && (ASSIGNEE_WORK_TYPES.includes(type) || ASSIGNER_WORK_TYPES.includes(type))
}

/**
 * Where a work push should land. Staff only have the tab screen; admins are
 * blocked from that route entirely, so they always go to the admin screen -
 * opened on the tab matching the notification's direction.
 */
function workRouteFor(data: NotificationData, role?: string): any {
  const isStaff = !role || role === "staff"
  if (isStaff) return "/(tabs)/work"

  const tab = ASSIGNER_WORK_TYPES.includes(data.type ?? "") ? "assigned" : "mine"
  return { pathname: "/(admin)/team-work", params: { tab } }
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
