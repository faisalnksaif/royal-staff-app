import { useQuery } from "@tanstack/react-query"
import { attendanceService } from "../services/attendanceService"

export function useRecentScans(limit = 20) {
  return useQuery({
    queryKey: ["recent-scans", limit],
    queryFn: () => attendanceService.getRecentScans(limit),
  })
}
