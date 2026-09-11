import { View, ActivityIndicator, StyleSheet } from "react-native"
import { CheckCircle, Clock, XCircle } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"

function StatCard({
  label, count, color, icon: Icon,
}: {
  label: string; count: number; color: string; icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border as string }]}>
      <View style={[styles.statCardIcon, { backgroundColor: color + "1a" }]}>
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      <View>
        <AppText variant="heading3" style={{ color }}>{count}</AppText>
        <AppText variant="caption" color="tertiary">{label}</AppText>
      </View>
    </View>
  )
}

export default function SummaryBar({
  present, late, absent, isLoading,
}: {
  present: number; late: number; absent: number; isLoading: boolean
}) {
  const { colors } = useTheme()
  if (isLoading) {
    return (
      <View style={styles.summaryBar}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }
  return (
    <View style={styles.summaryBar}>
      <StatCard label="Present" count={present} color={palette.success.default} icon={CheckCircle} />
      <StatCard label="Late" count={late} color={palette.warning.default} icon={Clock} />
      <StatCard label="Absent" count={absent} color={palette.neutral[500]} icon={XCircle} />
    </View>
  )
}

const styles = StyleSheet.create({
  summaryBar: {
    flexDirection: "row",
    paddingHorizontal: spacing[5],
    gap: spacing[3],
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
})
