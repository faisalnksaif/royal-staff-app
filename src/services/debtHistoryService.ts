import api from "./apiClient"

export interface DebtHistoryPoint {
  date: string
  total_debt: number
}

export interface DebtHistoryResponse {
  success: boolean
  data: DebtHistoryPoint[]
}

async function getDebtHistory(days = 30): Promise<DebtHistoryResponse> {
  const { data } = await api.http.request<DebtHistoryResponse>({
    path: `/ledger/debt-history?days=${days}`,
    method: "GET",
    secure: true,
    format: "json",
  })
  return data
}

export const debtHistoryService = { getDebtHistory }
