import { useQuery } from "@tanstack/react-query"
import { staffService } from "../services/staffService"
import useAuthStore from "../stores/useAuthStore"

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getStaff(),
  })
}

export function useCurrentStaff() {
  const authUserId = useAuthStore((s) => s.user?.user_id)
  const { data, ...rest } = useStaff()
  const currentStaff = data?.data.find((s) => s.user_id === authUserId) ?? null
  return { currentStaff, ...rest }
}
