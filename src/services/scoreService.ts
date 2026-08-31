import api from "./apiClient"
import type {
  MonthlyScoresData,
  ScoringConfig,
  ScoringConfigUpdatePayload,
  ScoringRubricByDepartment,
  StaffScore,
} from "../types"

async function getMonthlyOverview(
  month: string
): Promise<{ success: boolean; data: MonthlyScoresData }> {
  const { data } = await api.http.request({
    path: `/scores/monthly-overview?month=${month}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: MonthlyScoresData }
}

async function getScoringConfig(
  month: string,
  department?: string
): Promise<{ success: boolean; data: ScoringConfig }> {
  const query = department
    ? `?month=${month}&department=${encodeURIComponent(department)}`
    : `?month=${month}`
  const { data } = await api.http.request({
    path: `/scoring-config${query}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: ScoringConfig }
}

async function updateScoringConfig(
  payload: ScoringConfigUpdatePayload
): Promise<{ success: boolean; data: ScoringConfig }> {
  const { data } = await api.http.request({
    path: "/scoring-config",
    method: "PUT",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: ScoringConfig }
}

async function getDepartmentRubrics(): Promise<{
  success: boolean
  data: ScoringRubricByDepartment
}> {
  const { data } = await api.http.request({
    path: "/scoring-config/departments",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: ScoringRubricByDepartment }
}

async function calculateMonthly(month: string): Promise<{
  success: boolean
  data: { month: string; calculatedCount: number; totalStaff: number; scores: StaffScore[] }
}> {
  const { data } = await api.http.request({
    path: "/scores/calculate-monthly",
    method: "POST",
    body: { month },
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    data: { month: string; calculatedCount: number; totalStaff: number; scores: StaffScore[] }
  }
}

export const scoreService = {
  getMonthlyOverview,
  getScoringConfig,
  updateScoringConfig,
  getDepartmentRubrics,
  calculateMonthly,
}
