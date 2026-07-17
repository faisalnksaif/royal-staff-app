import { useQuery } from "@tanstack/react-query"
import { followupService } from "../services/followupService"
import type { StaffFollowupsResponse } from "../types"

export function useStaffFollowups(
  staffId: number | string | null | undefined,
  limit = 100
) {
  return useQuery<StaffFollowupsResponse>({
    queryKey: ["staff-followups", staffId],
    queryFn: () => followupService.getStaffFollowups(staffId!, limit),
    enabled: staffId != null,
  })
}
