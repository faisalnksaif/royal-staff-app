import moment from "moment"

function ist(iso: string) {
  return moment.utc(iso).utcOffset(330)
}

export function formatDate(iso: string): string {
  return ist(iso).format("D MMM YYYY hh:mm A")
}

/** For API dates that arrive as "DD-MM-YYYY" (e.g. voucher_date) */
export function formatDMYDate(ddmmyyyy: string): string {
  return moment(ddmmyyyy, "DD-MM-YYYY").format("D MMM YYYY")
}

export function formatTime(iso: string): string {
  return ist(iso).format("hh:mm A")
}

export function formatDateTime(iso: string): string {
  return ist(iso).format("D MMM YYYY, hh:mm A")
}

export function toAPIDate(d: Date | moment.Moment): string {
  return moment(d).format("YYYY-MM-DD")
}

export function formatDisplayDate(d: Date): string {
  return moment(d).format("D MMM YYYY")
}

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function formatAmount(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

export function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
