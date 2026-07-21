import { useQuery } from "@tanstack/react-query"
import { debtHistoryService } from "../services/debtHistoryService"

export function useDebtHistory(days: number) {
  return useQuery({
    queryKey: ["debt-history", days],
    queryFn: () => debtHistoryService.getDebtHistory(days),
    staleTime: 5 * 60 * 1000,
  })
}
