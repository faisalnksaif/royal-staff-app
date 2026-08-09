import api from "./apiClient"
import type { Meeting, MeetingAttendanceEntry, MeetingAttendanceStatus, MeetingHistoryEntry } from "../types"

interface CreateMeetingPayload {
  title: string
  date?: string
  notes?: string
}

async function createMeeting(payload: CreateMeetingPayload): Promise<{ success: boolean; data: Meeting }> {
  const { data } = await api.http.request({
    path: "/meetings",
    method: "POST",
    body: payload,
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: Meeting }
}

async function getMeetings(startDate?: string, endDate?: string): Promise<{ success: boolean; data: Meeting[] }> {
  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const { data } = await api.http.request({
    path: `/meetings${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: Meeting[] }
}

async function getMeeting(id: string): Promise<{
  success: boolean
  data: { meeting: Meeting; attendance: MeetingAttendanceEntry[]; absentCount: number; excusedCount: number }
}> {
  const { data } = await api.http.request({
    path: `/meetings/${id}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    data: { meeting: Meeting; attendance: MeetingAttendanceEntry[]; absentCount: number; excusedCount: number }
  }
}

async function updateAttendance(
  id: string,
  staffId: number,
  status: MeetingAttendanceStatus,
  reason?: string
): Promise<{ success: boolean; data: MeetingAttendanceEntry }> {
  const { data } = await api.http.request({
    path: `/meetings/${id}/attendance/${staffId}`,
    method: "PUT",
    body: { status, ...(reason ? { reason } : {}) },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; data: MeetingAttendanceEntry }
}

async function getStaffHistory(staffId: number, months?: number): Promise<{
  success: boolean
  data: { staffId: number; staffName: string; absentCount: number; excusedCount: number; history: MeetingHistoryEntry[] }
}> {
  const qs = months ? `?months=${months}` : ""
  const { data } = await api.http.request({
    path: `/meetings/staff/${staffId}/history${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data as {
    success: boolean
    data: { staffId: number; staffName: string; absentCount: number; excusedCount: number; history: MeetingHistoryEntry[] }
  }
}

export const meetingService = { createMeeting, getMeetings, getMeeting, updateAttendance, getStaffHistory }
