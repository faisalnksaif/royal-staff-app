import { useState } from "react"
import { View } from "react-native"
import Popup from "../shared/Popup"
import AppText from "../ui/AppText"
import AppInput from "../ui/AppInput"
import AppButton from "../ui/AppButton"
import { spacing, colors as palette } from "../../constants/theme"
import { attendanceService } from "../../services/attendanceService"
import { toTitleCase } from "../../utils/helpers"
import { formatWorkHours } from "./helpers"
import type { AttendanceRecord } from "../../types"

export default function OvertimeApprovalModal({
  record, date, onClose, onSaved,
}: {
  record: AttendanceRecord
  date: string
  onClose: () => void
  onSaved: () => void
}) {
  const pending = record.pendingOvertimeMinutes ?? 0
  const [minutesText, setMinutesText] = useState(String(pending))
  const [reason, setReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    const parsed = Number(minutesText)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > pending) {
      setError(`Enter a value between 0 and ${pending}`)
      return
    }
    setIsSaving(true)
    setError("")
    try {
      await attendanceService.decideOvertime(record.staffId, date, true, parsed, reason.trim() || undefined)
      onSaved()
      onClose()
    } catch (e) {
      setError((e as Error).message ?? "Failed to approve overtime")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popup title={`Approve overtime · ${toTitleCase(record.staffName)}`} onClose={onClose}>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[3] }}>
        Computed: {formatWorkHours(pending / 60)} pending. Adjust the minutes to credit, or leave as-is to approve the full amount.
      </AppText>
      <AppInput
        label="Minutes to credit"
        value={minutesText}
        onChangeText={setMinutesText}
        keyboardType="numeric"
        style={{ marginBottom: spacing[3] }}
      />
      <AppInput
        label="Reason (optional)"
        value={reason}
        onChangeText={setReason}
        placeholder="e.g. Discounted late checkout - unconfirmed"
        style={{ marginBottom: spacing[3] }}
      />
      {!!error && (
        <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[3] }}>{error}</AppText>
      )}
      <View style={{ flexDirection: "row", gap: spacing[3] }}>
        <AppButton label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <AppButton label="Approve" onPress={handleConfirm} isLoading={isSaving} style={{ flex: 1 }} />
      </View>
    </Popup>
  )
}
