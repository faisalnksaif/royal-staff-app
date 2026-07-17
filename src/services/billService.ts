import api from "./apiClient"
import type {
  StaffBillsResponse,
  StaffBillsParams,
  LedgerOutstandingResponse,
  LedgerOutstandingParams,
} from "../types"

async function getStaffBills(
  staffId: number | string,
  params: StaffBillsParams = {}
): Promise<StaffBillsResponse> {
  const { page = 1, limit = 50, search } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set("search", search)

  const { data } = await api.http.request<StaffBillsResponse>({
    path: `/bills/staff/${staffId}?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getStaffOutstanding(
  userId: number | string,
  params: LedgerOutstandingParams = {}
): Promise<LedgerOutstandingResponse> {
  const { page = 1, limit = 50, search, filter } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set("search", search)
  if (filter && filter !== "all") query.set("filter", filter)

  const { data } = await api.http.request<LedgerOutstandingResponse>({
    path: `/ledger/staff/${userId}/outstanding?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

export const billService = { getStaffBills, getStaffOutstanding }
