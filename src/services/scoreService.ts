import api from "./apiClient"
import type { MonthlyScoresData, ScoringConfig, StaffScore } from "../types"

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
  month: string
): Promise<{ success: boolean; data: ScoringConfig }> {
  const { data } = await api.http.request({
    path: `/scoring-config?month=${month}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: ScoringConfig }
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

export const scoreService = { getMonthlyOverview, getScoringConfig, calculateMonthly }
