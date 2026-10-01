import { useQuery } from "@tanstack/react-query"
import { salesCollectionService } from "../services/salesCollectionService"

export function useSalesCollection(month: string) {
  return useQuery({
    queryKey: ["sales-collection", month],
    queryFn: () => salesCollectionService.getMonth(month),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSalesCollectionDetail(executiveKey: string | undefined, month: string) {
  return useQuery({
    queryKey: ["sales-collection", month, executiveKey],
    queryFn: () => salesCollectionService.getExecutive(executiveKey!, month),
    enabled: !!executiveKey,
    staleTime: 5 * 60 * 1000,
  })
}
