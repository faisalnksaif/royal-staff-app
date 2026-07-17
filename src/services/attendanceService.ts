import api from "./apiClient"
import type { AttendanceScanResponse, AttendanceDayResponse, StaffListResponse } from "../types"

async function scanFingerprint(
  staffId: number,
  fingerprintTemplate: string,
  timestamp: string
): Promise<AttendanceScanResponse> {
  const { data } = await api.http.request<AttendanceScanResponse>({
    path: "/attendance/scan",
    method: "POST",
    body: { staffId, fingerprintTemplate, timestamp },
    secure: true,
    format: "json",
  })
  return data
}

async function enrollFingerprint(
  staffId: number,
  fingerprintTemplate: string
): Promise<{ success: boolean; message: string; enrollmentCount: number; readyForAttendance: boolean }> {
  const { data } = await api.http.request({
    path: `/attendance/enroll/${staffId}`,
    method: "POST",
    body: { fingerprintTemplate },
    secure: true,
    format: "json",
  })
  return data as { success: boolean; message: string; enrollmentCount: number; readyForAttendance: boolean }
}

async function getAttendance(date: string): Promise<AttendanceDayResponse> {
  const { data } = await api.http.request<AttendanceDayResponse>({
    path: `/attendance?date=${date}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getStaff(): Promise<StaffListResponse> {
  const { data } = await api.http.request<StaffListResponse>({
    path: "/staff",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

export const attendanceService = { scanFingerprint, enrollFingerprint, getAttendance, getStaff }
