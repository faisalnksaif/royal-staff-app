import moment from "moment"
import { colors as palette } from "../constants/theme"
import type { WorkStatus, WorkPriority, WorkRecurrence, WorkAssignment } from "../types"

/** Shared presentation rules for work, so every screen labels it identically. */

export const WORK_STATUS_CONFIG: Record<WorkStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: palette.warning.default },
  in_progress: { label: "In Progress", color: palette.info.default },
  completed: { label: "Completed", color: palette.success.default },
  cancelled: { label: "Cancelled", color: palette.neutral[400] },
}

export const WORK_PRIORITY_CONFIG: Record<WorkPriority, { label: string; color: string }> = {
  low: { label: "Low", color: palette.neutral[400] },
  normal: { label: "Normal", color: palette.warning.default },
  high: { label: "High", color: palette.error.default },
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Human sentence for a recurrence rule, e.g. "Every 2 weeks on Mon, Wed". */
export function describeRecurrence(recurrence?: WorkRecurrence | null): string {
  if (!recurrence || recurrence.frequency === "none") return "One-time"

  const { frequency, interval = 1, daysOfWeek = [], dayOfMonth } = recurrence
  const every = interval > 1 ? `Every ${interval} ` : "Every "

  if (frequency === "daily") {
    return interval > 1 ? `${every}days` : "Daily"
  }

  if (frequency === "weekly") {
    const days = daysOfWeek.length
      ? daysOfWeek.slice().sort().map((d) => WEEKDAY_LABELS[d]).join(", ")
      : null
    const base = interval > 1 ? `${every}weeks` : "Weekly"
    return days ? `${base} on ${days}` : base
  }

  if (frequency === "monthly") {
    const base = interval > 1 ? `${every}months` : "Monthly"
    return dayOfMonth ? `${base} on day ${dayOfMonth}` : base
  }

  return "One-time"
}

/** True when the work is still open and its deadline has passed. */
export function isOverdue(work: WorkAssignment): boolean {
  if (work.status === "completed" || work.status === "cancelled") return false
  return moment(work.deadline).isBefore(moment())
}

/**
 * Short, human due label relative to today - "Today", "Tomorrow", "3d late".
 * Overdue work reads as lateness so it stands out in a list.
 */
export function describeDue(work: WorkAssignment): { label: string; isUrgent: boolean } {
  const due = moment(work.dueDate, "YYYY-MM-DD")
  const today = moment().startOf("day")
  const days = due.diff(today, "days")

  if (work.status === "completed") {
    return { label: work.isLate ? "Completed late" : "Completed", isUrgent: false }
  }

  if (work.status === "cancelled") {
    return { label: "Cancelled", isUrgent: false }
  }

  if (days < 0) {
    const late = Math.abs(days)
    return { label: late === 1 ? "1 day late" : `${late} days late`, isUrgent: true }
  }

  if (days === 0) {
    // Same-day work with a time still has a deadline that can pass.
    const overdue = moment(work.deadline).isBefore(moment())
    return { label: overdue ? "Overdue today" : "Due today", isUrgent: true }
  }

  if (days === 1) return { label: "Due tomorrow", isUrgent: false }
  if (days <= 6) return { label: `Due in ${days} days`, isUrgent: false }

  return { label: `Due ${due.format("D MMM")}`, isUrgent: false }
}

/** "14:30" -> "2:30 PM"; null when the work is due end-of-day. */
export function formatDueTime(dueTime: string | null): string | null {
  if (!dueTime) return null
  return moment(dueTime, "HH:mm").format("h:mm A")
}

/** Groups work by how soon it's due - drives the sectioned "my work" list. */
export function groupByDue(items: WorkAssignment[]): Array<{ title: string; data: WorkAssignment[] }> {
  const today = moment().startOf("day")
  const buckets: Record<string, WorkAssignment[]> = {
    Overdue: [],
    Today: [],
    Tomorrow: [],
    "This Week": [],
    Later: [],
    Done: [],
  }

  for (const item of items) {
    if (item.status === "completed" || item.status === "cancelled") {
      buckets.Done.push(item)
      continue
    }

    const days = moment(item.dueDate, "YYYY-MM-DD").diff(today, "days")
    if (days < 0) buckets.Overdue.push(item)
    else if (days === 0) buckets.Today.push(item)
    else if (days === 1) buckets.Tomorrow.push(item)
    else if (days <= 7) buckets["This Week"].push(item)
    else buckets.Later.push(item)
  }

  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }))
}
