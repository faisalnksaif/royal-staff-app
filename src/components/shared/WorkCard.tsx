import { View, StyleSheet } from "react-native"
import { Clock, Repeat, User, AlertTriangle, CheckCircle2 } from "lucide-react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import ListRow, { ListRowPill } from "./ListRow"
import type { ActionMenuItem } from "./ActionMenu"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import {
  WORK_STATUS_CONFIG,
  WORK_PRIORITY_CONFIG,
  describeDue,
  formatDueTime,
} from "../../utils/work"
import type { WorkAssignment } from "../../types"

/**
 * One work occurrence in a list. Shared by the staff "My Work" screen and the
 * admin "Team Work" screen - `assigneeName` is only passed on the admin side,
 * where whose work it is matters more than whose list it's in.
 */
export default function WorkCard({
  item,
  index,
  assigneeName,
  recurrenceLabel,
  dueTime,
  menuItems = [],
  isBusy,
}: {
  item: WorkAssignment
  index?: number
  assigneeName?: string
  recurrenceLabel?: string
  dueTime?: string | null
  menuItems?: ActionMenuItem[]
  isBusy?: boolean
}) {
  const { colors, isDark } = useTheme()

  const status = WORK_STATUS_CONFIG[item.status]
  const due = describeDue(item)
  const timeLabel = formatDueTime(dueTime ?? null)

  // Urgent work leads with red so an overdue item is obvious at a glance;
  // everything else keeps the brand gold.
  const avatarColor = due.isUrgent
    ? palette.error.default
    : isDark
      ? colors.accent
      : palette.primary[700]
  const avatarBgColor = due.isUrgent
    ? palette.error.default + "22"
    : isDark
      ? colors.accentSubtle
      : palette.primary[100]

  const pills: ListRowPill[] = [
    { key: "status", label: status.label, color: status.color, bgColor: status.color + "22" },
    ...(due.isUrgent
      ? [{ key: "due", label: due.label, color: palette.error.default, bgColor: palette.error.default + "22" }]
      : []),
    ...(item.priority && item.priority !== "normal"
      ? [
          {
            key: "priority",
            label: WORK_PRIORITY_CONFIG[item.priority].label,
            color: WORK_PRIORITY_CONFIG[item.priority].color,
            bgColor: WORK_PRIORITY_CONFIG[item.priority].color + "22",
          },
        ]
      : []),
  ]

  const metaLines: React.ReactNode[] = []

  if (assigneeName) {
    metaLines.push(
      <View key="assignee" style={styles.metaRow}>
        <User size={13} color={colors.text.tertiary} strokeWidth={1.5} />
        <AppText variant="bodySmall" style={{ color: colors.text.secondary as string }}>
          {assigneeName}
        </AppText>
      </View>
    )
  }

  if (item.description) {
    metaLines.push(
      <AppText
        key="description"
        variant="bodySmall"
        numberOfLines={2}
        style={{ color: colors.text.secondary as string }}
      >
        {item.description}
      </AppText>
    )
  }

  metaLines.push(
    <View key="due" style={styles.metaRow}>
      <Clock size={13} color={due.isUrgent ? palette.error.default : colors.text.tertiary} strokeWidth={1.5} />
      <AppText
        variant="bodySmall"
        style={{ color: (due.isUrgent ? palette.error.default : colors.text.secondary) as string }}
      >
        {moment(item.dueDate, "YYYY-MM-DD").format("ddd, D MMM")}
        {timeLabel ? ` · ${timeLabel}` : ""}
        {!due.isUrgent ? ` · ${due.label}` : ""}
      </AppText>
    </View>
  )

  if (recurrenceLabel && recurrenceLabel !== "One-time") {
    metaLines.push(
      <View key="recurrence" style={styles.metaRow}>
        <Repeat size={13} color={colors.text.tertiary} strokeWidth={1.5} />
        <AppText variant="bodySmall" style={{ color: colors.text.tertiary as string }}>
          {recurrenceLabel}
        </AppText>
      </View>
    )
  }

  // Completion note is the payoff for the assigner - show it prominently.
  if (item.status === "completed" && item.completionNote) {
    metaLines.push(
      <View key="note" style={styles.metaRow}>
        <CheckCircle2 size={13} color={palette.success.default} strokeWidth={1.75} />
        <AppText variant="bodySmall" style={{ color: colors.text.secondary as string, flex: 1 }}>
          {item.completionNote}
        </AppText>
      </View>
    )
  }

  if (item.status === "completed" && item.isLate) {
    metaLines.push(
      <View key="late" style={styles.metaRow}>
        <AlertTriangle size={13} color={palette.warning.default} strokeWidth={1.75} />
        <AppText variant="bodySmall" style={{ color: palette.warning.default }}>
          Completed after the deadline
        </AppText>
      </View>
    )
  }

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={item.title}
      pills={pills}
      menuItems={menuItems}
      isBusy={isBusy}
      metaLines={metaLines}
    />
  )
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
})
