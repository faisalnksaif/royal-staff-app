import { colors as palette } from "./theme"
import type { RetentionStatus } from "../types"

export const RETENTION_STATUS_LABEL: Record<RetentionStatus, string> = {
  active: "Active",
  at_risk: "At Risk",
  churned: "Inactive",
  never_purchased: "Never Purchased",
}

export const RETENTION_COLOR: Record<RetentionStatus, string> = {
  active: palette.success.default,
  at_risk: palette.warning.default,
  churned: palette.error.default,
  never_purchased: palette.neutral[500],
}
