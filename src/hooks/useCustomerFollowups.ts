import { useQuery } from "@tanstack/react-query"
import { followupService } from "../services/followupService"
import type { StaffFollowupsResponse } from "../types"

export function useCustomerFollowups(
  customerId: number | string | null | undefined,
  limit = 50
) {
  return useQuery<StaffFollowupsResponse>({
    queryKey: ["customer-followups", customerId],
    queryFn: () => followupService.getCustomerFollowups(customerId!, limit),
    enabled: customerId != null && customerId !== "",
  })
}
