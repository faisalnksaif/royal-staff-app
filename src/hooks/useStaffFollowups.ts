import { useQuery } from "@tanstack/react-query"
import { followupService } from "../services/followupService"
import type { StaffFollowupsResponse } from "../types"
import type { StaffFollowupsParams } from "../services/followupService"

export function useStaffFollowups(
  staffId: number | string | null | undefined,
  params: StaffFollowupsParams = {}
) {
  return useQuery<StaffFollowupsResponse>({
    queryKey: ["staff-followups", staffId, params],
    queryFn: () => followupService.getStaffFollowups(staffId!, params),
    enabled: staffId != null,
  })
}
