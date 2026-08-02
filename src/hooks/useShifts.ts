import { useQuery } from "@tanstack/react-query"
import { shiftService } from "../services/shiftService"

export function useShifts() {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: () => shiftService.getShifts(),
  })
}
