import useAuthStore from "../stores/useAuthStore"

export function useRole() {
  const role = useAuthStore((s) => s.user?.role)
  return {
    role,
    isSuperAdmin: role === "superAdmin",
    isManager: role === "manager",
    isHR: role === "hr",
    isAdmin: role === "superAdmin" || role === "manager",
    isStaff: role === "staff",
    canViewAttendance: role === "superAdmin" || role === "manager" || role === "hr",
  }
}
