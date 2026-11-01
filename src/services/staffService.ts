import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { ScoringRole, StaffListResponse, StaffOption, StaffResponse } from "../types"

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
  updates: { departmentId?: string; shiftId?: string; scoringRole?: ScoringRole }
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

export interface CreateStaffPayload {
  name: string
  email: string
  password: string
  phone?: string
  departmentId?: string
  shiftId?: string
  joiningDate?: string // YYYY-MM-DD
  basicPay?: number // superAdmin/manager only
}

async function createStaff(
  payload: CreateStaffPayload
): Promise<{ success: boolean; warning?: string; data: Partial<StaffResponse> }> {
  const { data } = await api.http.request<{ success: boolean; warning?: string; data: Partial<StaffResponse> }>({
    path: "/staff",
    method: "POST",
    body: payload,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data
}

async function createStaffLogin(
  id: number,
  payload: { email: string; password: string }
): Promise<{ success: boolean; data: { id: number; email: string; hasLogin: boolean } }> {
  const { data } = await api.http.request<{ success: boolean; data: { id: number; email: string; hasLogin: boolean } }>({
    path: `/staff/${id}/login`,
    method: "POST",
    body: payload,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data
}

export const staffService = { getStaff, getStaffOptions, updateStaff, createStaff, createStaffLogin }
