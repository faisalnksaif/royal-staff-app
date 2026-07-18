import { useEffect, useRef } from "react"
import { Platform } from "react-native"
import * as Notifications from "expo-notifications"
import { type EventSubscription } from "expo-modules-core"
import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { useQueryClient } from "@tanstack/react-query"
import { authService } from "../services/authService"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function usePushNotifications(enabled: boolean) {
  const router = useRouter()
  const queryClient = useQueryClient()
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
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ["staff-outstanding"] })
      queryClient.invalidateQueries({ queryKey: ["staff-followups"] })
      queryClient.invalidateQueries({ queryKey: ["customer-followups"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    })

    // Navigate to the relevant customer when a notification is tapped
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        ledgerName?: string
        ledgerId?: number
      }
      // Refresh everything on tap too
      queryClient.invalidateQueries({ queryKey: ["staff-outstanding"] })
      queryClient.invalidateQueries({ queryKey: ["staff-followups"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      if (data?.ledgerId) {
        queryClient.invalidateQueries({ queryKey: ["customer-followups", String(data.ledgerId)] })
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
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [enabled])
}
