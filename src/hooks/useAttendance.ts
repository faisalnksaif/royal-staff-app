import { useQuery } from "@tanstack/react-query"
import { attendanceService } from "../services/attendanceService"
import type { AttendanceDayResponse } from "../types"

export function useAttendance(date: string) {
  return useQuery<AttendanceDayResponse>({
    queryKey: ["attendance", date],
    queryFn: () => attendanceService.getAttendance(date),
  })
}
