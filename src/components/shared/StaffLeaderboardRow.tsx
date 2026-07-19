import { View, StyleSheet } from "react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette } from "../../constants/theme"

function formatAmount(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

export interface StaffLeaderboardEntry {
  staff_id: number
  staff_name: string
  customers_owned: number
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
