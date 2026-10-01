import { useState } from "react"
import { View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { ChevronRight, Info } from "lucide-react-native"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import DrawerMenuButton from "../../components/shared/DrawerMenuButton"
import RefreshButton from "../../components/shared/RefreshButton"
import ErrorRetry from "../../components/shared/ErrorRetry"
import MonthNav from "../../components/shared/MonthNav"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { useSalesCollection } from "../../hooks/useSalesCollection"
import { formatAmount, toTitleCase } from "../../utils/helpers"
import type { SalesCollectionStaffRow } from "../../types"

const LAST_MONTH = moment().subtract(1, "month").format("YYYY-MM")

function pct(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function formatDay(d: string) {
  return moment(d, "YYYY-MM-DD").format("D MMM YYYY")
}

/** Incentives are small enough that paise matter for display. */
function formatIncentive(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StaffRow({ row, month }: { row: SalesCollectionStaffRow; month: string }) {
  const { colors } = useTheme()
  const router = useRouter()
  const collectedPct = pct(row.collected, row.sales)

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: "/(admin)/sales-collection-detail", params: { key: row.key, month } })}
    >
      <View style={[styles.row, { borderBottomColor: colors.border as string }]}>
        <View style={styles.rowTop}>
          <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {row.isStaff ? toTitleCase(row.name) : row.name}
          </AppText>
          <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.75} />
        </View>

        <View style={styles.figures}>
          <View style={styles.figure}>
            <AppText variant="caption" color="tertiary">Sales</AppText>
            <AppText variant="bodyMedium">₹{formatAmount(row.sales)}</AppText>
          </View>
          <View style={styles.figure}>
            <AppText variant="caption" color="tertiary">Collected</AppText>
            <AppText variant="bodyMedium" style={{ color: palette.success.default }}>
              ₹{formatAmount(row.collected)} <AppText variant="caption" color="tertiary">{collectedPct}%</AppText>
            </AppText>
          </View>
          {row.isStaff && (
            <View style={styles.figure}>
              <AppText variant="caption" color="tertiary">Incentive</AppText>
              <AppText variant="bodyMedium" style={{ color: palette.primary[500] }}>₹{formatIncentive(row.incentive)}</AppText>
            </View>
          )}
        </View>

        <View style={[styles.bar, { backgroundColor: colors.background.secondary }]}>
          <View style={[styles.barFill, { width: `${Math.min(collectedPct, 100)}%`, backgroundColor: palette.success.default }]} />
        </View>

        <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>
          {row.bills} bill{row.bills !== 1 ? "s" : ""} · {row.customers} customer{row.customers !== 1 ? "s" : ""}
          {row.sharedCollected > 0 ? ` · ₹${formatAmount(row.sharedCollected)} from ${row.sharedReceipts} shared payment${row.sharedReceipts !== 1 ? "s" : ""}` : ""}
        </AppText>
      </View>
    </TouchableOpacity>
  )
}

export default function SalesCollectionScreen() {
  const { colors } = useTheme()
  const params = useLocalSearchParams<{ month?: string }>()
  const [month, setMonth] = useState(() =>
    params.month && moment(params.month, "YYYY-MM", true).isValid() ? params.month : LAST_MONTH,
  )
  const { data, isLoading, isError, refetch, isRefetching } = useSalesCollection(month)

  const staffRows = data?.staff.filter((s) => s.isStaff) ?? []
  const otherRows = data?.staff.filter((s) => !s.isStaff) ?? []

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <DrawerMenuButton />
        <View style={{ flex: 1 }}>
          <AppText variant="heading2">Sales & Collection</AppText>
          <AppText variant="caption" color="tertiary">
            Bills by sales executive · payments within {data?.windowDays ?? 30} days of each bill · {data?.totals.bills ?? 0} bills, {data?.totals.customers ?? 0} customers
          </AppText>
        </View>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

      <View style={[styles.controls, { borderBottomColor: colors.border }]}>
        <MonthNav month={month} onChange={setMonth} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : isError || !data ? (
        <ErrorRetry message="Couldn't load sales and collection." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={[styles.strip, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
            <View style={styles.stripCell}>
              <AppText variant="heading3">₹{formatAmount(data.totals.sales)}</AppText>
              <AppText variant="caption" color="tertiary">Sales</AppText>
            </View>
            <View style={[styles.stripCell, styles.stripDivider, { borderLeftColor: colors.border }]}>
              <AppText variant="heading3" style={{ color: palette.success.default }}>₹{formatAmount(data.totals.collected)}</AppText>
              <AppText variant="caption" color="tertiary">Collected · {pct(data.totals.collected, data.totals.sales)}%</AppText>
            </View>
            <View style={[styles.stripCell, styles.stripDivider, { borderLeftColor: colors.border }]}>
              <AppText variant="heading3" style={{ color: palette.primary[500] }}>₹{formatIncentive(data.totals.incentive)}</AppText>
              <AppText variant="caption" color="tertiary">Incentive · {data.incentiveRate * 100}%</AppText>
            </View>
          </View>

          {data.windowOpen && (
            <View style={[styles.note, { backgroundColor: palette.warning.default + "14" }]}>
              <Info size={14} color={palette.warning.default} strokeWidth={2} />
              <AppText variant="caption" style={{ flex: 1, color: palette.warning.default }}>
                Still counting: payments up to {formatDay(data.windowClosesOn)} can add to this month's collection.
              </AppText>
            </View>
          )}

          {staffRows.length === 0 && otherRows.length === 0 && (
            <View style={styles.center}>
              <AppText color="tertiary">No sales this month</AppText>
            </View>
          )}

          {staffRows.map((row) => <StaffRow key={row.key} row={row} month={month} />)}

          {otherRows.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { backgroundColor: colors.background.secondary }]}>
                <AppText variant="caption" color="secondary">NOT ATTRIBUTED TO STAFF</AppText>
              </View>
              {otherRows.map((row) => <StaffRow key={row.key} row={row} month={month} />)}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  strip: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  stripCell: { flex: 1, alignItems: "center", paddingVertical: spacing[3], gap: 2 },
  stripDivider: { borderLeftWidth: StyleSheet.hairlineWidth },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
  },
  sectionHeader: { paddingHorizontal: spacing[6], paddingVertical: spacing[2], marginTop: spacing[4] },
  list: { paddingBottom: spacing[12] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
  row: { paddingHorizontal: spacing[6], paddingVertical: spacing[4], borderBottomWidth: 1, gap: spacing[2] },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  figures: { flexDirection: "row", gap: spacing[6] },
  figure: { gap: 2 },
  bar: { height: 4, borderRadius: radii.full, overflow: "hidden" },
  barFill: { height: 4, borderRadius: radii.full },
})
