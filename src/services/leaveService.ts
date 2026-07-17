import api from "./apiClient"
import type { LeaveRequest, LeaveStatsOverview, LeaveBalance, LeaveStatus } from "../types"

async function getLeaves(status?: LeaveStatus): Promise<{ success: boolean; data: { count: number; leaves: LeaveRequest[] } }> {
  const qs = status ? `?status=${status}` : ""
  const { data } = await api.http.request({
    path: `/leaves${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { count: number; leaves: LeaveRequest[] } }
}

async function approveLeave(leaveId: string): Promise<{ success: boolean; data: { id: string; status: string; approvedAt: string } }> {
  const { data } = await api.http.request({
    path: `/leaves/${leaveId}/approve`,
    method: "PUT",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { id: string; status: string; approvedAt: string } }
}

async function rejectLeave(leaveId: string, rejectionReason: string): Promise<{ success: boolean; data: { id: string; status: string } }> {
  const { data } = await api.http.request({
    path: `/leaves/${leaveId}/reject`,
    method: "PUT",
    body: { rejectionReason },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { id: string; status: string } }
}

async function getLeaveStats(): Promise<{ success: boolean; data: LeaveStatsOverview }> {
  const { data } = await api.http.request({
    path: "/leaves/stats/overview",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: LeaveStatsOverview }
}

async function getLeaveBalance(staffId: number): Promise<{ success: boolean; data: LeaveBalance }> {
  const { data } = await api.http.request({
    path: `/leaves/balance/${staffId}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: LeaveBalance }
}

interface RequestLeavePayload {
  startDate: string
  endDate: string
  leaveType: "Personal" | "Medical"
  reason: string
  isException?: boolean
}

async function getMyLeaves(status?: LeaveStatus): Promise<{ success: boolean; data: { count: number; leaves: LeaveRequest[] } }> {
  const qs = status ? `?status=${status}` : ""
  const { data } = await api.http.request({
    path: `/leaves/my-requests${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { count: number; leaves: LeaveRequest[] } }
}

async function requestLeave(payload: RequestLeavePayload): Promise<{ success: boolean; data: { id: string; status: string; numberOfDays: number; remainingLeaves: number } }> {
  const { data } = await api.http.request({
    path: "/leaves/request",
    method: "POST",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { id: string; status: string; numberOfDays: number; remainingLeaves: number } }
}

async function deleteLeave(leaveId: string): Promise<{ success: boolean; data: { id: string; message: string } }> {
  const { data } = await api.http.request({
    path: `/leaves/${leaveId}`,
    method: "DELETE",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: { id: string; message: string } }
}

export const leaveService = { getLeaves, getMyLeaves, approveLeave, rejectLeave, getLeaveStats, getLeaveBalance, requestLeave, deleteLeave }
