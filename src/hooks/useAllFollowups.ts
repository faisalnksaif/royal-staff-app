import { useQuery } from "@tanstack/react-query"
import { followupService } from "../services/followupService"
import type { AllFollowUpsParams } from "../services/followupService"
import type { AllFollowUpsResponse } from "../types"

export function useAllFollowups(params: AllFollowUpsParams = {}) {
  return useQuery<AllFollowUpsResponse>({
    queryKey: ["all-followups", params],
    queryFn: () => followupService.getAllFollowups(params),
  })
}
