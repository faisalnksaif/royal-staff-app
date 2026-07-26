import { useInfiniteQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { LedgerOutstandingResponse, LedgerOutstandingFilter, RetentionStatus } from "../types"

export function useStaffCustomers(
  userId: number | string | null | undefined,
  params: { limit?: number; search?: string; filter?: LedgerOutstandingFilter; retentionStatus?: RetentionStatus | "all"; sortBy?: "priority" | "balance" | "newest" } = {}
) {
  const { limit = 20, search, filter = "all", retentionStatus, sortBy } = params

  return useInfiniteQuery<LedgerOutstandingResponse>({
    queryKey: ["staff-outstanding", userId, limit, search, filter, retentionStatus, sortBy],
    queryFn: ({ pageParam }) =>
      billService.getStaffOutstanding(userId!, {
        page: pageParam as number,
        limit,
        search,
        filter,
        retentionStatus,
        sortBy,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination
      return page < pages ? page + 1 : undefined
    },
    enabled: userId != null,
  })
}
