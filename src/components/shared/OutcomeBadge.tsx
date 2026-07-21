import { View } from "react-native"
import AppText from "../ui/AppText"
import { colors as palette } from "../../constants/theme"
import { spacing } from "../../constants/theme"
import type { FollowUpOutcome } from "../../types"

export const OUTCOME_LABELS: Record<string, string> = {
  promisedToPay:   "Promised Full Payment",
  promisedPartial: "Promised Partial",
  dispute:         "Dispute",
  noResponse:      "No Response",
  reminderSent:    "Reminder Sent",
}

export const OUTCOME_COLORS: Record<string, string> = {
  promisedToPay:   palette.success.default,
  promisedPartial: palette.warning.default,
  dispute:         palette.error.default,
  noResponse:      palette.neutral[500],
  reminderSent:    palette.info.default,
}

export function outcomeColor(o: FollowUpOutcome | string): string {
  return OUTCOME_COLORS[o] ?? "#888"
}

interface Props {
  outcome: FollowUpOutcome
  short?: boolean
}

export default function OutcomeBadge({ outcome, short }: Props) {
  const color = OUTCOME_COLORS[outcome]
  const label = short
    ? OUTCOME_LABELS[outcome].replace(" Payment", "").replace("Promised Full", "Promised")
    : OUTCOME_LABELS[outcome]
  return (
    <View style={{ backgroundColor: color + "22", paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4, flexShrink: 1 }}>
      <AppText variant="caption" numberOfLines={1} style={{ color, fontSize: 11 }}>{label}</AppText>
    </View>
  )
}
