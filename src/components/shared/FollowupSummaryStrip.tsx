import { View, StyleSheet, ScrollView } from "react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { formatAmount } from "../../utils/helpers"
import type { FollowupsSummary } from "../../types"

interface Props {
  summary: FollowupsSummary
  bordered?: boolean
}

export default function FollowupSummaryStrip({ summary, bordered = false }: Props) {
  const { colors } = useTheme()
  const { byOutcome, byResolution } = summary
  const items = [
    { label: "Total",    value: summary.totalFollowUps,                              color: palette.neutral[500] },
    { label: "Open",     value: byResolution.open,                                   color: palette.info.default },
    { label: "Paid",     value: byResolution.resolved,                               color: palette.success.default },
    { label: "Promised", value: byOutcome.promisedToPay + byOutcome.promisedPartial, color: palette.warning.default },
    { label: "Dispute",  value: byOutcome.dispute,                                   color: palette.error.default },
  ]
  return (
    <View style={bordered ? [styles.border, { borderBottomColor: colors.border as string }] : undefined}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {items.map(({ label, value, color }) => (
          <View key={label} style={styles.item}>
            <AppText variant="heading3" style={{ color }}>{value}</AppText>
            <AppText variant="caption" color="tertiary">{label}</AppText>
          </View>
        ))}
        {summary.totalPromisedAmount > 0 && (
          <View style={[styles.item, styles.dividerLeft]}>
            <AppText variant="heading3" style={{ color: palette.warning.default }}>
              ₹{formatAmount(summary.totalPromisedAmount)}
            </AppText>
            <AppText variant="caption" color="tertiary">Promised</AppText>
          </View>
        )}
        {summary.totalPaidAmount > 0 && (
          <View style={[styles.item, styles.dividerLeft]}>
            <AppText variant="heading3" style={{ color: palette.success.default }}>
              ₹{formatAmount(summary.totalPaidAmount)}
            </AppText>
            <AppText variant="caption" color="tertiary">Collected</AppText>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  border: { borderBottomWidth: StyleSheet.hairlineWidth },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[4],
  },
  item: { alignItems: "center", gap: 2 },
  dividerLeft: { borderLeftWidth: 1, borderLeftColor: palette.neutral[200], paddingLeft: spacing[3] },
})
