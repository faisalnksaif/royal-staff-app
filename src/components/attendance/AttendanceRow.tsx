import { useState, useRef } from "react"
import { View, Pressable, StyleSheet } from "react-native"
import { ChevronDown, Pencil } from "lucide-react-native"
import moment from "moment"
import Collapsible from "../shared/Collapsible"
import StaffAvatar from "../shared/StaffAvatar"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { toTitleCase } from "../../utils/helpers"
import { statusColor, formatWorkHours, STATUS_LABEL } from "./helpers"
import { sharedStyles } from "./styles"
import OvertimeBadge from "./OvertimeBadge"
import OvertimeDecisionChip from "./OvertimeDecisionChip"
import SessionTimeline from "./SessionTimeline"
import SessionProgressBar from "./SessionProgressBar"
import type { AttendanceRecord } from "../../types"

export default function AttendanceRow({
  record, canEdit, onEdit, expandAllSignal, canDecideOvertime, onApproveOvertime, onRejectOvertime,
}: {
  record: AttendanceRecord
  canEdit: boolean
  onEdit: (record: AttendanceRecord) => void
  expandAllSignal: { value: boolean; token: number }
  canDecideOvertime: boolean
  onApproveOvertime: (record: AttendanceRecord) => void
  onRejectOvertime: (record: AttendanceRecord) => void
}) {
  const { colors } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [pressed, setPressed] = useState(false)
  const lastToken = useRef(expandAllSignal.token)
  if (lastToken.current !== expandAllSignal.token) {
    lastToken.current = expandAllSignal.token
    if (expanded !== expandAllSignal.value) setExpanded(expandAllSignal.value)
  }
  const color = statusColor(record.status)
  const firstSession = record.sessions?.[0]
  const hasAutoClosed = record.sessions?.some((s) => s.autoClosed)
  const hasSessions = record.sessions?.length > 0
  const hasOpenSession = record.sessions?.some((s) => !s.checkOut && !s.autoClosed)
  const breakExcessMinutes = record.break?.excessMinutes ?? 0

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderBottomColor: colors.border as string },
      ]}
    >
      <Pressable
        onPress={() => hasSessions && setExpanded((v) => !v)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.rowContent, { opacity: pressed && hasSessions ? 0.7 : 1 }]}
      >
        <View>
          <StaffAvatar name={record.staffName} color={color} bgColor={color + "22"} />
          {hasOpenSession && (
            <View style={[sharedStyles.onlineDot, { borderColor: colors.surface as string }]} />
          )}
        </View>

        <View style={styles.rowInfo}>
          <AppText variant="bodyMedium">{toTitleCase(record.staffName)}</AppText>
          <View style={styles.rowMeta}>
            {firstSession?.checkIn ? (
              <AppText variant="caption" color="secondary">
                In: {moment(firstSession.checkIn).format("h:mm A")}
              </AppText>
            ) : (
              <AppText variant="caption" color="tertiary">Not checked in</AppText>
            )}
            {record.totalWorkHours != null && (
              <AppText variant="caption" color="tertiary">
                {"  ·  "}{formatWorkHours(record.totalWorkHours)}
              </AppText>
            )}
            {record.sessionCount > 1 && (
              <AppText variant="caption" color="tertiary">
                {"  ·  "}{record.sessionCount} sessions
              </AppText>
            )}
            {record.status === "late" && !!record.lateMinutes && (
              <AppText variant="caption" style={{ color: palette.warning.default }}>
                {"  ·  "}{record.lateMinutes}m late
              </AppText>
            )}
            <OvertimeBadge record={record} hidePending={canDecideOvertime} />
            {canDecideOvertime && record.overtimeApprovalStatus === "pending" && (
              <OvertimeDecisionChip record={record} onApprove={onApproveOvertime} onReject={onRejectOvertime} />
            )}
            {breakExcessMinutes > 0 && (
              <AppText variant="caption" style={{ color: palette.warning.default }}>
                {"  ·  "}{breakExcessMinutes}m over break
              </AppText>
            )}
            {hasAutoClosed && (
              <AppText variant="caption" style={{ color: palette.error.default }}>
                {"  ·  "}Missed checkout
              </AppText>
            )}
          </View>
        </View>

        <View style={[sharedStyles.statusBadge, { backgroundColor: color + "22" }]}>
          <AppText variant="caption" style={{ color, fontSize: 11 }}>
            {STATUS_LABEL[record.status]}
          </AppText>
        </View>

        {canEdit && (
          <Pressable onPress={() => onEdit(record)} hitSlop={8} style={{ marginLeft: spacing[1] }}>
            <Pencil size={16} color={colors.text.tertiary} strokeWidth={2} />
          </Pressable>
        )}

        {hasSessions && (
          <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }], marginLeft: spacing[1] }}>
            <ChevronDown size={18} color={colors.text.tertiary} strokeWidth={2} />
          </View>
        )}
      </Pressable>

      {hasSessions && (
        <View style={styles.rowProgressBar}>
          <SessionProgressBar record={record} color={color} />
        </View>
      )}

      {hasSessions && (
        <Collapsible expanded={expanded}>
          <SessionTimeline record={record} color={color} />
        </Collapsible>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  rowProgressBar: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  rowInfo: { flex: 1, gap: spacing[1] },
  rowMeta: { flexDirection: "row", flexWrap: "wrap" },
})
