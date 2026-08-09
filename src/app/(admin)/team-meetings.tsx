import { toTitleCase } from "../../utils/helpers"
import { useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, Clock3, Plus, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react-native"
import Toast from "react-native-toast-message"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import DatePickerField from "../../components/shared/DatePickerField"
import Popup from "../../components/shared/Popup"
import ListRow, { ListRowPill } from "../../components/shared/ListRow"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { meetingService } from "../../services/meetingService"
import type { Meeting, MeetingAttendanceEntry, MeetingAttendanceStatus } from "../../types"

function meetingErrorMessage(e: unknown, fallback: string): string {
  return (e as Error)?.message ?? fallback
}

const STATUS_CONFIG: Record<MeetingAttendanceStatus, { label: string; color: string }> = {
  present: { label: "Present", color: palette.success.default },
  absent: { label: "Absent", color: palette.error.default },
  excused: { label: "Excused", color: palette.warning.default },
}

// ─── CreateMeetingModal ────────────────────────────────────────────────────────

function CreateMeetingModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: (meetingId: string) => void
}) {
  const { colors } = useTheme()
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: () => meetingService.createMeeting({
      title: title.trim(),
      ...(date ? { date: moment(date).toISOString() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    }),
    onSuccess: (res) => { onSuccess(res.data._id); onClose(); reset() },
    onError: (e) => setError(meetingErrorMessage(e, "Failed to create meeting")),
  })

  function reset() {
    setTitle(""); setDate(null); setNotes(""); setError("")
  }

  function handleSubmit() {
    if (!title.trim()) { setError("Please enter a meeting title"); return }
    setError("")
    mutation.mutate()
  }

  if (!visible) return null

  return (
    <Popup title="Create Meeting" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Title</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="e.g. Weekly Sales Review"
          placeholderTextColor={colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.fieldLabel}>
          <DatePickerField label="Date & Time (optional)" value={date} onChange={setDate} placeholder="Defaults to now" />
        </View>

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Notes (optional)</AppText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="e.g. Discuss Q3 targets"
          placeholderTextColor={colors.text.tertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[3] }}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          label={mutation.isPending ? "Creating…" : "Create Meeting"}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          style={{ marginTop: spacing[4] }}
        />
        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── ExcuseModal ────────────────────────────────────────────────────────────────

function ExcuseModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
}: {
  visible: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}) {
  const { colors } = useTheme()
  const [reason, setReason] = useState("")

  function handleConfirm() {
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  if (!visible) return null

  return (
    <Popup title="Mark Excused" onClose={onClose}>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
        Provide a reason for the excused absence (required). Excused absences don't count against the Meeting score.
      </AppText>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
        placeholder="e.g. On approved leave"
        placeholderTextColor={colors.text.tertiary}
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <View style={styles.modalActions}>
        <AppButton label="Cancel" variant="ghost" onPress={onClose} />
        <AppButton
          label={isLoading ? "Saving…" : "Mark Excused"}
          onPress={handleConfirm}
          disabled={!reason.trim() || isLoading}
        />
      </View>
    </Popup>
  )
}

// ─── AttendanceRow ──────────────────────────────────────────────────────────────

function AttendanceRow({
  item,
  index,
  onMarkPresent,
  onMarkAbsent,
  onMarkExcused,
  isBusy,
}: {
  item: MeetingAttendanceEntry
  index: number
  onMarkPresent: () => void
  onMarkAbsent: () => void
  onMarkExcused: () => void
  isBusy: boolean
}) {
  const { colors, isDark } = useTheme()
  const status = STATUS_CONFIG[item.status]
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]

  const menuItems = [
    ...(item.status !== "present"
      ? [{ label: "Mark Present", icon: <Check size={16} color={palette.success.default} strokeWidth={2.5} />, color: palette.success.default, onPress: onMarkPresent }]
      : []),
    ...(item.status !== "absent"
      ? [{ label: "Mark Absent", icon: <X size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onMarkAbsent }]
      : []),
    ...(item.status !== "excused"
      ? [{ label: "Mark Excused", icon: <Clock3 size={16} color={palette.warning.default} strokeWidth={1.75} />, color: palette.warning.default, onPress: onMarkExcused }]
      : []),
  ]

  const pills: ListRowPill[] = [
    { key: "status", label: status.label, color: status.color, bgColor: status.color + "22" },
  ]

  return (
    <ListRow
      number={index + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName)}
      pills={pills}
      menuItems={menuItems}
      isBusy={isBusy}
      metaLines={item.status === "excused" && item.reason ? [
        <AppText key="reason" variant="bodySmall" numberOfLines={2} color="tertiary">
          {item.reason}
        </AppText>,
      ] : []}
    />
  )
}

// ─── MeetingDetail ──────────────────────────────────────────────────────────────

function MeetingDetail({ meetingId, onBack }: { meetingId: string; onBack: () => void }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [excuseTarget, setExcuseTarget] = useState<number | null>(null)
  const [actionStaffId, setActionStaffId] = useState<number | null>(null)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => meetingService.getMeeting(meetingId),
  })

  const updateMutation = useMutation({
    mutationFn: ({ staffId, status, reason }: { staffId: number; status: MeetingAttendanceStatus; reason?: string }) =>
      meetingService.updateAttendance(meetingId, staffId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] })
      setExcuseTarget(null)
      setActionStaffId(null)
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: meetingErrorMessage(e, "Failed to update attendance") })
      setActionStaffId(null)
    },
  })

  const meeting = data?.data?.meeting
  const attendance = data?.data?.attendance ?? []
  const absentCount = data?.data?.absentCount ?? 0
  const excusedCount = data?.data?.excusedCount ?? 0

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onBack} hitSlop={8} style={{ padding: spacing[2] }}>
          <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.75} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="heading3" numberOfLines={1}>{meeting?.title ?? "Meeting"}</AppText>
          <AppText variant="caption" color="tertiary">
            {meeting ? moment(meeting.date).format("D MMM YYYY, h:mm A") : ""}
          </AppText>
        </View>
      </View>

      <View style={[styles.statsBar, { borderBottomColor: colors.border }]}>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <>
            <View style={styles.statsItem}>
              <AppText variant="heading3" style={{ color: palette.error.default }}>{absentCount}</AppText>
              <AppText variant="caption" color="tertiary">Absent</AppText>
            </View>
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statsItem}>
              <AppText variant="heading3" style={{ color: palette.warning.default }}>{excusedCount}</AppText>
              <AppText variant="caption" color="tertiary">Excused</AppText>
            </View>
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statsItem}>
              <AppText variant="heading3" style={{ color: palette.success.default }}>{attendance.length - absentCount - excusedCount}</AppText>
              <AppText variant="caption" color="tertiary">Present</AppText>
            </View>
          </>
        )}
      </View>

      <FlatList
        data={attendance}
        keyExtractor={(item) => String(item.staffId)}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <AttendanceRow
              item={item}
              index={index}
              onMarkPresent={() => {
                setActionStaffId(item.staffId)
                updateMutation.mutate({ staffId: item.staffId, status: "present" })
              }}
              onMarkAbsent={() => {
                setActionStaffId(item.staffId)
                updateMutation.mutate({ staffId: item.staffId, status: "absent" })
              }}
              onMarkExcused={() => setExcuseTarget(item.staffId)}
              isBusy={updateMutation.isPending && actionStaffId === item.staffId}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No staff found</AppText>
            </View>
          )
        }
      />

      <ExcuseModal
        visible={excuseTarget != null}
        onClose={() => { setExcuseTarget(null); setActionStaffId(null) }}
        onConfirm={(reason) => {
          if (excuseTarget != null) {
            setActionStaffId(excuseTarget)
            updateMutation.mutate({ staffId: excuseTarget, status: "excused", reason })
          }
        }}
        isLoading={updateMutation.isPending}
      />
    </View>
  )
}

// ─── MeetingCard ────────────────────────────────────────────────────────────────

function MeetingCard({ item, onPress }: { item: Meeting; onPress: () => void }) {
  const { colors, isDark } = useTheme()
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]

  return (
    <Pressable onPress={onPress}>
      <ListRow
        number={0}
        avatarColor={avatarColor}
        avatarBgColor={avatarBgColor}
        title={item.title}
        trailing={<ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
        metaLines={[
          <AppText key="date" variant="body" style={{ color: colors.text.secondary as string }}>
            {moment(item.date).format("D MMM YYYY, h:mm A")}
          </AppText>,
          ...(item.notes ? [
            <AppText key="notes" variant="bodySmall" numberOfLines={2} color="tertiary">
              {item.notes}
            </AppText>,
          ] : []),
        ]}
      />
    </Pressable>
  )
}

// ─── MeetingsListView ───────────────────────────────────────────────────────────

function MeetingsListView({ onSelect }: { onSelect: (id: string) => void }) {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => meetingService.getMeetings(),
  })

  const meetings = data?.data ?? []

  function onCreateSuccess(meetingId: string) {
    queryClient.invalidateQueries({ queryKey: ["meetings"] })
    onSelect(meetingId)
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Meetings</AppText>
          <AppText variant="caption" color="tertiary">All active staff default to present</AppText>
        </View>
        <Pressable
          onPress={() => refetch()}
          hitSlop={8}
          style={{ padding: spacing[2] }}
        >
          {isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
        <Pressable onPress={() => setCreateOpen(true)} style={[styles.createBtn, { backgroundColor: colors.accent }]}>
          <Plus size={16} color="#fff" strokeWidth={2.5} />
          <AppText variant="caption" style={{ color: "#fff" }}>New</AppText>
        </Pressable>
      </View>

      <FlatList
        data={meetings}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <MeetingCard item={item} onPress={() => onSelect(item._id)} />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No meetings yet</AppText>
            </View>
          )
        }
      />

      <CreateMeetingModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={onCreateSuccess}
      />
    </View>
  )
}

// ─── MeetingsScreen ─────────────────────────────────────────────────────────────

export default function MeetingsScreen() {
  const { colors } = useTheme()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {selectedId ? (
        <MeetingDetail meetingId={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <MeetingsListView onSelect={setSelectedId} />
      )}
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

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
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
  },

  statsBar: {
    flexDirection: "row",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-around",
    minHeight: 64,
    alignItems: "center",
  },
  statsItem: { alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[3] },
  statsDivider: { width: StyleSheet.hairlineWidth, height: 32 },

  rowList: { paddingBottom: spacing[16] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

  fieldLabel: { marginBottom: spacing[2], marginTop: spacing[4] },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    marginBottom: spacing[1],
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing[3],
  },
})
