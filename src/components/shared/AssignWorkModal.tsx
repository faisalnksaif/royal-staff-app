import { useMemo, useState } from "react"
import { View, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native"
import { useMutation } from "@tanstack/react-query"
import { Search, Check, ChevronRight, X } from "lucide-react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import Popup from "./Popup"
import DatePickerField from "./DatePickerField"
import TimeInput from "./TimeInput"
import { useTheme } from "../../providers/ThemeProvider"
import { useAssignableStaff } from "../../hooks/useWork"
import { workScheduleService } from "../../services/workScheduleService"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { WORK_PRIORITY_CONFIG, describeRecurrence } from "../../utils/work"
import type { WorkPriority, RecurrenceFrequency, AssignableStaff, UserRole } from "../../types"

const ROLE_LABELS: Record<string, string> = {
  superAdmin: "Super Admin",
  manager: "Manager",
  hr: "HR",
  staff: "Staff",
  scanner: "Scanner",
}

const FREQUENCIES: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

const WEEKDAYS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" },
]

/** Step 1 - who the work is for, grouped by role so the hierarchy is visible. */
function AssigneeStep({
  staff,
  isLoading,
  selected,
  onSelect,
}: {
  staff: AssignableStaff[]
  isLoading: boolean
  selected: AssignableStaff | null
  onSelect: (s: AssignableStaff) => void
}) {
  const { colors } = useTheme()
  const [query, setQuery] = useState("")

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? staff.filter((s) => s.name.toLowerCase().includes(q)) : staff

    // Most privileged first, so a super admin sees managers above staff.
    const order: UserRole[] = ["superAdmin", "manager", "hr", "staff"]
    return order
      .map((role) => ({ role, people: filtered.filter((s) => s.role === role) }))
      .filter((g) => g.people.length > 0)
  }, [staff, query])

  if (isLoading) {
    return <ActivityIndicator color={colors.accent} style={{ paddingVertical: spacing[10] }} />
  }

  if (staff.length === 0) {
    return (
      <View style={styles.emptyState}>
        <AppText color="tertiary">No one available to assign work to</AppText>
      </View>
    )
  }

  return (
    <View>
      <View style={[styles.searchBox, { borderColor: colors.border as string, backgroundColor: colors.background.secondary }]}>
        <Search size={14} color={colors.text.tertiary} strokeWidth={1.75} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary as string, outline: "none" } as any]}
          placeholder="Search people..."
          placeholderTextColor={colors.text.tertiary as string}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <X size={14} color={colors.text.tertiary} strokeWidth={1.75} />
          </Pressable>
        )}
      </View>

      {grouped.length === 0 && (
        <View style={styles.emptyState}>
          <AppText color="tertiary">No match for “{query.trim()}”</AppText>
        </View>
      )}

      {grouped.map((group) => (
        <View key={group.role} style={{ marginTop: spacing[4] }}>
          <AppText variant="caption" color="tertiary" style={styles.groupLabel}>
            {ROLE_LABELS[group.role] ?? group.role}
          </AppText>

          {group.people.map((person) => {
            const isActive = selected?.staffId === person.staffId
            return (
              <Pressable
                key={person.staffId}
                onPress={() => onSelect(person)}
                style={[
                  styles.personRow,
                  {
                    borderColor: (isActive ? colors.accent : colors.border) as string,
                    backgroundColor: isActive ? colors.accentSubtle : "transparent",
                  },
                ]}
              >
                <AppText variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                  {person.name}
                </AppText>
                {isActive && <Check size={16} color={colors.accent} strokeWidth={2.5} />}
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

/**
 * Schedules a new work. Two steps - pick the person, then describe the work -
 * so the assignee picker gets room to breathe instead of being a cramped
 * dropdown above a long form.
 */
export default function AssignWorkModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const { colors } = useTheme()
  const { data: assignable, isLoading } = useAssignableStaff()

  const [step, setStep] = useState<"who" | "what">("who")
  const [assignee, setAssignee] = useState<AssignableStaff | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [hasDueTime, setHasDueTime] = useState(false)
  const [dueTime, setDueTime] = useState("18:00")
  const [priority, setPriority] = useState<WorkPriority>("normal")
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("none")
  const [interval, setInterval] = useState(1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [until, setUntil] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      workScheduleService.createWork({
        title: title.trim(),
        description: description.trim() || null,
        assigneeStaffId: assignee!.staffId,
        priority,
        startDate: moment(startDate).format("YYYY-MM-DD"),
        dueTime: hasDueTime ? dueTime : null,
        recurrence:
          frequency === "none"
            ? undefined
            : {
                frequency,
                interval,
                daysOfWeek: frequency === "weekly" ? daysOfWeek : [],
                dayOfMonth: frequency === "monthly" ? moment(startDate).date() : null,
                until: until ? moment(until).format("YYYY-MM-DD") : null,
              },
      }),
    onSuccess: () => {
      onCreated()
      onClose()
    },
    onError: (e: any) => setError(e?.message ?? "Could not schedule this work"),
  })

  function toggleDay(day: number) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const recurrencePreview = describeRecurrence({
    frequency,
    interval,
    daysOfWeek,
    dayOfMonth: frequency === "monthly" ? moment(startDate).date() : null,
    until: null,
  })

  const canSubmit = !!assignee && !!title.trim() && !mutation.isPending

  // ─── Step 1: who ──────────────────────────────────────────────────────────
  if (step === "who") {
    return (
      <Popup title="Assign work to" onClose={onClose}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          <AssigneeStep
            staff={assignable?.data ?? []}
            isLoading={isLoading}
            selected={assignee}
            onSelect={(s) => {
              setAssignee(s)
              setStep("what")
            }}
          />
          <View style={{ height: spacing[4] }} />
        </ScrollView>
      </Popup>
    )
  }

  // ─── Step 2: what ─────────────────────────────────────────────────────────
  return (
    <Popup title="New work" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Who it's for, tappable to go back and change */}
        <Pressable
          onPress={() => setStep("who")}
          style={[styles.assigneeChip, { borderColor: colors.border as string, backgroundColor: colors.background.secondary }]}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="tertiary">Assigned to</AppText>
            <AppText variant="bodyMedium">{assignee?.name}</AppText>
          </View>
          <AppText variant="caption" color="tertiary" style={{ marginRight: spacing[1] }}>
            {ROLE_LABELS[assignee?.role ?? ""] ?? assignee?.role}
          </AppText>
          <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Work</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="What needs to be done?"
          placeholderTextColor={colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Details (optional)</AppText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="Any instructions or context..."
          placeholderTextColor={colors.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <View style={{ marginTop: spacing[4] }}>
          <DatePickerField
            label={frequency === "none" ? "Deadline" : "Starts on"}
            value={startDate}
            onChange={setStartDate}
          />
        </View>

        {/* Optional time-of-day deadline - off by default means end of day */}
        <Pressable onPress={() => setHasDueTime((v) => !v)} style={styles.toggleRow}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: (hasDueTime ? colors.accent : colors.border) as string,
                backgroundColor: hasDueTime ? colors.accent : "transparent",
              },
            ]}
          >
            {hasDueTime && <Check size={12} color={colors.background.primary as string} strokeWidth={3} />}
          </View>
          <AppText variant="body" color="secondary">Set a time deadline</AppText>
        </Pressable>

        {hasDueTime && (
          <View style={{ marginTop: spacing[2] }}>
            <TimeInput label="Due by" value={dueTime} onChange={setDueTime} />
          </View>
        )}

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Priority</AppText>
        <View style={styles.segmentRow}>
          {(["low", "normal", "high"] as WorkPriority[]).map((p) => {
            const isActive = p === priority
            const conf = WORK_PRIORITY_CONFIG[p]
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.segment,
                  {
                    borderColor: (isActive ? conf.color : colors.border) as string,
                    backgroundColor: isActive ? conf.color + "1a" : "transparent",
                  },
                ]}
              >
                <AppText variant="caption" style={{ color: (isActive ? conf.color : colors.text.secondary) as string }}>
                  {conf.label}
                </AppText>
              </Pressable>
            )
          })}
        </View>

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Repeat</AppText>
        <View style={styles.segmentRow}>
          {FREQUENCIES.map((f) => {
            const isActive = f.value === frequency
            return (
              <Pressable
                key={f.value}
                onPress={() => setFrequency(f.value)}
                style={[
                  styles.segment,
                  {
                    borderColor: (isActive ? colors.accent : colors.border) as string,
                    backgroundColor: isActive ? colors.accentSubtle : "transparent",
                  },
                ]}
              >
                <AppText variant="caption" style={{ color: (isActive ? colors.accent : colors.text.secondary) as string }}>
                  {f.label}
                </AppText>
              </Pressable>
            )
          })}
        </View>

        {frequency === "weekly" && (
          <>
            <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>On these days</AppText>
            <View style={styles.dayRow}>
              {WEEKDAYS.map((d, i) => {
                const isActive = daysOfWeek.includes(d.value)
                return (
                  <Pressable
                    key={`${d.value}-${i}`}
                    onPress={() => toggleDay(d.value)}
                    style={[
                      styles.dayChip,
                      {
                        borderColor: (isActive ? colors.accent : colors.border) as string,
                        backgroundColor: isActive ? colors.accent : "transparent",
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{ color: (isActive ? colors.background.primary : colors.text.secondary) as string, fontWeight: "600" }}
                    >
                      {d.label}
                    </AppText>
                  </Pressable>
                )
              })}
            </View>
            {daysOfWeek.length === 0 && (
              <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[2] }}>
                Repeats on {moment(startDate).format("dddd")} if no day is picked
              </AppText>
            )}
          </>
        )}

        {frequency !== "none" && (
          <>
            <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>
              Every
            </AppText>
            <View style={styles.segmentRow}>
              {[1, 2, 3, 4].map((n) => {
                const isActive = n === interval
                const unit = frequency === "daily" ? "day" : frequency === "weekly" ? "wk" : "mo"
                return (
                  <Pressable
                    key={n}
                    onPress={() => setInterval(n)}
                    style={[
                      styles.segment,
                      {
                        borderColor: (isActive ? colors.accent : colors.border) as string,
                        backgroundColor: isActive ? colors.accentSubtle : "transparent",
                      },
                    ]}
                  >
                    <AppText variant="caption" style={{ color: (isActive ? colors.accent : colors.text.secondary) as string }}>
                      {n === 1 ? `1 ${unit}` : `${n} ${unit}s`}
                    </AppText>
                  </Pressable>
                )
              })}
            </View>

            <View style={{ marginTop: spacing[4] }}>
              <DatePickerField
                label="Repeat until (optional)"
                value={until}
                onChange={setUntil}
                placeholder="No end date"
              />
            </View>

            <View style={[styles.previewBox, { backgroundColor: colors.accentSubtle }]}>
              <AppText variant="caption" style={{ color: colors.accent as string }}>
                {recurrencePreview}
                {until ? ` until ${moment(until).format("D MMM YYYY")}` : ""}
              </AppText>
            </View>
          </>
        )}

        {error && (
          <View style={[styles.errorBox, { backgroundColor: palette.error.default + "1a" }]}>
            <AppText variant="caption" style={{ color: palette.error.default }}>{error}</AppText>
          </View>
        )}

        <AppButton
          label={mutation.isPending ? "Assigning…" : "Assign Work"}
          onPress={() => {
            setError(null)
            mutation.mutate()
          }}
          disabled={!canSubmit}
          style={{ marginTop: spacing[5] }}
        />
        <View style={{ height: spacing[4] }} />
      </ScrollView>
    </Popup>
  )
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: spacing[1] },
  groupLabel: { textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing[2] },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  emptyState: { alignItems: "center", paddingVertical: spacing[10] },

  assigneeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  fieldLabel: { marginTop: spacing[4], marginBottom: spacing[2] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: spacing[3], fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[4],
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  segmentRow: { flexDirection: "row", gap: spacing[2] },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
  },

  dayRow: { flexDirection: "row", gap: spacing[1] },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.md,
  },

  previewBox: {
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: radii.md,
  },
  errorBox: {
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: radii.md,
  },
})
