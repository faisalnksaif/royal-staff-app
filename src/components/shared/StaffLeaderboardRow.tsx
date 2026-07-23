import { formatAmount } from "../../utils/helpers"
import { View, StyleSheet } from "react-native"
import { ChevronRight } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette } from "../../constants/theme"


export interface StaffLeaderboardEntry {
  staff_id: number
  staff_name: string
  customers_owned: number
  customers_with_debt?: number
  total_outstanding: number
  totalFollowUps?: number
  totalPromisedAmount: number
  totalPaidAmount: number
}

export default function StaffLeaderboardRow({
  rank,
  entry,
  accent,
}: {
  rank: number
  entry: StaffLeaderboardEntry
  accent: string
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.row, rank > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
      <View style={[styles.rank, { backgroundColor: accent + "18" }]}>
        <AppText variant="caption" style={{ color: accent }}>{rank + 1}</AppText>
      </View>
      <View style={styles.text}>
        <AppText variant="bodyMedium">{entry.staff_name}</AppText>
        <View style={styles.subRow}>
          <AppText variant="caption" color="tertiary">{entry.customers_owned} customers</AppText>
          {(entry.customers_with_debt ?? 0) > 0 && (
            <AppText variant="caption" style={{ color: palette.error.default }}> · {entry.customers_with_debt} with debt</AppText>
          )}
          {(entry.totalFollowUps ?? 0) > 0 && (
            <AppText variant="caption" color="tertiary"> · {entry.totalFollowUps} follow-ups</AppText>
          )}
        </View>
      </View>
      <View style={styles.amounts}>
        <AppText variant="bodyMedium" style={{ color: palette.error.default }}>
          ₹{formatAmount(entry.total_outstanding)}
        </AppText>
        {entry.totalPromisedAmount > 0 && (
          <AppText variant="caption" style={{ color: palette.warning.default }}>
            ₹{formatAmount(entry.totalPromisedAmount)} promised
          </AppText>
        )}
        {entry.totalPaidAmount > 0 && (
          <AppText variant="caption" style={{ color: palette.success.default }}>
            ₹{formatAmount(entry.totalPaidAmount)} paid
          </AppText>
        )}
      </View>
      <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.75} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    gap: spacing[1],
  },
  subRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  amounts: {
    alignItems: "flex-end",
    gap: spacing[1],
  },
})
