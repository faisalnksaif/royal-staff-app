import { toTitleCase } from "../../utils/helpers"
import React, { useState, useEffect, useRef } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  useWindowDimensions,
} from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { useRouter } from "expo-router"
import { CheckCircle, XCircle, UserPlus, BarChart3, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, LogIn, LogOut, AlertTriangle, Clock, Pencil, Trash2, Plus } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import AttendanceListSkeleton from "../../components/shared/AttendanceListSkeleton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import Popup from "../../components/shared/Popup"
import ConfirmModal from "../../components/shared/ConfirmModal"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import AppInput from "../../components/ui/AppInput"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { useAttendance } from "../../hooks/useAttendance"
import { useRole } from "../../hooks/useRole"
import { useCurrentStaff, useStaff } from "../../hooks/useStaff"
import { useDepartments } from "../../hooks/useDepartments"
import { attendanceService } from "../../services/attendanceService"
import type { AttendanceRecord, AttendanceSession, BreakWindow } from "../../types"

const UNASSIGNED_DEPARTMENT = "Other"

// ─── helpers ─────────────────────────────────────────────────────────────

function formatWorkHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function statusColor(status: AttendanceRecord["status"]): string {
  switch (status) {
    case "present":  return palette.success.default
    case "late":     return palette.warning.default
    case "half-day": return palette.info.default
    case "absent":   return palette.neutral[500]
  }
}

const STATUS_LABEL = { present: "Present", late: "Late", "half-day": "Half-day", absent: "Absent" }
const STATUS_ORDER: Record<AttendanceRecord["status"], number> = { present: 0, late: 1, "half-day": 2, absent: 3 }

function needsAttention(record: AttendanceRecord): boolean {
  const breakExcessMinutes = (record.teaBreak?.excessMinutes ?? 0) + (record.lunchBreak?.excessMinutes ?? 0)
  const hasAutoClosed = record.sessions?.some((s) => s.autoClosed)
  return record.status === "late" || breakExcessMinutes > 0 || !!hasAutoClosed
}

// ─── SummaryBar ───────────────────────────────────────────────────────────────

function StatCard({
  label, count, color, icon: Icon,
}: {
  label: string; count: number; color: string; icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.statCard, { backgroundColor: colors.background.secondary, borderColor: colors.border as string }]}>
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

function SummaryBar({
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

// ─── AttendanceRow ────────────────────────────────────────────────────────────

function BreakRow({ label, breakWindow }: { label: string; breakWindow: BreakWindow }) {
  const { colors } = useTheme()
  const isOver = breakWindow.excessMinutes > 0
  const color = isOver ? palette.warning.default : palette.success.default

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={[styles.sessionDot, { backgroundColor: color }]} />
        <AppText variant="caption" color="tertiary" numberOfLines={1}>
          {label}
        </AppText>
      </View>

      <View style={styles.timelineTimes}>
        <View style={styles.timeChip}>
          <LogOut size={13} color={color} strokeWidth={2} />
          <AppText variant="caption" style={{ color: colors.text.primary }}>
            {moment(breakWindow.startTime).format("h:mm A")}
          </AppText>
        </View>

        <View style={[styles.timeDash, { backgroundColor: colors.border as string }]} />

        <View style={styles.timeChip}>
          <LogIn size={13} color={color} strokeWidth={2} />
          <AppText variant="caption" style={{ color: colors.text.primary }}>
            {moment(breakWindow.endTime).format("h:mm A")}
          </AppText>
        </View>

        <AppText
          variant="caption"
          color="tertiary"
          numberOfLines={1}
          style={{ marginLeft: spacing[2], flexShrink: 0 }}
        >
          {formatWorkHours((breakWindow.minutes ?? 0) / 60)}
        </AppText>
      </View>

      {isOver && (
        <View style={[styles.liveBadge, { backgroundColor: palette.warning.default + "22" }]}>
          <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>
            {breakWindow.excessMinutes}m over
          </AppText>
        </View>
      )}
    </View>
  )
}

function SessionTimeline({
  record, color, scrollable,
}: {
  record: AttendanceRecord; color: string; scrollable?: boolean
}) {
  const { colors } = useTheme()
  const now = Date.now()
  const Container = scrollable ? ScrollView : View
  const containerProps = scrollable
    ? {
        style: styles.timelineScrollable,
        contentContainerStyle: styles.timeline,
        showsVerticalScrollIndicator: false,
      }
    : { style: styles.timeline }

  const orderedSessions = [...record.sessions].sort((a, b) => b.sessionNumber - a.sessionNumber)

  // Sessions render newest-first, so a break must attach to the session that
  // comes right AFTER it chronologically (whose checkIn == the break's
  // endTime) — that session renders first, putting the break row directly
  // beneath it and above the earlier session it followed.
  function breaksAfter(session: AttendanceSession): { key: string; label: string; breakWindow: BreakWindow }[] {
    const matches: { key: string; label: string; breakWindow: BreakWindow }[] = []
    if (record.teaBreak?.endTime && moment(record.teaBreak.endTime).isSame(session.checkIn)) {
      matches.push({ key: "tea", label: "Tea break", breakWindow: record.teaBreak })
    }
    if (record.lunchBreak?.endTime && moment(record.lunchBreak.endTime).isSame(session.checkIn)) {
      matches.push({ key: "lunch", label: "Lunch break", breakWindow: record.lunchBreak })
    }
    return matches
  }

  return (
    <Container {...containerProps}>
      {orderedSessions.map((session) => {
        const isOpen = !session.checkOut && !session.autoClosed
        const breaks = breaksAfter(session)

        return (
          <View key={session.sessionNumber} style={styles.timelineGroup}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.sessionDot, { backgroundColor: color }]} />
                <AppText variant="caption" color="tertiary">
                  Session {session.sessionNumber}
                </AppText>
              </View>

              <View style={styles.timelineTimes}>
                <View style={styles.timeChip}>
                  <LogIn size={13} color={palette.success.default} strokeWidth={2} />
                  <AppText variant="caption" style={{ color: colors.text.primary }}>
                    {moment(session.checkIn).format("h:mm A")}
                  </AppText>
                </View>

                <View style={[styles.timeDash, { backgroundColor: colors.border as string }]} />

                {session.checkOut ? (
                  <View style={styles.timeChip}>
                    <LogOut size={13} color={palette.error.default} strokeWidth={2} />
                    <AppText variant="caption" style={{ color: colors.text.primary }}>
                      {moment(session.checkOut).format("h:mm A")}
                    </AppText>
                  </View>
                ) : session.autoClosed ? (
                  <View style={styles.timeChip}>
                    <AlertTriangle size={13} color={palette.warning.default} strokeWidth={2} />
                    <AppText variant="caption" style={{ color: palette.warning.default }}>
                      Auto-closed
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.timeChip}>
                    <AppText variant="caption" style={{ color: palette.success.default }}>
                      Still in
                    </AppText>
                  </View>
                )}

                {isOpen ? (
                  <AppText
                    variant="caption"
                    color="tertiary"
                    numberOfLines={1}
                    style={{ marginLeft: spacing[2], flexShrink: 0 }}
                  >
                    {formatWorkHours((now - moment(session.checkIn).valueOf()) / 3600000)}
                  </AppText>
                ) : session.workHours != null && (
                  <AppText
                    variant="caption"
                    color="tertiary"
                    numberOfLines={1}
                    style={{ marginLeft: spacing[2], flexShrink: 0 }}
                  >
                    {formatWorkHours(session.workHours)}
                  </AppText>
                )}
              </View>

              {isOpen && (
                <View style={[styles.liveBadge, { backgroundColor: palette.success.default + "22" }]}>
                  <View style={styles.liveBadgeDot} />
                  <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>
                    Live
                  </AppText>
                </View>
              )}
            </View>

            {breaks.map((b) => (
              <BreakRow key={b.key} label={b.label} breakWindow={b.breakWindow} />
            ))}
          </View>
        )
      })}
    </Container>
  )
}

// ─── EditSessionsModal ──────────────────────────────────────────────────────

interface EditableSession {
  key: string
  checkIn: Date
  checkOut: Date | null
}

function SessionTimeInput({
  label, value, onChange, onClear,
}: {
  label: string
  value: Date | null
  onChange: (d: Date) => void
  onClear?: () => void
}) {
  const { colors, isDark } = useTheme()
  const webInputRef = useRef<HTMLInputElement | null>(null)

  function open() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: "time",
        is24Hour: false,
        onChange: (_, d) => { if (d) onChange(d) },
      })
    } else if (Platform.OS === "web") {
      try {
        (webInputRef.current as any)?.showPicker?.()
      } catch {
        webInputRef.current?.click()
      }
    }
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[1] }}>{label}</AppText>
      {Platform.OS === "ios" ? (
        <View style={[styles.editTimeField, { borderColor: colors.border as string, paddingHorizontal: spacing[2] }]}>
          <DateTimePicker
            mode="time"
            value={value ?? new Date()}
            display="compact"
            onChange={(_, d) => { if (d) onChange(d) }}
          />
        </View>
      ) : (
        <Pressable onPress={open} style={[styles.editTimeField, { borderColor: colors.border as string }]}>
          <AppText variant="body">{value ? moment(value).format("h:mm A") : "Not set"}</AppText>
        </Pressable>
      )}
      {Platform.OS === "web" &&
        React.createElement("input", {
          ref: webInputRef,
          type: "time",
          value: value ? moment(value).format("HH:mm") : "",
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.value) return
            const [h, m] = e.target.value.split(":").map(Number)
            const base = value ? new Date(value) : new Date()
            base.setHours(h, m, 0, 0)
            onChange(base)
          },
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            opacity: 0,
            colorScheme: isDark ? "dark" : "light",
          },
        })}
      {onClear && value && (
        <Pressable onPress={onClear} hitSlop={8} style={{ marginTop: spacing[1] }}>
          <AppText variant="caption" style={{ color: palette.error.default }}>Clear</AppText>
        </Pressable>
      )}
    </View>
  )
}

function EditSessionsModal({
  record,
  date,
  onClose,
  onSaved,
}: {
  record: AttendanceRecord
  date: string
  onClose: () => void
  onSaved: () => void
}) {
  const { colors } = useTheme()
  const [sessions, setSessions] = useState<EditableSession[]>(() =>
    (record.sessions.length > 0 ? record.sessions : []).map((s) => ({
      key: String(s.sessionNumber),
      checkIn: new Date(s.checkIn),
      checkOut: s.checkOut ? new Date(s.checkOut) : null,
    }))
  )
  const [reason, setReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null)

  function updateSession(key: string, patch: Partial<EditableSession>) {
    setSessions((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  }

  function removeSession(key: string) {
    setSessions((prev) => prev.filter((s) => s.key !== key))
    setPendingDeleteKey(null)
  }

  function addSession() {
    const base = moment(date, "YYYY-MM-DD").hour(9).minute(0).toDate()
    setSessions((prev) => [...prev, { key: `new-${Date.now()}`, checkIn: base, checkOut: null }])
  }

  async function handleSave() {
    if (sessions.length === 0) {
      setError("Add at least one session")
      return
    }
    for (const s of sessions) {
      if (s.checkOut && s.checkOut.getTime() <= s.checkIn.getTime()) {
        setError("Check-out must be after check-in for every session")
        return
      }
    }
    if (!reason.trim()) {
      setError("Reason is required")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      await attendanceService.editSessions(
        record.staffId,
        date,
        sessions
          .slice()
          .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
          .map((s) => ({
            checkIn: s.checkIn.toISOString(),
            checkOut: s.checkOut ? s.checkOut.toISOString() : null,
          })),
        reason.trim()
      )
      onSaved()
      onClose()
    } catch (e) {
      setError((e as Error).message ?? "Failed to save sessions")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Popup title={toTitleCase(record.staffName)} onClose={onClose}>
        <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[4] }}>
          {moment(date, "YYYY-MM-DD").format("D MMM YYYY")}
        </AppText>

        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {sessions.map((s, i) => (
            <View key={s.key} style={[styles.editSessionRow, { borderColor: colors.border as string }]}>
              <View style={styles.editSessionRowHeader}>
                <AppText variant="caption" color="tertiary">Session {i + 1}</AppText>
                <Pressable onPress={() => setPendingDeleteKey(s.key)} hitSlop={8}>
                  <Trash2 size={16} color={palette.error.default} strokeWidth={2} />
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", gap: spacing[3] }}>
                <SessionTimeInput
                  label="Check-in"
                  value={s.checkIn}
                  onChange={(d) => updateSession(s.key, { checkIn: d })}
                />
                <SessionTimeInput
                  label="Check-out"
                  value={s.checkOut}
                  onChange={(d) => updateSession(s.key, { checkOut: d })}
                  onClear={() => updateSession(s.key, { checkOut: null })}
                />
              </View>
            </View>
          ))}

          <Pressable onPress={addSession} style={styles.editAddBtn}>
            <Plus size={16} color={colors.accent} strokeWidth={2} />
            <AppText variant="bodyMedium" style={{ color: colors.accent }}>Add session</AppText>
          </Pressable>

          <AppInput
            placeholder="Reason for edit"
            value={reason}
            onChangeText={setReason}
            style={{ marginTop: spacing[3] }}
          />
        </ScrollView>

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[3] }}>
            {error}
          </AppText>
        ) : null}

        <View style={{ marginTop: spacing[4] }}>
          <AppButton label={isSaving ? "Saving…" : "Save Changes"} onPress={handleSave} disabled={isSaving} />
        </View>
      </Popup>

      <ConfirmModal
        visible={!!pendingDeleteKey}
        title="Delete session?"
        message="This removes the session from this day's record. You'll still need to save to confirm the change."
        confirmLabel="Delete"
        onConfirm={() => pendingDeleteKey && removeSession(pendingDeleteKey)}
        onCancel={() => setPendingDeleteKey(null)}
      />
    </>
  )
}

function AttendanceRow({
  record, canEdit, onEdit, expandAllSignal,
}: {
  record: AttendanceRecord
  canEdit: boolean
  onEdit: (record: AttendanceRecord) => void
  expandAllSignal: { value: boolean; token: number }
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
  const breakExcessMinutes = (record.teaBreak?.excessMinutes ?? 0) + (record.lunchBreak?.excessMinutes ?? 0)
  const flagged = needsAttention(record)

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.border as string },
        flagged && { borderLeftWidth: 3, borderLeftColor: palette.warning.default },
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
            <View style={[styles.onlineDot, { borderColor: colors.background.primary as string }]} />
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
            {!!record.overtimeMinutes && (
              <AppText variant="caption" style={{ color: palette.success.default }}>
                {"  ·  "}+{formatWorkHours(record.overtimeMinutes / 60)} OT
              </AppText>
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

        <View style={[styles.statusBadge, { backgroundColor: color + "22" }]}>
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

      {expanded && hasSessions && <SessionTimeline record={record} color={color} />}
    </View>
  )
}

// ─── SessionProgressBar ───────────────────────────────────────────────────────

interface ProgressSegment {
  key: string
  kind: "session" | "tea" | "lunch"
  start: number
  end: number
  isLive: boolean
  label: string
}

function buildProgressSegments(record: AttendanceRecord): ProgressSegment[] {
  const segments: ProgressSegment[] = []

  record.sessions.forEach((s) => {
    const start = moment(s.checkIn).valueOf()
    const isLive = !s.checkOut && !s.autoClosed
    const end = s.checkOut ? moment(s.checkOut).valueOf() : Date.now()
    segments.push({
      key: `session-${s.sessionNumber}`,
      kind: "session",
      start,
      end,
      isLive,
      label: `Session ${s.sessionNumber}: ${moment(start).format("h:mm A")} – ${s.checkOut ? moment(end).format("h:mm A") : "now"}`,
    })
  })

  if (record.teaBreak?.startTime && record.teaBreak?.endTime) {
    segments.push({
      key: "tea",
      kind: "tea",
      start: moment(record.teaBreak.startTime).valueOf(),
      end: moment(record.teaBreak.endTime).valueOf(),
      isLive: false,
      label: `Tea break: ${moment(record.teaBreak.startTime).format("h:mm A")} – ${moment(record.teaBreak.endTime).format("h:mm A")}`,
    })
  }
  if (record.lunchBreak?.startTime && record.lunchBreak?.endTime) {
    segments.push({
      key: "lunch",
      kind: "lunch",
      start: moment(record.lunchBreak.startTime).valueOf(),
      end: moment(record.lunchBreak.endTime).valueOf(),
      isLive: false,
      label: `Lunch break: ${moment(record.lunchBreak.startTime).format("h:mm A")} – ${moment(record.lunchBreak.endTime).format("h:mm A")}`,
    })
  }

  return segments.sort((a, b) => a.start - b.start)
}

function SessionProgressBar({ record, color }: { record: AttendanceRecord; color: string }) {
  const { colors } = useTheme()
  const [hovered, setHovered] = useState<ProgressSegment | null>(null)

  const segments = buildProgressSegments(record)
  if (segments.length === 0) return null

  function segmentColor(seg: ProgressSegment): string {
    if (seg.kind === "session") return color
    return palette.warning.default
  }

  return (
    <View style={{ marginTop: spacing[2], position: "relative" }}>
      <View style={styles.progressBarTrack}>
        {segments.map((seg, i) => {
          const durationMs = Math.max(seg.end - seg.start, 1)
          const segColor = segmentColor(seg)

          const hoverProps = Platform.OS === "web"
            ? {
                onMouseEnter: () => setHovered(seg),
                onMouseLeave: () => setHovered(null),
              }
            : {}

          return (
            <View
              key={seg.key}
              {...hoverProps}
              style={[
                styles.progressBarSegment,
                {
                  flex: durationMs,
                  backgroundColor: segColor,
                  opacity: seg.isLive ? 0.85 : 1,
                  marginLeft: i > 0 ? 2 : 0,
                },
              ]}
            >
              {seg.isLive && <View style={[styles.progressBarLiveDot, { backgroundColor: "#fff" }]} />}
            </View>
          )
        })}
      </View>

      {hovered && (
        <View
          pointerEvents="none"
          style={[
            styles.progressTooltip,
            { backgroundColor: colors.background.primary, borderColor: colors.border as string },
          ]}
        >
          <AppText variant="caption" numberOfLines={1}>{hovered.label}</AppText>
        </View>
      )}
    </View>
  )
}

// ─── StaffCardDesktop ─────────────────────────────────────────────────────────

function StaffCardDesktop({
  record, canEdit, onEdit, expandAllSignal,
}: {
  record: AttendanceRecord
  canEdit: boolean
  onEdit: (record: AttendanceRecord) => void
  expandAllSignal: { value: boolean; token: number }
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
  const breakExcessMinutes = (record.teaBreak?.excessMinutes ?? 0) + (record.lunchBreak?.excessMinutes ?? 0)
  const flagged = needsAttention(record)

  return (
    <View
      style={[
        styles.deskCard,
        { backgroundColor: colors.background.secondary, borderColor: colors.border as string },
        flagged && { borderLeftWidth: 3, borderLeftColor: palette.warning.default },
      ]}
    >
      <View style={styles.deskCardHeader}>
        <View>
          <StaffAvatar name={record.staffName} color={color} bgColor={color + "22"} />
          {hasOpenSession && (
            <View style={[styles.onlineDot, { borderColor: colors.background.secondary as string }]} />
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
            {!!record.overtimeMinutes && (
              <AppText variant="caption" style={{ color: palette.success.default }}>
                {"  ·  "}+{formatWorkHours(record.overtimeMinutes / 60)} OT
              </AppText>
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
        <View style={[styles.statusBadge, { backgroundColor: color + "22" }]}>
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

      {expanded && (
        <>
          <View style={[styles.deskCardDivider, { backgroundColor: colors.border as string }]} />

          {hasSessions ? (
            <SessionTimeline record={record} color={color} scrollable />
          ) : (
            <View style={styles.deskCardEmpty}>
              <AppText variant="caption" color="tertiary">Not checked in</AppText>
            </View>
          )}
        </>
      )}
    </View>
  )
}

// ─── AttendanceScreen ─────────────────────────────────────────────────────────

export default function AttendanceScreen() {
  const { colors, isDark } = useTheme()
  const { isTablet, isDesktop } = useTablet()
  const { width: windowWidth } = useWindowDimensions()
  const desktopColumns = windowWidth >= 1600 ? 3 : 2
  const router = useRouter()
  const [search, setSearch] = useState("")
  const today = moment().format("YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today
  const { canViewAttendance } = useRole()
  const { currentStaff } = useCurrentStaff()
  const { data: staffData } = useStaff()
  const { data: departmentsData } = useDepartments()
  const [iosPickerVisible, setIosPickerVisible] = useState(false)
  const [iosTempDate, setIosTempDate] = useState(new Date())
  const webDateInputRef = useRef<HTMLInputElement | null>(null)
  const [editTarget, setEditTarget] = useState<AttendanceRecord | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [expandAllSignal, setExpandAllSignal] = useState({ value: false, token: 0 })

  function toggleExpandAll() {
    setExpandAllSignal((prev) => ({ value: !prev.value, token: prev.token + 1 }))
  }

  const { data, isLoading, refetch, isRefetching } = useAttendance(selectedDate)

  // Redirect if not admin, manager, or HR
  useEffect(() => {
    if (!canViewAttendance) router.replace("/(admin)")
  }, [canViewAttendance])

  if (!canViewAttendance) return null

  function goToPrevDay() {
    setSelectedDate(moment(selectedDate).subtract(1, "day").format("YYYY-MM-DD"))
  }

  function goToNextDay() {
    if (isToday) return
    setSelectedDate(moment(selectedDate).add(1, "day").format("YYYY-MM-DD"))
  }

  function openDatePicker() {
    const current = moment(selectedDate).toDate()
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        maximumDate: new Date(),
        onChange: (_, d) => { if (d) setSelectedDate(moment(d).format("YYYY-MM-DD")) },
      })
    } else if (Platform.OS === "ios") {
      setIosTempDate(current)
      setIosPickerVisible(true)
    } else if (Platform.OS === "web") {
      webDateInputRef.current?.showPicker?.()
    }
  }

  const summary = data?.summary ?? { present: 0, late: 0, absent: 0 }
  const records = [...(data?.data ?? [])]
    .filter((r) => r.staffName.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (statusDiff !== 0) return statusDiff
      return Number(needsAttention(b)) - Number(needsAttention(a))
    })

  const departmentNameById = new Map<string, string>()
  departmentsData?.data.forEach((d) => {
    departmentNameById.set(d._id, d.name)
  })

  const departmentById = new Map<number, string>()
  staffData?.data.forEach((s) => {
    const deptName = s.departmentId ? departmentNameById.get(s.departmentId) : undefined
    departmentById.set(s.id, deptName ?? UNASSIGNED_DEPARTMENT)
  })

  const departmentGroups = new Map<string, AttendanceRecord[]>()
  records.forEach((r) => {
    const dept = departmentById.get(r.staffId) ?? UNASSIGNED_DEPARTMENT
    if (!departmentGroups.has(dept)) departmentGroups.set(dept, [])
    departmentGroups.get(dept)!.push(r)
  })

  const PINNED_DEPARTMENT = "Store"
  const departmentNames = [
    ...(departmentGroups.has(PINNED_DEPARTMENT) ? [PINNED_DEPARTMENT] : []),
    ...[...departmentGroups.keys()]
      .filter((d) => d !== UNASSIGNED_DEPARTMENT && d !== PINNED_DEPARTMENT)
      .sort(),
    ...(departmentGroups.has(UNASSIGNED_DEPARTMENT) ? [UNASSIGNED_DEPARTMENT] : []),
  ]

  type GridRow =
    | { type: "header"; key: string; label: string; count: number }
    | { type: "records"; key: string; items: AttendanceRecord[] }

  function buildGridRows(columns: number): GridRow[] {
    const rows: GridRow[] = []
    departmentNames.forEach((dept) => {
      const items = departmentGroups.get(dept) ?? []
      rows.push({ type: "header", key: `header-${dept}`, label: dept, count: items.length })
      for (let i = 0; i < items.length; i += columns) {
        rows.push({ type: "records", key: `${dept}-${i}`, items: items.slice(i, i + columns) })
      }
    })
    return rows
  }

  function canEditRecord(record: AttendanceRecord): boolean {
    if (!editMode || !currentStaff) return false
    return record.staffId !== currentStaff.id
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Attendance</AppText>
        </View>
        <View style={styles.headerSearch}>
          <AppInput
            placeholder="Search staff name..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
        <Pressable
          onPress={toggleExpandAll}
          style={styles.enrollBtn}
          hitSlop={8}
        >
          <ChevronsUpDown size={20} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <Pressable
          onPress={() => setEditMode((v) => !v)}
          style={styles.enrollBtn}
          hitSlop={8}
        >
          <Pencil size={22} color={editMode ? colors.accent : colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(admin)/attendance-dashboard")}
          style={styles.enrollBtn}
          hitSlop={8}
        >
          <BarChart3 size={22} color={colors.accent} strokeWidth={1.75} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(admin)/enroll")}
          style={styles.enrollBtn}
          hitSlop={8}
        >
          <UserPlus size={22} color={colors.accent} strokeWidth={1.75} />
        </Pressable>
      </View>

      {/* Date switcher */}
      <View style={[styles.dateBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={goToPrevDay} hitSlop={10} style={[styles.dateArrowBtn, { backgroundColor: colors.background.secondary }]}>
          <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={openDatePicker}
          style={[styles.datePill, { backgroundColor: isToday ? colors.accentSubtle : colors.background.secondary }]}
        >
          <AppText variant="bodyMedium" style={{ color: isToday ? colors.accent : colors.text.primary }}>
            {moment(selectedDate).format("dddd")}
          </AppText>
          <View style={[styles.datePillDivider, { backgroundColor: isToday ? colors.accent : colors.border, opacity: isToday ? 0.35 : 1 }]} />
          <AppText variant="body" style={{ color: isToday ? colors.accent : colors.text.secondary }}>
            {isToday ? `Today · ${moment(selectedDate).format("D MMM YYYY")}` : moment(selectedDate).format("D MMM YYYY")}
          </AppText>
          {Platform.OS === "web" &&
            React.createElement("input", {
              ref: webDateInputRef,
              type: "date",
              value: selectedDate,
              max: today,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.value) setSelectedDate(e.target.value)
              },
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              },
            })}
        </Pressable>

        <Pressable
          onPress={goToNextDay}
          hitSlop={10}
          disabled={isToday}
          style={[styles.dateArrowBtn, { backgroundColor: colors.background.secondary, opacity: isToday ? 0.35 : 1 }]}
        >
          <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
        </Pressable>
      </View>

      {Platform.OS === "ios" && (
        <Modal
          transparent
          visible={iosPickerVisible}
          animationType="slide"
          onRequestClose={() => setIosPickerVisible(false)}
        >
          <Pressable style={styles.datePickerOverlay} onPress={() => setIosPickerVisible(false)} />
          <View style={[styles.datePickerSheet, { backgroundColor: colors.background.secondary, borderTopColor: colors.border as string }]}>
            <View style={[styles.datePickerHandle, { backgroundColor: colors.border as string }]} />
            <DateTimePicker
              mode="date"
              value={iosTempDate}
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, d) => { if (d) setIosTempDate(d) }}
              themeVariant={isDark ? "dark" : "light"}
              style={{ width: "100%", height: 200 }}
            />
            <Pressable
              onPress={() => {
                setSelectedDate(moment(iosTempDate).format("YYYY-MM-DD"))
                setIosPickerVisible(false)
              }}
              style={[styles.datePickerDoneBtn, { backgroundColor: colors.accent }]}
            >
              <AppText variant="bodyMedium" style={{ color: "#FFFFFF" }}>Done</AppText>
            </Pressable>
          </View>
        </Modal>
      )}

      {/* Summary */}
      <View style={{ marginVertical: spacing[4] }}>
        <SummaryBar
          present={summary.present}
          late={summary.late}
          absent={summary.absent}
          isLoading={isLoading}
        />
      </View>


      {/* List */}
      {isDesktop ? (
        <FlatList
          key={`desktop-grid-${desktopColumns}`}
          data={buildGridRows(desktopColumns)}
          keyExtractor={(row) => row.key}
          renderItem={({ item: row, index }) =>
            row.type === "header" ? (
              <View style={styles.deptHeader}>
                <AppText variant="bodyMedium" color="secondary">{row.label}</AppText>
                <AppText variant="caption" color="tertiary">{"  "}{row.count}</AppText>
              </View>
            ) : (
              <AnimatedListItem index={index} style={[styles.deskGridRow, expandAllSignal.value && styles.deskGridRowStretch]}>
                {row.items.map((item) => (
                  <View key={item.staffId} style={{ flex: 1 }}>
                    <StaffCardDesktop record={item} canEdit={canEditRecord(item)} onEdit={setEditTarget} expandAllSignal={expandAllSignal} />
                  </View>
                ))}
              </AnimatedListItem>
            )
          }
          contentContainerStyle={styles.deskGridContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            isLoading ? (
              <AttendanceListSkeleton />
            ) : (
              <View style={styles.center}>
                <AppText color="tertiary">No attendance records for today</AppText>
              </View>
            )
          }
        />
      ) : (
      <FlatList
        data={buildGridRows(1)}
        keyExtractor={(row) => row.key}
        renderItem={({ item: row, index }) =>
          row.type === "header" ? (
            <View style={[styles.deptHeader, styles.deptHeaderPadded]}>
              <AppText variant="bodyMedium" color="secondary">{row.label}</AppText>
              <AppText variant="caption" color="tertiary">{"  "}{row.count}</AppText>
            </View>
          ) : (
            <AnimatedListItem index={index}>
              <AttendanceRow record={row.items[0]} canEdit={canEditRecord(row.items[0])} onEdit={setEditTarget} expandAllSignal={expandAllSignal} />
            </AnimatedListItem>
          )
        }
        contentContainerStyle={{ paddingBottom: spacing[20] }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <AttendanceListSkeleton />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No attendance records for today</AppText>
            </View>
          )
        }
      />
      )}

      {/* Edit sessions modal */}
      {editTarget && (
        <EditSessionsModal
          record={editTarget}
          date={selectedDate}
          onClose={() => setEditTarget(null)}
          onSaved={refetch}
        />
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
  enrollBtn: { padding: spacing[2] },
  headerSearch: { width: 180 },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    position: "relative",
    overflow: "hidden",
  },
  datePillDivider: { width: StyleSheet.hairlineWidth, height: 16 },
  datePickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  datePickerSheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    alignItems: "center",
  },
  datePickerHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: spacing[4] },
  datePickerDoneBtn: {
    width: "100%",
    height: 52,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
  },

  editSessionRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  editSessionRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editTimeField: {
    borderWidth: 1,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
  },
  editAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    justifyContent: "center",
  },

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

  deskGridContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[20],
    gap: spacing[4],
  },
  deskGridRow: {
    flexDirection: "row",
    gap: spacing[4],
    alignItems: "flex-start",
  },
  deskGridRowStretch: {
    alignItems: "stretch",
  },
  deptHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  deptHeaderPadded: {
    paddingHorizontal: spacing[5],
  },
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
  progressBarTrack: {
    flexDirection: "row",
    height: 3,
    borderRadius: radii.full,
    backgroundColor: palette.neutral[500] + "22",
    overflow: "hidden",
  },
  progressBarSegment: {
    height: "100%",
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  progressTooltip: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    elevation: 10,
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

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

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
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.success.default,
    borderWidth: 2,
  },

  timeline: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  timelineScrollable: {
    maxHeight: 100,
  },
  timelineGroup: {
    gap: spacing[3],
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  timelineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    width: 108,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineTimes: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    flexShrink: 0,
    minWidth: 78,
  },
  timeDash: {
    width: 16,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing[2],
    flexShrink: 0,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  liveBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.success.default,
  },

  // Modal
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    gap: spacing[3],
  },

  scanBottom: {
    alignItems: "center",
    paddingBottom: spacing[12],
    paddingTop: spacing[6],
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
})