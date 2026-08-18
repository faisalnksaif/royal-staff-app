import api from "./apiClient"
import type { WelcomingCustomerItemKey, TodayWelcomingCustomer } from "../types"

async function getTodayWelcomingCustomer(date?: string): Promise<{ success: boolean; data: TodayWelcomingCustomer }> {
  const { data } = await api.http.request({
    path: "/welcoming-customer/today",
    method: "GET",
    query: date ? { date } : undefined,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: TodayWelcomingCustomer }
}

async function updateWelcomingCustomer(
  staffId: number,
  issues: WelcomingCustomerItemKey[],
  date?: string
): Promise<{ success: boolean; data: object }> {
  const status = issues.length === 0 ? "ok" : "bad"
  const { data } = await api.http.request({
    path: `/welcoming-customer/${staffId}`,
    method: "PUT",
    body: { status, ...(status === "bad" ? { violations: issues } : {}), ...(date ? { date } : {}) },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: object }
}

export const welcomingCustomerService = { getTodayWelcomingCustomer, updateWelcomingCustomer }
