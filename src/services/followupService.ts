import api from "./apiClient"
import type { StaffFollowupsResponse, CreateFollowupPayload } from "../types"

export type FollowupPeriod = "today" | "yesterday" | "this_month"
export type FollowupDateField = "loggedAt" | "promisedDate" | "resolvedAt"

export interface StaffFollowupsParams {
  limit?: number
  period?: FollowupPeriod
  startDate?: string
  endDate?: string
  dateField?: FollowupDateField
  outcome?: string
}

async function getStaffFollowups(
  staffId: number | string,
  params: StaffFollowupsParams = {}
): Promise<StaffFollowupsResponse> {
  const { limit = 100, period, startDate, endDate, dateField, outcome } = params
  const qs = new URLSearchParams({ limit: String(limit) })
  if (period) qs.set("period", period)
  if (startDate) qs.set("startDate", startDate)
  if (endDate) qs.set("endDate", endDate)
  if (dateField && dateField !== "loggedAt") qs.set("dateField", dateField)
  if (outcome) qs.set("outcome", outcome)
  const { data } = await api.http.request<StaffFollowupsResponse>({
    path: `/followups/staff/${staffId}?${qs.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getCustomerFollowups(
  customerId: number | string,
  limit = 50
): Promise<StaffFollowupsResponse> {
  const { data } = await api.http.request<StaffFollowupsResponse>({
    path: `/followups/customer/${customerId}?limit=${limit}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function createFollowup(payload: CreateFollowupPayload): Promise<void> {
  await api.followUps.followupsCreate(payload)
}

async function logWhatsApp(
  followupId: string,
  payload: { staffId: number; type: "receipt" | "reminder"; mobile: string; amountMentioned?: number }
): Promise<void> {
  await api.http.request({
    path: `/followups/${followupId}/whatsapp`,
    method: "POST",
    body: payload,
    secure: true,
    type: "application/json",
  })
}

export const followupService = { getStaffFollowups, getCustomerFollowups, createFollowup, logWhatsApp }
