import api from "./apiClient"
import type {
  LedgerOutstandingResponse,
  LedgerOutstandingParams,
  CustomerLedgerResponse,
  RetentionResponse,
  RetentionParams,
  PaymentVelocityResponse,
  PaymentVelocityParams,
  PaymentVelocitySortBy,
  SortOrder,
} from "../types"

async function getStaffOutstanding(
  userId: number | string,
  params: LedgerOutstandingParams = {}
): Promise<LedgerOutstandingResponse> {
  const { page = 1, limit = 50, search, filter, sortBy, activeDays, churnedDays } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set("search", search)
  if (filter && filter !== "all") query.set("filter", filter)
  if (sortBy) query.set("sortBy", sortBy)
  if (activeDays != null) query.set("activeDays", String(activeDays))
  if (churnedDays != null) query.set("churnedDays", String(churnedDays))

  const { data } = await api.http.request<LedgerOutstandingResponse>({
    path: `/ledger/staff/${userId}/outstanding?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getAllCustomers(
  params: LedgerOutstandingParams = {}
): Promise<LedgerOutstandingResponse> {
  const { page = 1, limit = 50, search, filter, sortBy, activeDays, churnedDays } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set("search", search)
  if (filter && filter !== "all") query.set("filter", filter)
  if (sortBy) query.set("sortBy", sortBy)
  if (activeDays != null) query.set("activeDays", String(activeDays))
  if (churnedDays != null) query.set("churnedDays", String(churnedDays))

  const { data } = await api.http.request<LedgerOutstandingResponse>({
    path: `/ledger/outstanding?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getCustomerLedger(
  ledgerId: number | string,
  params: { page?: number; limit?: number; from_date?: string; to_date?: string } = {}
): Promise<CustomerLedgerResponse> {
  const { page = 1, limit = 50, from_date, to_date } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (from_date) query.set("from_date", from_date)
  if (to_date) query.set("to_date", to_date)

  const { data } = await api.http.request<CustomerLedgerResponse>({
    path: `/ledger/customers/${ledgerId}?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getRetention(params: RetentionParams = {}): Promise<RetentionResponse> {
  const { page = 1, limit = 50, search, status, activeDays, churnedDays, sortBy, order } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set("search", search)
  if (status && status !== "all") query.set("status", status)
  if (activeDays != null) query.set("activeDays", String(activeDays))
  if (churnedDays != null) query.set("churnedDays", String(churnedDays))
  if (sortBy) query.set("sortBy", sortBy)
  if (order) query.set("order", order)

  const { data } = await api.http.request<RetentionResponse>({
    path: `/ledger/retention?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

async function getPaymentVelocity(params: PaymentVelocityParams = {}): Promise<PaymentVelocityResponse> {
  const { page = 1, limit = 50, search, sortBy, order } = params
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) query.set("search", search)
  if (sortBy) query.set("sortBy", sortBy)
  if (order) query.set("order", order)

  const { data } = await api.http.request<PaymentVelocityResponse>({
    path: `/ledger/payment-velocity?${query.toString()}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

export const billService = { getStaffOutstanding, getAllCustomers, getCustomerLedger, getRetention, getPaymentVelocity }
