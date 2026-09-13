import { Platform } from "react-native"
import api from "./apiClient"
import type { AllFollowUpsParams } from "./followupService"
import type {
  CustomersExportTab,
  LedgerOutstandingParams,
  RetentionParams,
  PaymentVelocityParams,
} from "../types"

// Export params mirror the matching list params minus `page`/`limit` - the
// export endpoints ignore pagination and return every row matching the
// filters, so passing either would be misleading. Declared here rather than in
// types/index.ts because AllFollowUpsParams lives in followupService, and
// types/index.ts is a dependency-free declaration file.
export type FollowupsExportParams = Omit<AllFollowUpsParams, "page" | "limit">

// The server names the file (dated, e.g. followups-2026-09-13.xlsx) and sends
// it in Content-Disposition; these are only used if that header is missing.
const FALLBACK_FILENAME = "export.xlsx"

function filenameFromDisposition(disposition: string | undefined, fallback: string): string {
  if (!disposition) return fallback
  const match = /filename="?([^"]+)"?/.exec(disposition)
  return match?.[1] ?? fallback
}

/**
 * Hands a downloaded blob to the browser as a file save.
 *
 * Web-only by design - the admin pages this is wired into are used in a
 * browser. On native this throws rather than failing silently, so if an admin
 * screen is ever opened in the app the cause is obvious; adding a native path
 * means expo-sharing + expo-file-system (see the export plan).
 */
function saveBlob(blob: Blob, filename: string): void {
  if (Platform.OS !== "web") {
    throw new Error("Excel export is only available in the web app")
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Revoking immediately can cancel the download in some browsers; a tick of
  // delay lets the navigation start first.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadXlsx(path: string, fallbackFilename: string): Promise<void> {
  const response = await api.http.request<Blob>({
    path,
    method: "GET",
    secure: true,
    format: "blob",
  })

  const filename = filenameFromDisposition(
    response.headers?.["content-disposition"] as string | undefined,
    fallbackFilename
  )
  saveBlob(response.data, filename)
}

/**
 * Exports follow-ups matching the filters currently on screen. Mirrors
 * followupService.getAllFollowups' query building exactly (same defaults
 * omitted) so the sheet matches the list - minus page/limit, which the export
 * endpoint ignores in favour of returning every matching row.
 */
async function exportFollowups(params: FollowupsExportParams = {}): Promise<void> {
  const { staffId, period, startDate, endDate, dateField, outcome, resolutionStatus, customerId, ledgerId, sortBy, order } = params
  const qs = new URLSearchParams()
  if (staffId != null) qs.set("staffId", String(staffId))
  if (period) qs.set("period", period)
  if (startDate) qs.set("startDate", startDate)
  if (endDate) qs.set("endDate", endDate)
  if (dateField && dateField !== "loggedAt") qs.set("dateField", dateField)
  if (outcome) qs.set("outcome", outcome)
  if (resolutionStatus) qs.set("resolutionStatus", resolutionStatus)
  if (customerId) qs.set("customerId", customerId)
  if (ledgerId != null) qs.set("ledgerId", String(ledgerId))
  if (sortBy && sortBy !== "loggedAt") qs.set("sortBy", sortBy)
  if (order && order !== "desc") qs.set("order", order)

  const query = qs.toString()
  await downloadXlsx(`/followups/export${query ? `?${query}` : ""}`, FALLBACK_FILENAME)
}

export interface CustomersExportParams {
  tab: CustomersExportTab
  outstanding?: Omit<LedgerOutstandingParams, "page" | "limit">
  retention?: Omit<RetentionParams, "page" | "limit">
  velocity?: Omit<PaymentVelocityParams, "page" | "limit">
}

/**
 * Exports the active tab of the Customers page. Each tab's params are built to
 * match its own list endpoint's conventions (note `retention_status` on
 * outstanding vs `status` on retention - the two endpoints genuinely differ).
 */
async function exportCustomers(params: CustomersExportParams): Promise<void> {
  const { tab } = params
  const qs = new URLSearchParams({ tab })

  if (tab === "outstanding") {
    const p = params.outstanding ?? {}
    if (p.search) qs.set("search", p.search)
    if (p.filter && p.filter !== "all") qs.set("filter", p.filter)
    if (p.retentionStatus && p.retentionStatus !== "all") qs.set("retention_status", p.retentionStatus)
    if (p.sortBy) qs.set("sortBy", p.sortBy)
    if (p.activeDays != null) qs.set("activeDays", String(p.activeDays))
    if (p.churnedDays != null) qs.set("churnedDays", String(p.churnedDays))
  }

  if (tab === "retention") {
    const p = params.retention ?? {}
    if (p.search) qs.set("search", p.search)
    if (p.status && p.status !== "all") qs.set("status", p.status)
    if (p.sortBy) qs.set("sortBy", p.sortBy)
    if (p.order) qs.set("order", p.order)
    if (p.activeDays != null) qs.set("activeDays", String(p.activeDays))
    if (p.churnedDays != null) qs.set("churnedDays", String(p.churnedDays))
  }

  if (tab === "velocity") {
    const p = params.velocity ?? {}
    if (p.search) qs.set("search", p.search)
    if (p.sortBy) qs.set("sortBy", p.sortBy)
    if (p.order) qs.set("order", p.order)
  }

  await downloadXlsx(`/ledger/export?${qs.toString()}`, FALLBACK_FILENAME)
}

/**
 * Exports one staff member's outstanding customers - the Customers tab of the
 * staff follow-ups screen. A different endpoint from exportCustomers'
 * outstanding tab: that one is company-wide, this one is scoped to the staff
 * member's owned book and carries their sales attribution.
 */
async function exportStaffCustomers(
  userId: number | string,
  params: Omit<LedgerOutstandingParams, "page" | "limit"> = {}
): Promise<void> {
  const { search, filter, retentionStatus, sortBy, activeDays, churnedDays } = params
  const qs = new URLSearchParams()
  if (search) qs.set("search", search)
  if (filter && filter !== "all") qs.set("filter", filter)
  if (retentionStatus && retentionStatus !== "all") qs.set("retention_status", retentionStatus)
  if (sortBy) qs.set("sortBy", sortBy)
  if (activeDays != null) qs.set("activeDays", String(activeDays))
  if (churnedDays != null) qs.set("churnedDays", String(churnedDays))

  const query = qs.toString()
  await downloadXlsx(
    `/ledger/staff/${userId}/outstanding/export${query ? `?${query}` : ""}`,
    FALLBACK_FILENAME
  )
}

export const exportService = {
  exportFollowups,
  exportCustomers,
  exportStaffCustomers,
}
