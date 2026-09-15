import { useQuery } from "@tanstack/react-query"
import { attendanceService } from "../services/attendanceService"
import type { MonthlyAttendanceResponse } from "../types"

export function useMonthlyAttendance(staffId: number | null, month: string) {
  return useQuery<MonthlyAttendanceResponse>({
    queryKey: ["monthlyAttendance", staffId, month],
    queryFn: () => attendanceService.getMonthlyAttendance(staffId!, month),
    enabled: staffId != null,
  })
}
