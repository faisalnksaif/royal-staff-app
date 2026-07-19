import api from "./apiClient"
import type { DashboardOverviewResponse } from "../types"
import type { FollowupDateField } from "./followupService"

export type DashboardPeriod = "today" | "yesterday" | "this_month"

export type ResolutionStatus = "resolved" | "open"

export interface DashboardOverviewParams {
  period?: DashboardPeriod
  startDate?: string
  endDate?: string
  dateField?: FollowupDateField
  outcome?: string
  resolutionStatus?: ResolutionStatus
}

async function getOverview(params: DashboardOverviewParams = {}): Promise<DashboardOverviewResponse> {
  const { period, startDate, endDate, dateField, outcome, resolutionStatus } = params
  const qs = new URLSearchParams()
  if (period) qs.set("period", period)
  if (startDate) qs.set("startDate", startDate)
  if (endDate) qs.set("endDate", endDate)
  if (dateField && dateField !== "loggedAt") qs.set("dateField", dateField)
  if (outcome) qs.set("outcome", outcome)
  if (resolutionStatus) qs.set("resolutionStatus", resolutionStatus)
  const query = qs.toString()
  const { data } = await api.http.request<DashboardOverviewResponse>({
    path: `/dashboard/overview${query ? `?${query}` : ""}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

export const dashboardService = { getOverview }
