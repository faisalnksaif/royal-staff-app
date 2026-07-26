import api from "./apiClient"

export interface CustomerMapping {
  ledger_id: number
  name: string
  group: string
  mobile: string | null
  balance: number
  assigned_staff_id: number | null
  assigned_staff_name: string | null
  ownership_source?: "assigned" | "dynamic" | "unassigned"
  is_new?: boolean
  created_at?: string
  on_hold?: boolean
  hold_reason?: string | null
  held_by_staff_name?: string | null
  held_at?: string | null
}

export interface HoldCustomerPayload {
  hold: boolean
  reason?: string
}

export interface HoldCustomerResult {
  ledger_id: number
  name: string
  on_hold: boolean
  hold_reason: string | null
  held_by_staff_id: number | null
  held_by_staff_name: string | null
  held_at: string | null
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

async function getMappings(params: {
  page?: number
  limit?: number
  search?: string
  ownership?: "all" | "assigned" | "dynamic" | "unassigned"
  hold?: "all" | "held" | "not_held"
  sortBy?: "created_at" | "balance" | "name"
  order?: "asc" | "desc"
  newDays?: number
} = {}): Promise<MappingsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.limit) qs.set("limit", String(params.limit))
  if (params.search) qs.set("search", params.search)
  if (params.ownership && params.ownership !== "all") qs.set("ownership", params.ownership)
  if (params.hold && params.hold !== "all") qs.set("hold", params.hold)
  if (params.sortBy && params.sortBy !== "created_at") qs.set("sortBy", params.sortBy)
  if (params.order && params.order !== "desc") qs.set("order", params.order)
  if (params.newDays != null && params.newDays !== 7) qs.set("newDays", String(params.newDays))
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

async function holdCustomer(ledgerId: number, payload: HoldCustomerPayload): Promise<HoldCustomerResult> {
  const { data } = await api.http.request<{ success: boolean; data: HoldCustomerResult }>({
    path: `/ledger/customers/${ledgerId}/hold`,
    method: "PUT",
    body: payload,
    secure: true,
    format: "json",
  })
  return data.data
}

export const mappingService = { getMappings, getStaffOptions, reassign, holdCustomer }
