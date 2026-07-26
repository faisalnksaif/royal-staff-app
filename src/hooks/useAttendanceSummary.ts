import { useQuery } from "@tanstack/react-query"
import { attendanceService } from "../services/attendanceService"
import type { AttendanceSummaryResponse } from "../types"

export function useAttendanceSummary(date: string) {
  return useQuery<AttendanceSummaryResponse>({
    queryKey: ["attendanceSummary", date],
    queryFn: () => attendanceService.getAttendanceSummary(date),
  })
}