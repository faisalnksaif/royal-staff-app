import { useInfiniteQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { RetentionParams, RetentionStatus } from "../types"

export function useRetention(params: Omit<RetentionParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: ["retention", params],
    queryFn: ({ pageParam = 1 }) =>
      billService.getRetention({ ...params, page: pageParam as number, limit: 50 }),
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination
      return page < pages ? page + 1 : undefined
    },
    initialPageParam: 1,
  })
}
