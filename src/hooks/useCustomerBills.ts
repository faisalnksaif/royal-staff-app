import { useInfiniteQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { StaffBillsResponse } from "../types"

export function useCustomerBills(
  staffId: number | string | null | undefined,
  customerName: string,
  limit = 20
) {
  return useInfiniteQuery<StaffBillsResponse>({
    queryKey: ["customer-bills", staffId, customerName, limit],
    queryFn: ({ pageParam }) =>
      billService.getStaffBills(staffId!, {
        page: pageParam as number,
        limit,
        search: customerName,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination
      return page < pages ? page + 1 : undefined
    },
    enabled: staffId != null && customerName.length > 0,
  })
}
