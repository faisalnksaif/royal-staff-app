import { useQuery } from "@tanstack/react-query"
import { workScheduleService, WorkFilters } from "../services/workScheduleService"

/** Work assigned TO the current user. */
export function useMyWork(filters?: WorkFilters) {
  return useQuery({
    queryKey: ["work", "my", filters ?? {}],
    queryFn: () => workScheduleService.getMyWork(filters),
  })
}

/** Work the current user handed out. */
export function useAssignedWork(filters?: WorkFilters & { assigneeStaffId?: number; all?: boolean }) {
  return useQuery({
    queryKey: ["work", "assigned", filters ?? {}],
    queryFn: () => workScheduleService.getAssignedWork(filters),
  })
}

/** Recurring definitions, for managing a series rather than one occurrence. */
export function useWorkSchedules(isActive?: boolean) {
  return useQuery({
    queryKey: ["work", "schedules", isActive ?? "any"],
    queryFn: () => workScheduleService.getSchedules(isActive),
  })
}

/**
 * Who the current user may assign work to. Static per role, so it's cached
 * long - the picker shouldn't refetch every time a modal opens.
 */
export function useAssignableStaff(enabled = true) {
  return useQuery({
    queryKey: ["work", "assignable-staff"],
    queryFn: () => workScheduleService.getAssignableStaff(),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useWorkSummary(params?: { staffId?: number; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["work", "summary", params ?? {}],
    queryFn: () => workScheduleService.getSummary(params),
  })
}
