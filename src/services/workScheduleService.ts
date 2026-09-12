import api from "./apiClient"
import { ContentType } from "./generated/Api"
import type {
  WorkAssignmentListResponse,
  WorkScheduleListResponse,
  AssignableStaffResponse,
  WorkAssignment,
  WorkScheduleResponse,
  WorkStatus,
  WorkPriority,
  WorkSummary,
  RecurrenceFrequency,
} from "../types"

export interface CreateWorkPayload {
  title: string
  description?: string | null
  assigneeStaffId: number
  priority?: WorkPriority
  startDate: string
  dueTime?: string | null
  recurrence?: {
    frequency: RecurrenceFrequency
    interval?: number
    daysOfWeek?: number[]
    dayOfMonth?: number | null
    until?: string | null
  }
}

export interface UpdateWorkPayload {
  title?: string
  description?: string | null
  priority?: WorkPriority
  dueTime?: string | null
  recurrenceUntil?: string | null
  isActive?: boolean
}

export interface WorkFilters {
  status?: WorkStatus
  from?: string
  to?: string
  overdue?: boolean
  scheduleId?: string
}

function toQuery(filters?: WorkFilters & { assigneeStaffId?: number; all?: boolean }): string {
  const params = new URLSearchParams()
  if (filters?.status) params.set("status", filters.status)
  if (filters?.from) params.set("from", filters.from)
  if (filters?.to) params.set("to", filters.to)
  if (filters?.overdue) params.set("overdue", "true")
  if (filters?.scheduleId) params.set("scheduleId", filters.scheduleId)
  if (filters?.assigneeStaffId != null) params.set("assigneeStaffId", String(filters.assigneeStaffId))
  if (filters?.all) params.set("all", "true")
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/** Staff the current user is allowed to schedule work for. */
async function getAssignableStaff(): Promise<AssignableStaffResponse> {
  const { data } = await api.http.request<AssignableStaffResponse>({
    path: "/work-schedule/assignable-staff",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

/** Work assigned TO the current user. */
async function getMyWork(filters?: WorkFilters): Promise<WorkAssignmentListResponse> {
  const { data } = await api.http.request<WorkAssignmentListResponse>({
    path: `/work-schedule/my${toQuery(filters)}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

/** Work the current user has handed out. SuperAdmin may pass all/assigneeStaffId. */
async function getAssignedWork(
  filters?: WorkFilters & { assigneeStaffId?: number; all?: boolean }
): Promise<WorkAssignmentListResponse> {
  const { data } = await api.http.request<WorkAssignmentListResponse>({
    path: `/work-schedule/assigned${toQuery(filters)}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getSchedules(isActive?: boolean): Promise<WorkScheduleListResponse> {
  const qs = isActive === undefined ? "" : `?isActive=${isActive}`
  const { data } = await api.http.request<WorkScheduleListResponse>({
    path: `/work-schedule/schedules${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getSummary(params?: { staffId?: number; from?: string; to?: string }): Promise<WorkSummary> {
  const search = new URLSearchParams()
  if (params?.staffId != null) search.set("staffId", String(params.staffId))
  if (params?.from) search.set("from", params.from)
  if (params?.to) search.set("to", params.to)
  const qs = search.toString() ? `?${search.toString()}` : ""

  const { data } = await api.http.request<{ success: boolean; data: WorkSummary }>({
    path: `/work-schedule/summary${qs}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data.data
}

async function createWork(
  payload: CreateWorkPayload
): Promise<{ schedule: WorkScheduleResponse; assignments: WorkAssignment[] }> {
  const { data } = await api.http.request<{
    success: boolean
    data: { schedule: WorkScheduleResponse; assignments: WorkAssignment[] }
  }>({
    path: "/work-schedule",
    method: "POST",
    body: payload,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

async function updateSchedule(id: string, updates: UpdateWorkPayload): Promise<WorkScheduleResponse> {
  const { data } = await api.http.request<{ success: boolean; data: WorkScheduleResponse }>({
    path: `/work-schedule/schedules/${id}`,
    method: "PUT",
    body: updates,
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

/** Stops a series - keeps history, drops untouched future occurrences. */
async function cancelSchedule(id: string): Promise<{ removed: number }> {
  const { data } = await api.http.request<{ success: boolean; data: { removed: number } }>({
    path: `/work-schedule/schedules/${id}`,
    method: "DELETE",
    secure: true,
    format: "json",
  })
  return data.data
}

async function updateStatus(id: string, status: WorkStatus, note?: string): Promise<WorkAssignment> {
  const { data } = await api.http.request<{ success: boolean; data: WorkAssignment }>({
    path: `/work-schedule/${id}/status`,
    method: "PATCH",
    body: { status, note },
    type: ContentType.Json,
    secure: true,
    format: "json",
  })
  return data.data
}

export const workScheduleService = {
  getAssignableStaff,
  getMyWork,
  getAssignedWork,
  getSchedules,
  getSummary,
  createWork,
  updateSchedule,
  cancelSchedule,
  updateStatus,
}
