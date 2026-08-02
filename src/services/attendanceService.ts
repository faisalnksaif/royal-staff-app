import { Platform } from "react-native"
import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { AttendanceScanResponse, AttendanceDayResponse, AttendanceSummaryResponse, AttendanceDashboardResponse, StaffListResponse, FaceEnrollResponse, EnrollmentPose, AttendanceRecord, RecentScansResponse } from "../types"

// Web's FormData needs a real Blob; React Native's FormData needs a plain
// { uri, name, type } descriptor — fetch().blob() on a file:// URI is what's
// unsupported on Android/Hermes, not on web.
async function photoToFormFile(photoUri: string): Promise<{ uri: string; name: string; type: string } | Blob> {
  if (Platform.OS === "web") {
    const response = await fetch(photoUri)
    return await response.blob()
  }
  return { uri: photoUri, name: "photo.jpg", type: "image/jpeg" }
}

async function scanFace(photoUri: string, timestamp: string, lat: number, lng: number): Promise<AttendanceScanResponse> {
  const photo = await photoToFormFile(photoUri)
  const { data } = await api.http.request<AttendanceScanResponse>({
    path: "/attendance/scan",
    method: "POST",
    body: { photo, timestamp, lat, lng },
    type: ContentType.FormData,
    secure: true,
    format: "json",
  })
  return data
}

async function getRecentScans(limit?: number): Promise<RecentScansResponse> {
  const qs = limit != null ? `?limit=${limit}` : ""
  const { data } = await api.http.request<RecentScansResponse>({
    path: `/attendance/scans/recent${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function enrollFace(staffId: number, photoUri: string, pose: EnrollmentPose): Promise<FaceEnrollResponse> {
  const photo = await photoToFormFile(photoUri)
  const { data } = await api.http.request<FaceEnrollResponse>({
    path: `/attendance/enroll/${staffId}`,
    method: "POST",
    body: { photo, pose },
    type: ContentType.FormData,
    secure: true,
    format: "json",
  })
  return data
}

async function deleteFaceEnrollment(staffId: number): Promise<{ success: boolean }> {
  const { data } = await api.http.request<{ success: boolean }>({
    path: `/attendance/enroll/${staffId}`,
    method: "DELETE",
    secure: true,
    format: "json",
  })
  return data
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

async function getAttendanceSummary(date: string): Promise<AttendanceSummaryResponse> {
  const { data } = await api.http.request<AttendanceSummaryResponse>({
    path: `/attendance/summary/${date}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getAttendanceDashboard(startDate: string, endDate: string): Promise<AttendanceDashboardResponse> {
  const { data } = await api.http.request<AttendanceDashboardResponse>({
    path: `/attendance/dashboard?startDate=${startDate}&endDate=${endDate}`,
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

async function editSessions(
  staffId: number,
  date: string,
  sessions: { checkIn: string; checkOut: string | null }[],
  reason?: string
): Promise<{ success: boolean; data: AttendanceRecord }> {
  const { data } = await api.http.request<{ success: boolean; data: AttendanceRecord }>({
    path: `/attendance/${staffId}/${date}/sessions`,
    method: "PATCH",
    body: { sessions, reason },
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data
}

export const attendanceService = { scanFace, getRecentScans, enrollFace, deleteFaceEnrollment, getAttendance, getAttendanceSummary, getAttendanceDashboard, getStaff, editSessions }