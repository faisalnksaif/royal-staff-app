import { useQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { LedgerFollowUpInsights } from "../types"

export interface StaffOutstandingSummary {
  total_customers: number
  total_outstanding: number
  follow_up_insights: LedgerFollowUpInsights
}

export function useStaffBillsSummary(userId: number | string | null | undefined) {
  return useQuery<StaffOutstandingSummary>({
    queryKey: ["staff-outstanding-summary", userId],
    queryFn: async () => {
      const res = await billService.getStaffOutstanding(userId!, { page: 1, limit: 1 })
      return {
        total_customers: res.follow_up_insights.customers_total,
        total_outstanding: res.totals.total_outstanding,
        follow_up_insights: res.follow_up_insights,
      }
    },
    enabled: userId != null,
  })
}
