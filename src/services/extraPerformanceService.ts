import api from "./apiClient"
import type { ExtraPerformance, ExtraPerformanceCategory, ExtraPerformanceStats } from "../types"

interface SubmitPerformancePayload {
  title: string
  description: string
  date: string
  category?: ExtraPerformanceCategory
}

async function submitPerformance(
  payload: SubmitPerformancePayload
): Promise<{ success: boolean; data: ExtraPerformance }> {
  const { data } = await api.http.request({
    path: "/extra-performance",
    method: "POST",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: ExtraPerformance }
}

async function getPendingPerformances(month?: string): Promise<{
  success: boolean
  data: { month: string; count: number; performances: ExtraPerformance[] }
}> {
  const qs = month ? `?month=${month}` : ""
  const { data } = await api.http.request({
    path: `/extra-performance/pending${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { month: string; count: number; performances: ExtraPerformance[] } }
}

async function approvePerformance(performanceId: string): Promise<{ success: boolean; data: ExtraPerformance }> {
  const { data } = await api.http.request({
    path: `/extra-performance/${performanceId}/approve`,
    method: "PUT",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: ExtraPerformance }
}

async function rejectPerformance(
  performanceId: string,
  rejectionReason: string
): Promise<{ success: boolean; data: ExtraPerformance }> {
  const { data } = await api.http.request({
    path: `/extra-performance/${performanceId}/reject`,
    method: "PUT",
    body: { rejectionReason },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: ExtraPerformance }
}

async function getApprovedPerformances(userId?: number, month?: string): Promise<{
  success: boolean
  data: { staffId: number; staffName: string; month: string; count: number; totalPoints: number; performances: ExtraPerformance[] }
}> {
  const params = new URLSearchParams()
  if (userId != null) params.set("userId", String(userId))
  if (month) params.set("month", month)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const { data } = await api.http.request({
    path: `/extra-performance/approved${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    data: { staffId: number; staffName: string; month: string; count: number; totalPoints: number; performances: ExtraPerformance[] }
  }
}

async function getStaffPerformances(userId?: number): Promise<{
  success: boolean
  data: { userId: number; staffName: string; stats: ExtraPerformanceStats; performances: ExtraPerformance[] }
}> {
  const qs = userId != null ? `?userId=${userId}` : ""
  const { data } = await api.http.request({
    path: `/extra-performance${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    data: { userId: number; staffName: string; stats: ExtraPerformanceStats; performances: ExtraPerformance[] }
  }
}

export const extraPerformanceService = {
  submitPerformance,
  getPendingPerformances,
  approvePerformance,
  rejectPerformance,
  getApprovedPerformances,
  getStaffPerformances,
}
