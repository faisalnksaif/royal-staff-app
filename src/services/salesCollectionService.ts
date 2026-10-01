import api from "./apiClient"
import type { SalesCollectionSummary, SalesCollectionDetail } from "../types"

async function getMonth(month: string): Promise<SalesCollectionSummary> {
  const { data } = await api.http.request<{ success: boolean; data: SalesCollectionSummary }>({
    path: `/ledger/sales-collection?month=${month}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data.data
}

async function getExecutive(executiveKey: string, month: string): Promise<SalesCollectionDetail> {
  const { data } = await api.http.request<{ success: boolean; data: SalesCollectionDetail }>({
    path: `/ledger/sales-collection/${encodeURIComponent(executiveKey)}?month=${month}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data.data
}

export const salesCollectionService = { getMonth, getExecutive }
