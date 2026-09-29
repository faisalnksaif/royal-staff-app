import type { ScoringRole } from "../types"

// Mirrors LEADER_ROLES_BY_DEPARTMENT on the backend - leader roles only exist
// for these departments; everyone else is always scored as "executive".
export const LEADER_ROLES_BY_DEPARTMENT: Record<string, ScoringRole[]> = {
  Store: ["sales_team_leader", "sales_manager"],
}

export const SCORING_ROLE_LABELS: Record<ScoringRole, string> = {
  executive: "Sales Executive",
  sales_team_leader: "Sales Team Leader",
  sales_manager: "Sales Manager",
}

export function scoringRolesFor(departmentName: string | undefined): ScoringRole[] {
  return ["executive", ...((departmentName && LEADER_ROLES_BY_DEPARTMENT[departmentName]) || [])]
}
