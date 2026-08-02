import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type { DepartmentListResponse, DepartmentResponse } from "../types"

async function getDepartments(): Promise<DepartmentListResponse> {
  const { data } = await api.http.request<DepartmentListResponse>({
    path: "/departments",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function createDepartment(name: string): Promise<DepartmentResponse> {
  const { data } = await api.http.request<{ success: boolean; data: DepartmentResponse }>({
    path: "/departments",
    method: "POST",
    body: { name },
    secure: true,
    type: ContentType.Json,
    format: "json",
  })
  return data.data
}

async function updateDepartment(id: string, name: string): Promise<DepartmentResponse> {
  const { data } = await api.http.request<{ success: boolean; data: DepartmentResponse }>({
    path: `/departments/${id}`,
    method: "PATCH",
    body: { name },
    secure: true,
    type: ContentType.Json,
    format: "json",
  })
  return data.data
}

export const departmentService = { getDepartments, createDepartment, updateDepartment }
