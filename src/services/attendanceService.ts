import { Platform } from "react-native"
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as Application from "expo-application"
import * as Device from "expo-device"
import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { AttendanceScanResponse, AttendanceDayResponse, AttendanceSummaryResponse, AttendanceDashboardResponse, StaffListResponse, FaceEnrollResponse, EnrollmentPose, AttendanceRecord, RecentScansResponse } from "../types"

// Identifies which physical kiosk/phone a scan came from, for audit trail.
// androidId resets on factory reset/reinstall — good enough to distinguish
// devices, not meant as a hard hardware fingerprint. No stable equivalent
// exists on iOS without extra entitlements, so iOS/web fall back to null and
// rely on deviceName alone.
let cachedDeviceId: string | null | undefined
function getDeviceId(): string | null {
  if (cachedDeviceId !== undefined) return cachedDeviceId
  cachedDeviceId = Platform.OS === "android" ? Application.getAndroidId() : null
  return cachedDeviceId
}
const deviceName = Device.deviceName ?? Device.modelName ?? null

// Raw camera captures can be several MB at full sensor resolution even with
// JPEG quality turned down, which trips the server's request body size limit
// (413). Downscaling to a max dimension is what actually shrinks file size —
// JPEG quality alone doesn't touch resolution.
const MAX_PHOTO_DIMENSION = 960

async function compressPhoto(photoUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(photoUri)
  context.resize({ width: MAX_PHOTO_DIMENSION })
  const image = await context.renderAsync()
  const result = await image.saveAsync({ compress: 0.4, format: SaveFormat.JPEG })
  return result.uri
}

// Web's FormData needs a real Blob; React Native's FormData needs a plain
// { uri, name, type } descriptor — fetch().blob() on a file:// URI is what's
// unsupported on Android/Hermes, not on web. expo-image-manipulator doesn't
// support web, so the web path relies on the camera's own quality setting.
async function photoToFormFile(photoUri: string): Promise<{ uri: string; name: string; type: string } | Blob> {
  if (Platform.OS === "web") {
    const response = await fetch(photoUri)
    return await response.blob()
  }
  const compressedUri = await compressPhoto(photoUri)
  return { uri: compressedUri, name: "photo.jpg", type: "image/jpeg" }
}

// The generated client's createFormData() only treats a field as a file
// part when it's `instanceof Blob || instanceof File` — React Native's
// `{ uri, name, type }` descriptor is neither, so it silently falls through
// to JSON.stringify() and gets sent as a text field instead of a real file
// part, which is why the server sees "missing required field photo" on
// Android/iOS. Building the FormData ourselves sidesteps that check (the
// client passes a `FormData` instance straight through unchanged).
async function buildPhotoFormData(fields: Record<string, string | number>, photoUri: string): Promise<FormData> {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value))
  const photo = await photoToFormFile(photoUri)
  form.append("photo", photo as any)
  return form
}

// `capturedAtDeviceNow` is only sent when uploading a scan that was queued
// offline. It's the device's wall-clock time at upload — the server diffs
// it against its own receive time to get the elapsed offline duration, then
// applies that offset to `timestamp` (the device clock at capture) instead
// of trusting either device timestamp outright. See API contract in
// docs/offline-attendance-scan.md.
async function scanFace(
  photoUri: string,
  timestamp: string,
  lat: number,
  lng: number,
  capturedAtDeviceNow?: string
): Promise<AttendanceScanResponse> {
  const deviceId = getDeviceId()
  const body = await buildPhotoFormData(
    {
      timestamp,
      lat,
      lng,
      ...(capturedAtDeviceNow ? { capturedAtDeviceNow } : {}),
      ...(deviceId ? { deviceId } : {}),
      ...(deviceName ? { deviceName } : {}),
    },
    photoUri
  )
  const { data } = await api.http.request<AttendanceScanResponse>({
    path: "/attendance/scan",
    method: "POST",
    body,
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
  const body = await buildPhotoFormData({ pose }, photoUri)
  const { data } = await api.http.request<FaceEnrollResponse>({
    path: `/attendance/enroll/${staffId}`,
    method: "POST",
    body,
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