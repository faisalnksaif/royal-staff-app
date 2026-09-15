import { useState, useMemo, useCallback } from "react"
import { View, FlatList, StyleSheet, Pressable, Modal, TextInput, ScrollView } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { ChevronLeft, ChevronRight, ChevronDown, Search, X, Users, AlertTriangle, Pencil } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import DrawerMenuButton from "../../components/shared/DrawerMenuButton"
import RefreshButton from "../../components/shared/RefreshButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import AttendanceListSkeleton from "../../components/shared/AttendanceListSkeleton"
import Collapsible from "../../components/shared/Collapsible"
import Popup from "../../components/shared/Popup"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import EditSessionsModal from "../../components/attendance/EditSessionsModal"
import OvertimeApprovalModal from "../../components/attendance/OvertimeApprovalModal"
import OvertimeBadge from "../../components/attendance/OvertimeBadge"
import OvertimeDecisionChip from "../../components/attendance/OvertimeDecisionChip"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { useStaff, useCurrentStaff } from "../../hooks/useStaff"
import { useRole } from "../../hooks/useRole"
import { useMonthlyAttendance } from "../../hooks/useMonthlyAttendance"
import { attendanceService } from "../../services/attendanceService"
import { statusColor, formatWorkHours, computeSessionGaps } from "../../components/attendance/helpers"
import { sharedStyles } from "../../components/attendance/styles"
import { toTitleCase } from "../../utils/helpers"
import type { AttendanceRecord, MonthlyAttendanceDay, MonthlyAttendanceSummary, StaffResponse } from "../../types"

const CURRENT_MONTH = moment().format("YYYY-MM")

// EditSessionsModal / OvertimeApprovalModal / the OT chip all speak
// AttendanceRecord (the daily-page shape). A monthly day carries the same
// fields minus the staff identity, which lives on the response envelope, so
// reusing those components is a matter of pairing the two rather than
// building month-specific copies.
function toAttendanceRecord(
  day: MonthlyAttendanceDay,
  staffId: number,
  staffName: string,
): AttendanceRecord {
  return {
    staffId,
    staffName,
    sessionCount: day.sessionCount,
    sessions: day.sessions,
    totalWorkHours: day.totalWorkHours,
    totalBreakTime: day.totalBreakTime,
    pendingOvertimeMinutes: day.pendingOvertimeMinutes,
    approvedOvertimeMinutes: day.approvedOvertimeMinutes,
    overtimeApprovalStatus: day.overtimeApprovalStatus,
    lateMinutes: day.lateMinutes,
    break: {
      minutes: day.breakMinutes,
      allowanceMinutes: day.breakAllowanceMinutes,
      excessMinutes: day.breakExcessMinutes,
    },
    status: day.status ?? "absent",
  }
}

// ─── day-type presentation ──────────────────────────────────────────────────

// A day with no attendance document at all is the one worth chasing, so it
// gets the warning treatment rather than reading as a quiet blank like an
// off day or holiday does.
function dayLabel(day: MonthlyAttendanceDay): { label: string; color: string; muted: boolean } {
  if (day.dayType === "no-record") return { label: "No record", color: palette.error.default, muted: false }
  if (day.dayType === "holiday") return { label: day.holidayName ?? "Holiday", color: palette.info.default, muted: true }
  if (day.dayType === "off-day") return { label: "Off day", color: palette.neutral[500], muted: true }
  if (day.dayType === "future") return { label: "—", color: palette.neutral[500], muted: true }
  if (day.isOnLeave) return { label: day.leaveType ? toTitleCase(day.leaveType) : "On leave", color: palette.info.default, muted: false }
  const status = day.status ?? "absent"
  const label = status === "half-day" ? "Half-day" : toTitleCase(status)
  return { label, color: statusColor(status), muted: false }
}

// ─── summary ────────────────────────────────────────────────────────────────

function SummaryTile({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.summaryTile}>
      <AppText variant="heading3" style={{ color: color ?? (colors.text.primary as string) }}>{value}</AppText>
      <AppText variant="caption" color="tertiary">{label}</AppText>
    </View>
  )
}

function MonthSummary({ summary }: { summary: MonthlyAttendanceSummary }) {
  const { colors } = useTheme()
  const flags: { key: string; label: string; color: string }[] = []
  if (summary.noRecordDays > 0)
    flags.push({ key: "noRecord", label: `${summary.noRecordDays} day${summary.noRecordDays > 1 ? "s" : ""} with no record`, color: palette.error.default })
  if (summary.missedCheckoutDays > 0)
    flags.push({ key: "missed", label: `${summary.missedCheckoutDays} missed checkout${summary.missedCheckoutDays > 1 ? "s" : ""}`, color: palette.error.default })
  if (summary.totalPendingOvertimeMinutes > 0)
    flags.push({ key: "otPending", label: `${formatWorkHours(summary.totalPendingOvertimeMinutes / 60)} OT pending`, color: palette.warning.default })
  if (summary.totalBreakExcessMinutes > 0)
    flags.push({ key: "break", label: `${summary.totalBreakExcessMinutes}m over break`, color: palette.warning.default })
  if (summary.totalLateMinutes > 0)
    flags.push({ key: "late", label: `${formatWorkHours(summary.totalLateMinutes / 60)} late total`, color: palette.warning.default })

  return (
    <AppCard elevation="sm" style={{ marginBottom: spacing[3] }}>
      <View style={styles.summaryRow}>
        <SummaryTile label="Present" value={String(summary.presentDays)} color={palette.success.default} />
        <SummaryTile label="Late" value={String(summary.lateDays)} color={palette.warning.default} />
        <SummaryTile label="Half-day" value={String(summary.halfDayDays)} color={palette.info.default} />
        <SummaryTile label="Absent" value={String(summary.absentDays)} color={palette.error.default} />
        <SummaryTile label="Leave" value={String(summary.onLeaveDays)} color={palette.neutral[500]} />
      </View>
      <View style={[styles.summaryDivider, { backgroundColor: colors.border as string }]} />
      <View style={styles.summaryRow}>
        <SummaryTile label="Worked" value={formatWorkHours(summary.totalWorkHours)} />
        <SummaryTile label="Approved OT" value={formatWorkHours(summary.totalApprovedOvertimeMinutes / 60)} color={palette.success.default} />
        <SummaryTile label="Working days" value={String(summary.workingDays)} />
        <SummaryTile label="Off days" value={String(summary.offDays)} />
      </View>
      {flags.length > 0 && (
        <View style={styles.flagRow}>
          {flags.map((f) => (
            <View key={f.key} style={[styles.flagPill, { backgroundColor: f.color + "18", borderColor: colors.border as string }]}>
              <AppText variant="caption" style={{ color: f.color, fontSize: 11 }}>{f.label}</AppText>
            </View>
          ))}
        </View>
      )}
    </AppCard>
  )
}

// ─── day row ────────────────────────────────────────────────────────────────

function DayRow({
  day, record, canEdit, onEdit, canDecideOvertime, onApproveOvertime, onRejectOvertime,
}: {
  day: MonthlyAttendanceDay
  record: AttendanceRecord
  canEdit: boolean
  onEdit: (day: MonthlyAttendanceDay) => void
  canDecideOvertime: boolean
  onApproveOvertime: (day: MonthlyAttendanceDay) => void
  onRejectOvertime: (day: MonthlyAttendanceDay) => void
}) {
  const { colors } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const { label, color, muted } = dayLabel(day)
  const hasSessions = day.sessions.length > 0
  const gaps = useMemo(() => computeSessionGaps(day.sessions), [day.sessions])
  const isWeekend = moment(day.date).day() === 0

  const attention = day.dayType === "no-record" || day.hasMissedCheckout
  const showOtChip = canDecideOvertime && day.overtimeApprovalStatus === "pending" && day.pendingOvertimeMinutes > 0

  return (
    <View style={[styles.dayCard, { borderColor: attention ? palette.error.default + "55" : (colors.border as string), backgroundColor: colors.surface }]}>
      <Pressable
        onPress={() => hasSessions && setExpanded((v) => !v)}
        style={styles.dayHeader}
        disabled={!hasSessions}
      >
        {/* date */}
        <View style={styles.dayDate}>
          <AppText variant="bodyMedium" style={{ color: isWeekend ? colors.text.tertiary : colors.text.primary }}>
            {moment(day.date).format("DD")}
          </AppText>
          <AppText variant="caption" color="tertiary">{moment(day.date).format("ddd")}</AppText>
        </View>

        {/* status */}
        <View style={styles.dayStatus}>
          <View style={[styles.statusDot, { backgroundColor: color, opacity: muted ? 0.5 : 1 }]} />
          <AppText variant="caption" style={{ color: muted ? colors.text.tertiary : color }} numberOfLines={1}>
            {label}
          </AppText>
        </View>

        {/* in / out span */}
        <View style={styles.daySpan}>
          {hasSessions ? (
            <AppText variant="caption" color="secondary" numberOfLines={1}>
              {moment(day.sessions[0].checkIn).format("h:mm A")}
              {" – "}
              {day.sessions[day.sessions.length - 1].checkOut
                ? moment(day.sessions[day.sessions.length - 1].checkOut!).format("h:mm A")
                : day.hasMissedCheckout ? "no checkout" : "still in"}
            </AppText>
          ) : (
            <AppText variant="caption" color="tertiary">—</AppText>
          )}
        </View>

        {/* hours */}
        <View style={styles.dayHours}>
          <AppText variant="caption" style={{ color: colors.text.primary }}>
            {day.totalWorkHours != null ? formatWorkHours(day.totalWorkHours) : "—"}
          </AppText>
          {day.lateMinutes > 0 && (
            <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>
              {day.lateMinutes}m late
            </AppText>
          )}
          <OvertimeBadge record={record} hidePending={showOtChip} />
          {showOtChip && (
            <OvertimeDecisionChip
              record={record}
              onApprove={() => onApproveOvertime(day)}
              onReject={() => onRejectOvertime(day)}
            />
          )}
          {day.breakExcessMinutes > 0 && (
            <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>
              {day.breakExcessMinutes}m over break
            </AppText>
          )}
        </View>

        {/* markers */}
        <View style={styles.dayMarkers}>
          {day.wasEdited && !canEdit && <Pencil size={12} color={colors.text.tertiary} strokeWidth={1.75} />}
          {attention && <AlertTriangle size={13} color={palette.error.default} strokeWidth={2} />}
          {canEdit && (
            <Pressable onPress={() => onEdit(day)} hitSlop={8}>
              <Pencil size={15} color={colors.accent} strokeWidth={2} />
            </Pressable>
          )}
          {hasSessions && (
            <ChevronDown
              size={15}
              color={colors.text.tertiary}
              strokeWidth={2}
              style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
            />
          )}
        </View>
      </Pressable>

      {hasSessions && (
        <Collapsible expanded={expanded}>
          <View style={[styles.sessionBlock, { borderTopColor: colors.border as string }]}>
            {day.sessions.map((session, idx) => {
              const gapAfter = gaps.find((g) => g.startTime === session.checkOut)
              return (
                <View key={session.sessionNumber} style={{ gap: spacing[2] }}>
                  <View style={sharedStyles.timelineRow}>
                    <View style={sharedStyles.timelineLeft}>
                      <View style={[sharedStyles.sessionDot, { backgroundColor: color }]} />
                      <AppText variant="caption" color="tertiary">Session {session.sessionNumber}</AppText>
                    </View>
                    <View style={sharedStyles.timelineTimes}>
                      <AppText variant="caption" style={{ color: colors.text.primary }}>
                        {moment(session.checkIn).format("h:mm A")}
                      </AppText>
                      <View style={[sharedStyles.timeDash, { backgroundColor: colors.border as string }]} />
                      {session.checkOut ? (
                        <AppText variant="caption" style={{ color: colors.text.primary }}>
                          {moment(session.checkOut).format("h:mm A")}
                        </AppText>
                      ) : session.autoClosed ? (
                        <AppText variant="caption" style={{ color: palette.warning.default }}>Auto-closed</AppText>
                      ) : (
                        <AppText variant="caption" style={{ color: palette.success.default }}>Still in</AppText>
                      )}
                      {session.workHours != null && (
                        <AppText variant="caption" color="tertiary" style={{ marginLeft: spacing[2] }}>
                          {formatWorkHours(session.workHours)}
                        </AppText>
                      )}
                    </View>
                  </View>

                  {gapAfter && idx < day.sessions.length - 1 && (
                    <View style={sharedStyles.timelineRow}>
                      <View style={sharedStyles.timelineLeft}>
                        <View style={[sharedStyles.sessionDot, { backgroundColor: colors.text.tertiary as string }]} />
                        <AppText variant="caption" color="tertiary">Break</AppText>
                      </View>
                      <View style={sharedStyles.timelineTimes}>
                        <AppText variant="caption" color="tertiary">
                          {formatWorkHours(gapAfter.minutes / 60)}
                        </AppText>
                      </View>
                    </View>
                  )}
                </View>
              )
            })}

            {day.breakMinutes != null && (
              <AppText variant="caption" color="tertiary">
                Break total {day.breakMinutes}m of {day.breakAllowanceMinutes}m allowed
                {day.breakExcessMinutes > 0 ? ` · ${day.breakExcessMinutes}m over` : ""}
              </AppText>
            )}
            {day.notes && (
              <AppText variant="caption" style={{ color: palette.warning.default }}>{day.notes}</AppText>
            )}
          </View>
        </Collapsible>
      )}
    </View>
  )
}

// ─── staff picker ───────────────────────────────────────────────────────────

function StaffPicker({
  visible, staff, currentId, onSelect, onClose,
}: {
  visible: boolean
  staff: StaffResponse[]
  currentId: number | null
  onSelect: (s: StaffResponse) => void
  onClose: () => void
}) {
  const { colors } = useTheme()
  const [q, setQ] = useState("")
  const filtered = q.trim()
    ? staff.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()))
    : staff

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalBox, { backgroundColor: colors.background.primary, borderColor: colors.border as string }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <AppText variant="bodyMedium">Select staff</AppText>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color={colors.text.tertiary} strokeWidth={1.75} />
            </Pressable>
          </View>
          <View style={[styles.searchBox, { borderColor: colors.border as string, backgroundColor: colors.background.secondary }]}>
            <Search size={14} color={colors.text.tertiary} strokeWidth={1.75} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary as string }]}
              placeholder="Search staff..."
              placeholderTextColor={colors.text.tertiary as string}
              value={q}
              onChangeText={setQ}
            />
          </View>
          <ScrollView style={{ maxHeight: 340 }}>
            {filtered.map((s) => {
              const active = s.id === currentId
              return (
                <Pressable
                  key={s.id}
                  onPress={() => { onSelect(s); setQ("") }}
                  style={[styles.staffOption, active && { backgroundColor: colors.accent + "18" }]}
                >
                  <AppText variant="body" style={{ color: active ? colors.accent : colors.text.primary }}>
                    {toTitleCase(s.name)}
                  </AppText>
                  {active && <AppText variant="caption" color="accent">Current</AppText>}
                </Pressable>
              )
            })}
            {filtered.length === 0 && (
              <AppText variant="caption" color="tertiary" style={{ padding: spacing[4], textAlign: "center" }}>
                No staff found
              </AppText>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function MonthlyAttendanceScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const { isHR, isAdmin } = useRole()
  const params = useLocalSearchParams<{ staffId?: string }>()

  const { currentStaff } = useCurrentStaff()
  const { data: staffData } = useStaff()
  const eligibleStaff = useMemo(
    () => (staffData?.data ?? [])
      .filter((s) => s.isEligibleForAttendance !== false)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [staffData?.data],
  )

  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(
    params.staffId ? Number(params.staffId) : null,
  )
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [editMode, setEditMode] = useState(false)
  const [editTarget, setEditTarget] = useState<MonthlyAttendanceDay | null>(null)
  const [otApprovalTarget, setOtApprovalTarget] = useState<MonthlyAttendanceDay | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Default to the first eligible staff member so the page isn't empty on open.
  const activeStaffId = selectedStaffId ?? eligibleStaff[0]?.id ?? null
  const activeStaff = eligibleStaff.find((s) => s.id === activeStaffId) ?? null

  const { data, isLoading, isError, refetch, isRefetching } = useMonthlyAttendance(activeStaffId, month)
  const monthly = data?.data

  // Reaching this screen at all already requires superAdmin/manager/hr (the
  // (admin) layout redirects anyone else, and the API re-checks), so the only
  // extra rule to enforce here is the self-edit block: AttendanceEditPolicy
  // rejects editing or approving your own record whatever your role.
  const isNotSelf = !!currentStaff && activeStaffId !== currentStaff.id
  const canDecide = (isAdmin || isHR) && isNotSelf
  const canEditDays = editMode && isNotSelf

  const handleApproveOvertime = useCallback((day: MonthlyAttendanceDay) => {
    setOtApprovalTarget(day)
  }, [])

  const handleRejectOvertime = useCallback(
    async (day: MonthlyAttendanceDay) => {
      if (!activeStaffId) return
      try {
        await attendanceService.decideOvertime(activeStaffId, day.date, false)
        refetch()
      } catch (e) {
        setActionError(
          e instanceof Error && e.message
            ? e.message
            : `Could not reject overtime for ${moment(day.date).format("D MMM")}. Please try again.`,
        )
      }
    },
    [activeStaffId, refetch],
  )

  const isCurrentMonth = month === CURRENT_MONTH
  const goPrevMonth = useCallback(() => {
    setMonth((m) => moment(m, "YYYY-MM").subtract(1, "month").format("YYYY-MM"))
  }, [])
  const goNextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === CURRENT_MONTH) return m
      return moment(m, "YYYY-MM").add(1, "month").format("YYYY-MM")
    })
  }, [])

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && (isHR ? <DrawerMenuButton /> : <BackButton />)}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Monthly Attendance</AppText>
          <AppText variant="caption" color="tertiary">Day-by-day record with sessions</AppText>
        </View>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
        {isNotSelf && (
          <Pressable onPress={() => setEditMode((v) => !v)} style={{ padding: spacing[2] }} hitSlop={8}>
            <Pencil size={22} color={editMode ? colors.accent : colors.text.tertiary} strokeWidth={1.75} />
          </Pressable>
        )}
      </View>

      {/* Staff + month selectors */}
      <View style={[styles.controls, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.staffPill, { backgroundColor: colors.background.secondary, borderColor: colors.border as string }]}
        >
          <Users size={16} color={colors.text.tertiary} strokeWidth={1.75} />
          <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {activeStaff ? toTitleCase(activeStaff.name) : "Select staff"}
          </AppText>
          <ChevronDown size={16} color={colors.text.tertiary} strokeWidth={2} />
        </Pressable>

        <View style={styles.monthNav}>
          <Pressable onPress={goPrevMonth} hitSlop={10} style={[styles.monthArrow, { backgroundColor: colors.background.secondary }]}>
            <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
          <View style={[styles.monthPill, { backgroundColor: isCurrentMonth ? colors.accentSubtle : colors.background.secondary }]}>
            <AppText variant="bodyMedium" style={{ color: isCurrentMonth ? colors.accent : colors.text.primary }}>
              {moment(month, "YYYY-MM").format("MMMM YYYY")}
            </AppText>
          </View>
          <Pressable
            onPress={goNextMonth}
            hitSlop={10}
            disabled={isCurrentMonth}
            style={[styles.monthArrow, { backgroundColor: colors.background.secondary, opacity: isCurrentMonth ? 0.35 : 1 }]}
          >
            <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Day list */}
      {isLoading ? (
        <AttendanceListSkeleton />
      ) : isError ? (
        <View style={styles.center}>
          <AppText color="secondary">Couldn't load this month's attendance.</AppText>
        </View>
      ) : !activeStaffId ? (
        <View style={styles.center}>
          <AppText color="tertiary">Select a staff member to see their month.</AppText>
        </View>
      ) : (
        <FlatList
          data={monthly?.days ?? []}
          keyExtractor={(day) => day.date}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <DayRow
                day={item}
                record={toAttendanceRecord(item, monthly!.staffId, monthly!.staffName)}
                canEdit={canEditDays}
                onEdit={setEditTarget}
                canDecideOvertime={canDecide}
                onApproveOvertime={handleApproveOvertime}
                onRejectOvertime={handleRejectOvertime}
              />
            </AnimatedListItem>
          )}
          ListHeaderComponent={monthly ? <MonthSummary summary={monthly.summary} /> : null}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color="tertiary">No days to show for this month.</AppText>
            </View>
          }
        />
      )}

      <StaffPicker
        visible={pickerOpen}
        staff={eligibleStaff}
        currentId={activeStaffId}
        onSelect={(s) => { setSelectedStaffId(s.id); setPickerOpen(false) }}
        onClose={() => setPickerOpen(false)}
      />

      {editTarget && monthly && (
        <EditSessionsModal
          record={toAttendanceRecord(editTarget, monthly.staffId, monthly.staffName)}
          date={editTarget.date}
          onClose={() => setEditTarget(null)}
          onSaved={refetch}
        />
      )}

      {otApprovalTarget && monthly && (
        <OvertimeApprovalModal
          record={toAttendanceRecord(otApprovalTarget, monthly.staffId, monthly.staffName)}
          date={otApprovalTarget.date}
          onClose={() => setOtApprovalTarget(null)}
          onSaved={refetch}
        />
      )}

      {actionError && (
        <Popup title="Action failed" onClose={() => setActionError(null)}>
          <AppText color="secondary">{actionError}</AppText>
          <View style={{ marginTop: spacing[4] }}>
            <AppButton label="Close" onPress={() => setActionError(null)} />
          </View>
        </Popup>
      )}
    </View>
  )
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  staffPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 190,
    flexGrow: 1,
    maxWidth: 280,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  monthArrow: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  monthPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    minWidth: 150,
    alignItems: "center",
  },

  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[20],
    gap: spacing[2],
  },

  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryTile: {
    flex: 1,
    minWidth: 64,
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing[1],
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing[3],
  },
  flagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  flagPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },

  dayCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  dayDate: {
    width: 38,
    alignItems: "center",
  },
  dayStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    width: 104,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  daySpan: {
    flex: 1,
    minWidth: 110,
  },
  dayHours: {
    alignItems: "flex-end",
    gap: 1,
    minWidth: 76,
  },
  dayMarkers: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    width: 52,
    justifyContent: "flex-end",
  },
  sessionBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    width: 360,
    maxHeight: 480,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    margin: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Geist_400Regular",
    padding: 0,
    ...({ outlineStyle: "none" } as object),
  },
  staffOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
})
