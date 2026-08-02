import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { ScanningDeviceListResponse, ScanningDeviceResponse } from "../types"

interface CreateScanningDevicePayload {
  email: string
  password: string
  departmentId: string
  lat: number
  lng: number
  radiusMeters: number
  name?: string
}

interface UpdateScanningDevicePayload {
  departmentId?: string
  lat?: number
  lng?: number
  radiusMeters?: number
  isActive?: boolean
  name?: string
}

async function getScanningDevices(): Promise<ScanningDeviceListResponse> {
  const { data } = await api.http.request<ScanningDeviceListResponse>({
    path: "/auth/scanning-devices",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function createScanningDevice(
  payload: CreateScanningDevicePayload
): Promise<ScanningDeviceResponse> {
  const { data } = await api.http.request<{ success: boolean; data: ScanningDeviceResponse }>({
    path: "/auth/scanning-devices",
    method: "POST",
    body: payload,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

async function updateScanningDevice(
  id: string,
  updates: UpdateScanningDevicePayload
): Promise<ScanningDeviceResponse> {
  const { data } = await api.http.request<{ success: boolean; data: ScanningDeviceResponse }>({
    path: `/auth/scanning-devices/${id}`,
    method: "PATCH",
    body: updates,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

export const scanningDeviceService = { getScanningDevices, createScanningDevice, updateScanningDevice }
