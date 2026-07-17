import { View, StyleSheet } from "react-native"
import { MotiView } from "moti"
import { Fingerprint } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { colors, spacing } from "../../constants/theme"

interface FingerprintScannerProps {
  isScanning: boolean
}

export default function FingerprintScanner({ isScanning }: FingerprintScannerProps) {
  const { isDark } = useTheme()
  const accent = isDark ? colors.primary[400] : colors.primary[600]

  return (
    <View style={styles.container}>
      <MotiView
        from={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: isScanning ? 1.08 : 1, opacity: isScanning ? 1 : 0.7 }}
        transition={{ type: "timing", duration: 700, loop: isScanning }}
      >
        <Fingerprint size={120} color={accent} strokeWidth={1.25} />
      </MotiView>
      <AppText variant="caption" color="secondary" style={styles.hint}>
        {isScanning ? "Reading fingerprint…" : "Place finger on scanner"}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
  },
  hint: {
    textAlign: "center",
  },
})
