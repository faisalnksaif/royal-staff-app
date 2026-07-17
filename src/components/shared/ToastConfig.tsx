import { View, StyleSheet } from "react-native"
import { CheckCircle, XCircle, Info } from "lucide-react-native"
import type { BaseToastProps } from "react-native-toast-message"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette, shadows } from "../../constants/theme"

// ─── base ────────────────────────────────────────────────────────────────────

function ToastItem({
  text1,
  text2,
  accent,
  icon,
}: {
  text1?: string
  text2?: string
  accent: string
  icon: React.ReactNode
}) {
  const { colors } = useTheme()
  return (
    <View
      style={[
        styles.container,
        shadows.lg,
        { backgroundColor: colors.surface, borderLeftColor: accent },
      ]}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.body}>
        {text1 && (
          <AppText variant="bodyMedium" style={{ color: colors.text.primary }}>
            {text1}
          </AppText>
        )}
        {text2 && (
          <AppText variant="caption" style={{ color: colors.text.secondary }}>
            {text2}
          </AppText>
        )}
      </View>
    </View>
  )
}

// ─── config ──────────────────────────────────────────────────────────────────

export const toastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <ToastItem
      text1={text1}
      text2={text2}
      accent={palette.success.default}
      icon={<CheckCircle size={20} color={palette.success.default} strokeWidth={1.75} />}
    />
  ),
  error: ({ text1, text2 }: BaseToastProps) => (
    <ToastItem
      text1={text1}
      text2={text2}
      accent={palette.error.default}
      icon={<XCircle size={20} color={palette.error.default} strokeWidth={1.75} />}
    />
  ),
  info: ({ text1, text2 }: BaseToastProps) => (
    <ToastItem
      text1={text1}
      text2={text2}
      accent={palette.info.default}
      icon={<Info size={20} color={palette.info.default} strokeWidth={1.75} />}
    />
  ),
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: "90%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radii.lg,
    borderLeftWidth: 4,
    paddingVertical: spacing[3],
    paddingRight: spacing[4],
    paddingLeft: spacing[3],
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    gap: 2,
  },
})
