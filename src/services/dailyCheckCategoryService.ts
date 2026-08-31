import api from "./apiClient"
import type { DailyCheckCategoriesByDepartment, TodayDailyCheckCategory } from "../types"

async function getCategoriesByDepartment(): Promise<{ success: boolean; data: DailyCheckCategoriesByDepartment }> {
  const { data } = await api.http.request({
    path: "/daily-check/categories-by-department",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: DailyCheckCategoriesByDepartment }
}

export const dailyCheckCategoryService = { getCategoriesByDepartment }

function normalizePath(apiBasePath: string): string {
  return apiBasePath.replace(/^\/api/, "")
}

export function createCategoryService(apiBasePath: string) {
  const path = normalizePath(apiBasePath)

  async function getToday(date?: string): Promise<{ success: boolean; data: TodayDailyCheckCategory }> {
    const { data } = await api.http.request({
      path: `${path}/today`,
      method: "GET",
      query: date ? { date } : undefined,
      secure: true,
      format: "json",
    })
    return data as { success: boolean; data: TodayDailyCheckCategory }
  }

  async function update(staffId: number, violations: string[], remarks?: string, date?: string): Promise<{ success: boolean; data: object }> {
    const status = violations.length === 0 ? "ok" : "bad"
    const { data } = await api.http.request({
      path: `${path}/${staffId}`,
      method: "PUT",
      body: { status, ...(status === "bad" ? { violations, remarks: remarks ?? "" } : {}), ...(date ? { date } : {}) },
      secure: true,
      format: "json",
    })
    return data as { success: boolean; data: object }
  }

  return { getToday, update }
}
