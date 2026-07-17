import api from "./apiClient"
import type { AppearanceItemKey, TodayAppearance } from "../types"

async function getTodayAppearance(): Promise<{ success: boolean; data: TodayAppearance }> {
  const { data } = await api.http.request({
    path: "/appearance/today",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: TodayAppearance }
}

async function updateAppearance(
  staffId: number,
  issues: AppearanceItemKey[]
): Promise<{ success: boolean; data: object }> {
  const status = issues.length === 0 ? "ok" : "bad"
  const { data } = await api.http.request({
    path: `/appearance/${staffId}`,
    method: "PUT",
    body: { status, ...(status === "bad" ? { violations: issues } : {}) },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: object }
}

export const appearanceService = { getTodayAppearance, updateAppearance }
