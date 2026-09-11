import { useState, useRef } from "react"
import { View, Pressable, StyleSheet } from "react-native"
import { ChevronDown, Pencil } from "lucide-react-native"
import Collapsible from "../shared/Collapsible"
import StaffAvatar from "../shared/StaffAvatar"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { toTitleCase } from "../../utils/helpers"
import { statusColor, formatWorkHours, STATUS_LABEL } from "./helpers"
import { sharedStyles } from "./styles"
import OvertimeBadge from "./OvertimeBadge"
import OvertimeDecisionChip from "./OvertimeDecisionChip"
import SessionTimeline from "./SessionTimeline"
import SessionProgressBar from "./SessionProgressBar"
import type { AttendanceRecord } from "../../types"

export default function StaffCardDesktop({
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
  const lastToken = useRef(expandAllSignal.token)
  if (lastToken.current !== expandAllSignal.token) {
    lastToken.current = expandAllSignal.token
    if (expanded !== expandAllSignal.value) setExpanded(expandAllSignal.value)
  }
  const color = statusColor(record.status)
  const hasAutoClosed = record.sessions?.some((s) => s.autoClosed)
  const hasSessions = record.sessions?.length > 0
  const hasOpenSession = record.sessions?.some((s) => !s.checkOut && !s.autoClosed)
  const breakExcessMinutes = record.break?.excessMinutes ?? 0

  return (
    <View
      style={[
        styles.deskCard,
        { backgroundColor: colors.surface, borderColor: colors.border as string },
      ]}
    >
      <View style={styles.deskCardHeader}>
        <View>
          <StaffAvatar name={record.staffName} color={color} bgColor={color + "22"} />
          {hasOpenSession && (
            <View style={[sharedStyles.onlineDot, { borderColor: colors.surface as string }]} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" numberOfLines={1}>{toTitleCase(record.staffName)}</AppText>
          <View style={styles.deskCardMeta}>
            {record.totalWorkHours != null && (
              <AppText variant="caption" color="tertiary">{formatWorkHours(record.totalWorkHours)}</AppText>
            )}
            {record.status === "late" && !!record.lateMinutes && (
              <AppText variant="caption" style={{ color: palette.warning.default }}>
                {record.totalWorkHours != null ? "  ·  " : ""}{record.lateMinutes}m late
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
          <Pressable onPress={() => onEdit(record)} hitSlop={8} style={{ marginLeft: spacing[2] }}>
            <Pencil size={16} color={colors.text.tertiary} strokeWidth={2} />
          </Pressable>
        )}
        {hasSessions && (
          <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8} style={{ marginLeft: spacing[2] }}>
            <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
              <ChevronDown size={18} color={colors.text.tertiary} strokeWidth={2} />
            </View>
          </Pressable>
        )}
      </View>

      {hasSessions && <SessionProgressBar record={record} color={color} />}

      <Collapsible expanded={expanded}>
        <View>
          <View style={[styles.deskCardDivider, { backgroundColor: colors.border as string }]} />

          {hasSessions ? (
            <SessionTimeline record={record} color={color} scrollable />
          ) : (
            <View style={styles.deskCardEmpty}>
              <AppText variant="caption" color="tertiary">Not checked in</AppText>
            </View>
          )}
        </View>
      </Collapsible>
    </View>
  )
}

const styles = StyleSheet.create({
  deskCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
  },
  deskCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  deskCardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing[1],
  },
  deskCardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing[3],
  },
  deskCardEmpty: {
    paddingVertical: spacing[2],
  },
})
