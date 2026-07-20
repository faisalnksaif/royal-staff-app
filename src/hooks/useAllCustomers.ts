import { useInfiniteQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { LedgerOutstandingResponse, LedgerOutstandingParams } from "../types"

export function useAllCustomers(params: Omit<LedgerOutstandingParams, "page"> & { enabled?: boolean } = {}) {
  const { limit = 50, search, filter, sortBy, activeDays, churnedDays, enabled = true } = params
  return useInfiniteQuery<LedgerOutstandingResponse>({
    queryKey: ["all-customers", limit, search, filter, sortBy, activeDays, churnedDays],
    enabled,
    queryFn: ({ pageParam }) =>
      billService.getAllCustomers({ page: pageParam as number, limit, search, filter, sortBy, activeDays, churnedDays }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination
      return page < pages ? page + 1 : undefined
    },
  })
}
