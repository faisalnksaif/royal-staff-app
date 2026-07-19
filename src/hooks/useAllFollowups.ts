import { useInfiniteQuery } from "@tanstack/react-query"
import { followupService } from "../services/followupService"
import type { AllFollowUpsParams } from "../services/followupService"
import type { AllFollowUpsResponse } from "../types"

export function useAllFollowups(params: AllFollowUpsParams = {}) {
  const { page: _page, ...restParams } = params
  return useInfiniteQuery<AllFollowUpsResponse>({
    queryKey: ["all-followups", restParams],
    queryFn: ({ pageParam }) =>
      followupService.getAllFollowups({ ...restParams, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination
      return page < pages ? page + 1 : undefined
    },
  })
}
