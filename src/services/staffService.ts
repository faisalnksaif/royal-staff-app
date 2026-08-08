import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { StaffListResponse, StaffOption, StaffResponse } from "../types"

async function getStaff(): Promise<StaffListResponse> {
  const { data } = await api.http.request<StaffListResponse>({
    path: "/staff",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getStaffOptions(): Promise<{ success: boolean; data: StaffOption[] }> {
  const { data } = await api.http.request<{ success: boolean; data: StaffOption[] }>({
    path: "/staff/options",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function updateStaff(
  id: number,
  updates: { departmentId?: string; shiftId?: string }
): Promise<{ success: boolean; data: Partial<StaffResponse> }> {
  const { data } = await api.http.request<{ success: boolean; data: Partial<StaffResponse> }>({
    path: `/staff/${id}`,
    method: "PATCH",
    body: updates,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data
}

export const staffService = { getStaff, getStaffOptions, updateStaff }
