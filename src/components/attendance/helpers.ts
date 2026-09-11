import moment from "moment"
import { colors as palette } from "../../constants/theme"
import type { AttendanceRecord, AttendanceSession } from "../../types"

export interface SessionGap {
  startTime: string
  endTime: string
  minutes: number
}

export function formatWorkHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Derives break windows from gaps between consecutive sessions' checkOut and
// the next session's checkIn. The API only reports a single summed daily
// break allowance/excess now, with no per-gap start/end, so the timeline UI
// reconstructs the actual gaps itself from session check-in/out times.
export function computeSessionGaps(sessions: AttendanceSession[]): SessionGap[] {
  const ordered = [...sessions].sort((a, b) => moment(a.checkIn).valueOf() - moment(b.checkIn).valueOf())
  const gaps: SessionGap[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    const current = ordered[i]
    const next = ordered[i + 1]
    if (!current.checkOut || !next.checkIn) continue
    const minutes = moment(next.checkIn).diff(moment(current.checkOut), "minutes")
    if (minutes <= 0) continue
    gaps.push({ startTime: current.checkOut, endTime: next.checkIn, minutes })
  }
  return gaps
}

export function statusColor(status: AttendanceRecord["status"]): string {
  switch (status) {
    case "present":  return palette.success.default
    case "late":     return palette.warning.default
    case "half-day": return palette.info.default
    case "absent":   return palette.neutral[500]
  }
}

export const STATUS_LABEL = { present: "Present", late: "Late", "half-day": "Half-day", absent: "Absent" }
export const STATUS_ORDER: Record<AttendanceRecord["status"], number> = { present: 0, late: 1, "half-day": 2, absent: 3 }

export function needsAttention(record: AttendanceRecord): boolean {
  const breakExcessMinutes = record.break?.excessMinutes ?? 0
  const hasAutoClosed = record.sessions?.some((s) => s.autoClosed)
  return record.status === "late" || breakExcessMinutes > 0 || !!hasAutoClosed || record.overtimeApprovalStatus === "pending"
}
