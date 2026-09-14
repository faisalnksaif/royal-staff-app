import { useQuery } from "@tanstack/react-query"
import { holidayService } from "../services/holidayService"

export function useHolidays(range: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ["holidays", range.from ?? null, range.to ?? null],
    queryFn: () => holidayService.getHolidays(range),
  })
}
