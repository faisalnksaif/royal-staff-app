import React, { useState, useRef } from "react"
import { View, ScrollView, Pressable, Platform, StyleSheet } from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { Plus, Trash2 } from "lucide-react-native"
import moment from "moment"
import Popup from "../shared/Popup"
import ConfirmModal from "../shared/ConfirmModal"
import AppText from "../ui/AppText"
import AppInput from "../ui/AppInput"
import AppButton from "../ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { attendanceService } from "../../services/attendanceService"
import { toTitleCase } from "../../utils/helpers"
import type { AttendanceRecord } from "../../types"

/** Force a picked time onto the record's own day, so editing a past day never rolls to the next date. */
function onDay(date: string, picked: Date) {
  return moment(date, "YYYY-MM-DD")
    .hour(picked.getHours())
    .minute(picked.getMinutes())
    .second(0)
    .millisecond(0)
    .toDate()
}

interface EditableSession {
  key: string
  checkIn: Date
  checkOut: Date | null
}

function SessionTimeInput({
  label, value, onChange, onClear, date,
}: {
  label: string
  value: Date | null
  onChange: (d: Date) => void
  onClear?: () => void
  date: string
}) {
  const { colors, isDark } = useTheme()
  const webInputRef = useRef<HTMLInputElement | null>(null)
  const defaultDate = () => moment(date, "YYYY-MM-DD").hour(9).minute(0).second(0).toDate()

  function open() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value ?? defaultDate(),
        mode: "time",
        is24Hour: false,
        onChange: (_, d) => { if (d) onChange(onDay(date, d)) },
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
            value={value ?? defaultDate()}
            display="compact"
            onChange={(_, d) => { if (d) onChange(onDay(date, d)) }}
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
            const base = defaultDate()
            base.setHours(h, m, 0, 0)
            onChange(onDay(date, base))
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

export default function EditSessionsModal({
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
      checkIn: onDay(date, new Date(s.checkIn)),
      checkOut: s.checkOut ? onDay(date, new Date(s.checkOut)) : null,
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
                  date={date}
                />
                <SessionTimeInput
                  label="Check-out"
                  value={s.checkOut}
                  onChange={(d) => updateSession(s.key, { checkOut: d })}
                  onClear={() => updateSession(s.key, { checkOut: null })}
                  date={date}
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

const styles = StyleSheet.create({
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
})
