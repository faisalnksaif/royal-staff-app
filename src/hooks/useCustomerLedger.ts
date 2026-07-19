import { useInfiniteQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { CustomerLedgerResponse } from "../types"

export function useCustomerLedger(
  ledgerId: number | string | null | undefined,
  params: { limit?: number; from_date?: string; to_date?: string } = {}
) {
  const { limit = 50, from_date, to_date } = params
  return useInfiniteQuery<CustomerLedgerResponse>({
    queryKey: ["customer-ledger", ledgerId, limit, from_date, to_date],
    queryFn: ({ pageParam }) =>
      billService.getCustomerLedger(ledgerId!, { page: pageParam as number, limit, from_date, to_date }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination
      return page < pages ? page + 1 : undefined
    },
    enabled: ledgerId != null && ledgerId !== "",
  })
}
