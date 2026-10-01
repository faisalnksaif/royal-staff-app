import React, { useEffect, useState } from "react"
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native"
import { Bell, X } from "lucide-react-native"
import Toast from "react-native-toast-message"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { enableWebPush, getWebPushStatus, type WebPushStatus } from "../../services/webPush"
import { radii, shadows, spacing } from "../../constants/theme"

// "Not now" hides the prompt for a week rather than forever - it's the only
// way PWA users can get pushes, so it's worth asking again.
const DISMISS_KEY = "webPushPromptDismissedAt"
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return !!at && Date.now() - at < DISMISS_MS
  } catch {
    return false
  }
}

/**
 * Web-only banner asking to turn on notifications. The browser permission
 * prompt has to come from a tap (iOS refuses it otherwise), hence a banner
 * rather than asking on load. In an iOS Safari tab push can't work at all,
 * so it explains Add to Home Screen instead.
 */
export default function WebPushPrompt({ enabled }: { enabled: boolean }) {
  const { colors } = useTheme()
  const [status, setStatus] = useState<WebPushStatus>("unsupported")
  const [hidden, setHidden] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (Platform.OS !== "web" || !enabled) return
    setStatus(getWebPushStatus())
    setHidden(recentlyDismissed())
  }, [enabled])

  if (Platform.OS !== "web" || !enabled || hidden) return null
  if (status !== "default" && status !== "needs-install") return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
    setHidden(true)
  }

  async function handleEnable() {
    setBusy(true)
    try {
      const result = await enableWebPush()
      setStatus(result)
      if (result === "granted") {
        Toast.show({ type: "success", text1: "Notifications turned on" })
      } else if (result === "denied") {
        Toast.show({
          type: "error",
          text1: "Notifications blocked",
          text2: "Allow them for this site in your browser settings",
        })
      }
    } catch {
      Toast.show({ type: "error", text1: "Couldn't turn on notifications", text2: "Please try again" })
    } finally {
      setBusy(false)
    }
  }

  const needsInstall = status === "needs-install"

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.card, shadows.lg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Bell size={20} color={colors.accent} strokeWidth={2} />
        <View style={styles.text}>
          <AppText variant="body">{needsInstall ? "Get notifications" : "Turn on notifications"}</AppText>
          <AppText variant="caption" color="secondary">
            {needsInstall
              ? "Tap Share, then Add to Home Screen, and open the app from there."
              : "Get follow-up, work and leave alerts on this device."}
          </AppText>
        </View>
        {!needsInstall && <AppButton label="Enable" size="sm" isLoading={busy} onPress={handleEnable} />}
        <TouchableOpacity onPress={dismiss} hitSlop={10} accessibilityLabel="Dismiss">
          <X size={18} color={colors.text.tertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 88, // clear of the tab bar
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  card: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 2 },
})
