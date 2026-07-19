import api from "./apiClient"

export interface CustomerMapping {
  ledger_id: number
  name: string
  group: string
  mobile: string | null
  balance: number
  assigned_staff_id: number | null
  assigned_staff_name: string | null
}

export interface StaffOption {
  staff_id: number
  name: string
}

export interface MappingPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface MappingsResponse {
  success: boolean
  pagination: MappingPagination
  data: CustomerMapping[]
}

async function getMappings(params: { page?: number; limit?: number; search?: string } = {}): Promise<MappingsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.search) qs.set("search", params.search)
  const { data } = await api.http.request<MappingsResponse>({
    path: `/ledger/mappings${qs.toString() ? `?${qs}` : ""}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getStaffOptions(): Promise<StaffOption[]> {
  const { data } = await api.http.request<{ success: boolean; data: StaffOption[] }>({
    path: "/ledger/mappings/staff-options",
    method: "GET",
    secure: true,
    format: "json",
  })
  return data.data
}

async function reassign(ledgerId: number, staffId: number): Promise<CustomerMapping> {
  const { data } = await api.http.request<{ success: boolean; data: CustomerMapping }>({
    path: `/ledger/mappings/${ledgerId}`,
    method: "PUT",
    body: { staffId },
    secure: true,
    format: "json",
  })
  return data.data
}

export const mappingService = { getMappings, getStaffOptions, reassign }
