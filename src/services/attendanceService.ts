import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { AttendanceScanResponse, AttendanceDayResponse, StaffListResponse, FaceEnrollResponse } from "../types"

async function photoToFormFile(photoUri: string): Promise<Blob> {
  const response = await fetch(photoUri)
  return await response.blob()
}

async function scanFace(photoUri: string, timestamp: string): Promise<AttendanceScanResponse> {
  const photoBlob = await photoToFormFile(photoUri)
  const { data } = await api.http.request<AttendanceScanResponse>({
    path: "/attendance/scan",
    method: "POST",
    body: { photo: photoBlob, timestamp },
    type: ContentType.FormData,
    secure: true,
    format: "json",
  })
  return data
}

async function enrollFace(staffId: number, photoUri: string): Promise<FaceEnrollResponse> {
  const photoBlob = await photoToFormFile(photoUri)
  const { data } = await api.http.request<FaceEnrollResponse>({
    path: `/attendance/enroll/${staffId}`,
    method: "POST",
    body: { photo: photoBlob },
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

async function getStaff(): Promise<StaffListResponse> {
  const { data } = await api.http.request<StaffListResponse>({
    path: "/staff",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

export const attendanceService = { scanFace, enrollFace, deleteFaceEnrollment, getAttendance, getStaff }