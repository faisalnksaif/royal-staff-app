import api from "./apiClient"
import type { CustomerDealingItemKey, TodayCustomerDealing } from "../types"

async function getTodayCustomerDealing(date?: string): Promise<{ success: boolean; data: TodayCustomerDealing }> {
  const { data } = await api.http.request({
    path: "/customer-dealing/today",
    method: "GET",
    query: date ? { date } : undefined,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: TodayCustomerDealing }
}

async function updateCustomerDealing(
  staffId: number,
  issues: CustomerDealingItemKey[],
  date?: string
): Promise<{ success: boolean; data: object }> {
  const status = issues.length === 0 ? "ok" : "bad"
  const { data } = await api.http.request({
    path: `/customer-dealing/${staffId}`,
    method: "PUT",
    body: { status, ...(status === "bad" ? { violations: issues } : {}), ...(date ? { date } : {}) },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: object }
}

export const customerDealingService = { getTodayCustomerDealing, updateCustomerDealing }
