import { View, ActivityIndicator, StyleSheet, Pressable } from "react-native"
import { CheckCircle, Clock, XCircle, LogIn } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"

/** Which summary card is filtering the list, or null for no filter. */
export type SummaryFilter = "present" | "late" | "absent" | "open"

function StatCard({
  label, count, color, icon: Icon, isActive, onPress,
}: {
  label: string
  count: number
  color: string
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>
  isActive: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${label}: ${count}. ${isActive ? "Filtering by this status, tap to clear" : "Tap to filter"}`}
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: isActive ? color + "14" : colors.surface,
          borderColor: isActive ? color : (colors.border as string),
          borderWidth: isActive ? 1 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.statCardIcon, { backgroundColor: color + "1a" }]}>
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      <View>
        <AppText variant="heading3" style={{ color }}>{count}</AppText>
        <AppText variant="caption" color="tertiary">{label}</AppText>
      </View>
    </Pressable>
  )
}

export default function SummaryBar({
  present, late, absent, open, showOpen, isLoading, activeFilter, onFilterChange,
}: {
  present: number
  late: number
  absent: number
  /** Staff with a session that was never checked out. */
  open: number
  /** Only meaningful on past days - today's open sessions are just staff still at work. */
  showOpen: boolean
  isLoading: boolean
  activeFilter: SummaryFilter | null
  onFilterChange: (filter: SummaryFilter | null) => void
}) {
  const { colors } = useTheme()
  if (isLoading) {
    return (
      <View style={styles.summaryBar}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  // Tapping the active card clears the filter; tapping another switches to it.
  function toggle(filter: SummaryFilter) {
    onFilterChange(activeFilter === filter ? null : filter)
  }

  return (
    <View style={styles.summaryBar}>
      <StatCard
        label="Present"
        count={present}
        color={palette.success.default}
        icon={CheckCircle}
        isActive={activeFilter === "present"}
        onPress={() => toggle("present")}
      />
      <StatCard
        label="Late"
        count={late}
        color={palette.warning.default}
        icon={Clock}
        isActive={activeFilter === "late"}
        onPress={() => toggle("late")}
      />
      <StatCard
        label="Absent"
        count={absent}
        color={palette.neutral[500]}
        icon={XCircle}
        isActive={activeFilter === "absent"}
        onPress={() => toggle("absent")}
      />
      {showOpen && (
        <StatCard
          label="Open"
          count={open}
          color={palette.error.default}
          icon={LogIn}
          isActive={activeFilter === "open"}
          onPress={() => toggle("open")}
        />
      )}
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
