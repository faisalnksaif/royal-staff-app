import api from "./apiClient"
import type { CustomerQuotationFollowupItemKey, TodayCustomerQuotationFollowup } from "../types"

async function getTodayCustomerQuotationFollowup(date?: string): Promise<{
  success: boolean
  data: TodayCustomerQuotationFollowup
}> {
  const { data } = await api.http.request({
    path: "/customer-quotation-followup/today",
    method: "GET",
    query: date ? { date } : undefined,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: TodayCustomerQuotationFollowup }
}

async function updateCustomerQuotationFollowup(
  staffId: number,
  issues: CustomerQuotationFollowupItemKey[],
  date?: string
): Promise<{ success: boolean; data: object }> {
  const status = issues.length === 0 ? "ok" : "bad"
  const { data } = await api.http.request({
    path: `/customer-quotation-followup/${staffId}`,
    method: "PUT",
    body: { status, ...(status === "bad" ? { violations: issues } : {}), ...(date ? { date } : {}) },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: object }
}

export const customerQuotationFollowupService = { getTodayCustomerQuotationFollowup, updateCustomerQuotationFollowup }
