import { useState, useEffect, useMemo } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { Pencil, Plus, Trash2, CalendarOff, ChevronLeft, ChevronRight } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import DatePickerField from "../../components/shared/DatePickerField"
import Popup from "../../components/shared/Popup"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { useHolidays } from "../../hooks/useHolidays"
import { useRole } from "../../hooks/useRole"
import { holidayService } from "../../services/holidayService"
import { toAPIDate } from "../../utils/helpers"
import { useQueryClient } from "@tanstack/react-query"
import type { HolidayResponse } from "../../types"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// ─── helpers ─────────────────────────────────────────────────────────────────

/** "2026-01-26" -> "Mon, 26 January 2026". Parsed as a plain date, no timezone shift. */
function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number)
  const js = new Date(y, m - 1, d)
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][js.getDay()]
  return `${weekday}, ${d} ${MONTH_NAMES[m - 1]} ${y}`
}

function isPast(date: string): boolean {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  return date < todayStr
}

// ─── HolidayRow ──────────────────────────────────────────────────────────────

function HolidayRow({
  holiday, onEdit,
}: {
  holiday: HolidayResponse
  onEdit: () => void
}) {
  const { colors } = useTheme()
  const past = isPast(holiday.date)

  return (
    <AppCard elevation="sm" style={[styles.holidayCard, past && { opacity: 0.55 }]}>
      <View style={[styles.holidayAvatar, { backgroundColor: colors.accentSubtle }]}>
        <CalendarOff size={20} color={colors.accent} strokeWidth={1.75} />
      </View>
      <View style={styles.holidayInfo}>
        <AppText variant="bodyMedium">{holiday.name}</AppText>
        <AppText variant="caption" color="secondary">{formatDate(holiday.date)}</AppText>
        {holiday.notes ? (
          <AppText variant="caption" color="tertiary" numberOfLines={2}>{holiday.notes}</AppText>
        ) : null}
      </View>
      <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn}>
        <Pencil size={18} color={colors.text.tertiary} strokeWidth={1.75} />
      </Pressable>
    </AppCard>
  )
}

// ─── HolidayForm ─────────────────────────────────────────────────────────────
// Shared by the create and edit modals - the fields and validation are
// identical, only the submit action and the delete affordance differ.

function HolidayForm({
  initial, submitLabel, onSubmit, onDelete, onCancel,
}: {
  initial: { date: Date | null; name: string; notes: string }
  submitLabel: string
  onSubmit: (values: { date: string; name: string; notes: string }) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}) {
  const { colors } = useTheme()
  const [date, setDate] = useState<Date | null>(initial.date)
  const [name, setName] = useState(initial.name)
  const [notes, setNotes] = useState(initial.notes)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!date) return setError("Pick a date")
    if (!name.trim()) return setError("Name is required")

    setIsSaving(true)
    setError("")
    try {
      await onSubmit({ date: toAPIDate(date), name: name.trim(), notes: notes.trim() })
    } catch (e) {
      setError((e as Error).message ?? "Failed to save holiday")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setIsDeleting(true)
    setError("")
    try {
      await onDelete()
    } catch (e) {
      setError((e as Error).message ?? "Failed to remove holiday")
    } finally {
      setIsDeleting(false)
    }
  }

  const busy = isSaving || isDeleting

  // The picker shows "26 Jan 2026" but not the weekday, which is what decides
  // whether declaring this date actually changes anything - a holiday landing
  // on a Sunday is already an off day.
  const weekday = date ? moment(date).format("dddd") : null

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <DatePickerField
          label="Date"
          value={date}
          onChange={setDate}
          placeholder="Select a date"
        />
        {weekday && (
          <AppText variant="caption" color="accent" style={styles.hint}>
            {weekday}
            {moment(date).day() === 0 ? " — already a weekly off day" : ""}
          </AppText>
        )}
      </View>

      <View style={styles.field}>
        <AppInput
          label="Name"
          placeholder="Republic Day"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <AppInput
          label="Notes (optional)"
          placeholder="Why this date is a holiday"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={[styles.notice, { borderColor: colors.border as string, backgroundColor: colors.background.secondary }]}>
        <CalendarOff size={15} color={colors.text.tertiary} strokeWidth={1.75} />
        <AppText variant="caption" color="tertiary" style={{ flex: 1 }}>
          Nobody is rostered on this date. Anyone who works it is not marked late, and their hours become overtime pending approval.
        </AppText>
      </View>

      {error ? (
        <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[3] }}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        {onDelete && (
          <AppButton
            label={isDeleting ? "Removing…" : "Remove"}
            variant="destructive"
            onPress={handleDelete}
            disabled={busy}
            style={styles.actionBtn}
          />
        )}
        <View style={{ flex: 1 }} />
        <AppButton label="Cancel" variant="ghost" onPress={onCancel} disabled={busy} />
        <AppButton
          label={isSaving ? "Saving…" : submitLabel}
          onPress={handleSubmit}
          disabled={busy}
        />
      </View>
    </ScrollView>
  )
}

// ─── HolidaysScreen ──────────────────────────────────────────────────────────

export default function HolidaysScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const { canViewAttendance } = useRole()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [year, setYear] = useState(() => new Date().getFullYear())
  const [editTarget, setEditTarget] = useState<HolidayResponse | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const range = useMemo(
    () => ({ from: `${year}-01-01`, to: `${year}-12-31` }),
    [year]
  )

  const { data, isLoading, refetch, isRefetching } = useHolidays(range)
  const holidays = data?.data ?? []

  function onChanged() {
    refetch()
    queryClient.invalidateQueries({ queryKey: ["holidays"] })
    // Attendance figures depend on which dates are off days, so any cached
    // attendance view is stale once the holiday list changes.
    queryClient.invalidateQueries({ queryKey: ["attendance"] })
    queryClient.invalidateQueries({ queryKey: ["attendance-dashboard"] })
  }

  useEffect(() => {
    if (!canViewAttendance) router.replace("/(admin)")
  }, [canViewAttendance])

  if (!canViewAttendance) return null

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Holidays</AppText>
          <AppText variant="caption" color="tertiary">
            Days nobody is rostered — work becomes overtime
          </AppText>
        </View>
        <Pressable onPress={() => setCreateOpen(true)} hitSlop={8} style={styles.iconBtn}>
          <Plus size={20} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

      {/* Year switcher */}
      <View style={[styles.yearBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={8} style={styles.iconBtn}>
          <ChevronLeft size={18} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <AppText variant="bodyMedium">{year}</AppText>
        <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={8} style={styles.iconBtn}>
          <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <AppText variant="caption" color="tertiary">
          {holidays.length} {holidays.length === 1 ? "holiday" : "holidays"}
        </AppText>
      </View>

      <FlatList
        data={holidays}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <HolidayRow holiday={item} onEdit={() => setEditTarget(item)} />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No holidays declared for {year}</AppText>
            </View>
          )
        }
      />

      {createOpen && (
        <Popup title="Declare Holiday" onClose={() => setCreateOpen(false)} maxWidth={520}>
          <HolidayForm
            initial={{ date: null, name: "", notes: "" }}
            submitLabel="Declare Holiday"
            onCancel={() => setCreateOpen(false)}
            onSubmit={async (values) => {
              await holidayService.createHoliday({
                date: values.date,
                name: values.name,
                notes: values.notes || null,
              })
              onChanged()
              setCreateOpen(false)
            }}
          />
        </Popup>
      )}

      {editTarget && (
        <Popup title={editTarget.name} onClose={() => setEditTarget(null)} maxWidth={520}>
          <HolidayForm
            initial={{
              date: moment(editTarget.date, "YYYY-MM-DD").toDate(),
              name: editTarget.name,
              notes: editTarget.notes ?? "",
            }}
            submitLabel="Save Changes"
            onCancel={() => setEditTarget(null)}
            onSubmit={async (values) => {
              await holidayService.updateHoliday(editTarget._id, {
                date: values.date,
                name: values.name,
                notes: values.notes || null,
              })
              onChanged()
              setEditTarget(null)
            }}
            onDelete={async () => {
              await holidayService.deleteHoliday(editTarget._id)
              onChanged()
              setEditTarget(null)
            }}
          />
        </Popup>
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
  yearBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
  holidayCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  holidayAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  holidayInfo: { flex: 1, gap: spacing[1] },
  iconBtn: { padding: spacing[2] },

  field: { marginBottom: spacing[4] },
  hint: { marginTop: spacing[1] },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[5],
  },
  actionBtn: { paddingHorizontal: spacing[4] },
})
