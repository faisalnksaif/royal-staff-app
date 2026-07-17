import { useQuery } from "@tanstack/react-query"
import { billService } from "../services/billService"
import type { StaffBillsParams, StaffBillsResponse } from "../types"

export function useStaffBills(
  staffId: number | string | null | undefined,
  params: StaffBillsParams = {}
) {
  const { page = 1, limit = 50, search } = params

  return useQuery<StaffBillsResponse>({
    queryKey: ["staff-bills", staffId, page, limit, search],
    queryFn: () => billService.getStaffBills(staffId!, { page, limit, search }),
    enabled: staffId != null,
  })
}
