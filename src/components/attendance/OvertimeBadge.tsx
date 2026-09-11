import { View } from "react-native"
import AppText from "../ui/AppText"
import { colors as palette } from "../../constants/theme"
import { formatWorkHours } from "./helpers"
import type { AttendanceRecord } from "../../types"

export default function OvertimeBadge({ record, hidePending }: { record: AttendanceRecord; hidePending?: boolean }) {
  const approved = record.approvedOvertimeMinutes ?? 0
  const pending = record.pendingOvertimeMinutes ?? 0
  const status = record.overtimeApprovalStatus

  if (approved > 0) {
    return (
      <AppText variant="caption" style={{ color: palette.success.default }}>
        {"  ·  "}+{formatWorkHours(approved / 60)} OT
      </AppText>
    )
  }
  if (status === "pending" && pending > 0 && !hidePending) {
    return (
      <AppText variant="caption" style={{ color: palette.warning.default }}>
        {"  ·  "}{formatWorkHours(pending / 60)} OT pending
      </AppText>
    )
  }
  if (status === "rejected") {
    return (
      <AppText variant="caption" color="tertiary">
        {"  ·  "}OT rejected
      </AppText>
    )
  }
  return null
}
