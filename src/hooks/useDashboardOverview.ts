import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "../services/dashboardService"
import type { DashboardOverviewParams } from "../services/dashboardService"
import type { DashboardOverviewResponse } from "../types"

export function useDashboardOverview(params: DashboardOverviewParams = {}) {
  return useQuery<DashboardOverviewResponse>({
    queryKey: ["dashboard-overview", params],
    queryFn: () => dashboardService.getOverview(params),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
