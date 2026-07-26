import { useQuery } from "@tanstack/react-query"
import { attendanceService } from "../services/attendanceService"
import type { AttendanceDashboardResponse } from "../types"

export function useAttendanceDashboard(startDate: string, endDate: string) {
  return useQuery<AttendanceDashboardResponse>({
    queryKey: ["attendanceDashboard", startDate, endDate],
    queryFn: () => attendanceService.getAttendanceDashboard(startDate, endDate),
  })
}
