import api from "./apiClient"
import type { CleaningItemKey, TodayCleaning } from "../types"

async function getTodayCleaning(date?: string): Promise<{ success: boolean; data: TodayCleaning }> {
  const { data } = await api.http.request({
    path: "/cleaning/today",
    method: "GET",
    query: date ? { date } : undefined,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: TodayCleaning }
}

async function updateCleaning(
  staffId: number,
  issues: CleaningItemKey[],
  date?: string
): Promise<{ success: boolean; data: object }> {
  const status = issues.length === 0 ? "ok" : "bad"
  const { data } = await api.http.request({
    path: `/cleaning/${staffId}`,
    method: "PUT",
    body: { status, ...(status === "bad" ? { violations: issues } : {}), ...(date ? { date } : {}) },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: object }
}

export const cleaningService = { getTodayCleaning, updateCleaning }
