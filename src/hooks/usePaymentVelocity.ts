import { useInfiniteQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { PaymentVelocityParams, PaymentVelocitySortBy, SortOrder } from "../types"

export function usePaymentVelocity(params: Omit<PaymentVelocityParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: ["payment-velocity", params],
    queryFn: ({ pageParam = 1 }) =>
      billService.getPaymentVelocity({ ...params, page: pageParam as number, limit: 50 }),
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination
      return page < pages ? page + 1 : undefined
    },
    initialPageParam: 1,
  })
}
