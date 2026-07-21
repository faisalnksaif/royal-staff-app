import { View, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { useState, useEffect } from "react"
import { useRouter } from "expo-router"
import { LogOut, ChevronRight } from "lucide-react-native"
import type { GestureResponderEvent } from "react-native"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii, colors as palette } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"
import { useDashboardOverview } from "../../hooks/useDashboardOverview"
import type { FollowupDateField } from "../../services/followupService"
import type { ResolutionStatus } from "../../services/dashboardService"
import type { FollowUpOutcome } from "../../types"
import { toAPIDate, formatAmount } from "../../utils/helpers"
import StaffLeaderboardRow from "../../components/shared/StaffLeaderboardRow"
import DashboardFilterBar, { type DashboardPeriodValue } from "../../components/shared/DashboardFilterBar"
import DashboardSkeleton from "../../components/shared/DashboardSkeleton"
import RefreshButton from "../../components/shared/RefreshButton"
import DrawerMenuButton from "../../components/shared/DrawerMenuButton"
import { OUTCOME_LABELS, OUTCOME_COLORS } from "../../components/shared/OutcomeBadge"



function StatTile({ label, value, color, onPress }: { label: string; value: string; color: string; onPress?: (e: GestureResponderEvent) => void }) {
  const { colors } = useTheme()
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.statTilePressable, { opacity: pressed ? 0.75 : 1 }]}>
        <AppCard elevation="sm" style={styles.statTile}>
          <View style={styles.statTileHeader}>
            <AppText variant="caption" color="tertiary">{label}</AppText>
            <ChevronRight size={12} color={colors.text.tertiary} strokeWidth={1.75} />
          </View>
          <AppText variant="heading3" style={{ color }}>{value}</AppText>
        </AppCard>
      </Pressable>
    )
  }
  return (
    <AppCard elevation="sm" style={styles.statTile}>
      <AppText variant="caption" color="tertiary">{label}</AppText>
      <AppText variant="heading3" style={{ color }}>{value}</AppText>
    </AppCard>
  )
}

export default function SuperAdminHome() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [period, setPeriod] = useState<DashboardPeriodValue>("this_month")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [dateField, setDateField] = useState<FollowupDateField>("loggedAt")
  const [outcome, setOutcome] = useState<FollowUpOutcome | "all">("all")
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus | "all">("all")
  const [leaderSort, setLeaderSort] = useState<"outstanding" | "followups" | "paid" | "promised" | "customers" | "open">("followups")

  const isCustom = period === "custom"

  const { data, isLoading, isError, refetch, isRefetching } = useDashboardOverview({
    period: isCustom ? undefined : period,
    startDate: isCustom && startDate ? toAPIDate(startDate) : undefined,
    endDate: isCustom && endDate ? toAPIDate(endDate) : undefined,
    dateField,
    outcome: outcome === "all" ? undefined : outcome,
    resolutionStatus: resolutionStatus === "all" ? undefined : resolutionStatus,
  })
  const overview = data?.data

  function goToStaffFollowups(userId: number, staffName: string) {
    router.push({
      pathname: "/(admin)/staff-followups",
      params: {
        staffId: userId,
        staffName,
        period,
        startDate: isCustom && startDate ? toAPIDate(startDate) : undefined,
        endDate: isCustom && endDate ? toAPIDate(endDate) : undefined,
        dateField,
        outcome,
      },
    })
  }

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <DrawerMenuButton />
        <View style={{ flex: 1 }}>
          <AppText variant="heading2">Dashboard</AppText>
        </View>
        <View style={styles.headerActions}>
          <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
          {!isTablet && (
            <Pressable onPress={handleLogout} style={[styles.headerBtn, styles.cursorPointer]} hitSlop={8}>
              <LogOut size={18} color={colors.text.tertiary} strokeWidth={1.75} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.filterBarWrap}>
          <DashboardFilterBar
            period={period}
            onPeriodChange={setPeriod}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            dateField={dateField}
            onDateFieldChange={setDateField}
            outcome={outcome}
            onOutcomeChange={setOutcome}
            resolutionStatus={resolutionStatus}
            onResolutionStatusChange={setResolutionStatus}
          />
        </View>

        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <AppCard elevation="sm" style={styles.errorCard}>
            <AppText variant="body" color="secondary">Couldn't load the dashboard.</AppText>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <AppText variant="bodyMedium" color="accent">Retry</AppText>
            </Pressable>
          </AppCard>
        ) : overview ? (
          <>
            {isRefetching && (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: spacing[2] }} />
            )}

            {/* Company totals */}
            {isTablet ? (
              <View style={styles.statRow}>
                <StatTile label="Staff" value={String(overview.totals.total_staff)} color={colors.text.primary} />
                <StatTile label="Customers" value={String(overview.totals.total_customers)} color={colors.text.primary} onPress={() => router.push("/(admin)/all-customers")} />
                <StatTile
                  label="Outstanding"
                  value={`₹${formatAmount(overview.totals.total_outstanding)}`}
                  color={palette.error.default}
                  onPress={() => router.push("/(admin)/debt-history")}
                />
              </View>
            ) : (
              <View style={styles.statGrid}>
                <View style={styles.statRow}>
                  <StatTile label="Staff" value={String(overview.totals.total_staff)} color={colors.text.primary} />
                  <StatTile label="Customers" value={String(overview.totals.total_customers)} color={colors.text.primary} onPress={() => router.push("/(admin)/all-customers")} />
                </View>
                <StatTile
                  label="Outstanding"
                  value={`₹${formatAmount(overview.totals.total_outstanding)}`}
                  color={palette.error.default}
                  onPress={() => router.push("/(admin)/debt-history")}
                />
              </View>
            )}

            {/* Follow-up summary */}
            <Pressable onPress={() => router.push("/(admin)/all-followups")} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }, styles.cursorPointer]}>
            <AppCard elevation="sm" style={styles.followupCard}>
              <View style={styles.followupCardHeader}>
                <AppText variant="bodyMedium">Follow-ups</AppText>
                <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.75} />
              </View>
              <View style={[styles.followupMoneyRow, !isTablet && styles.followupMoneyRowMobile]}>
                <View style={styles.followupMoneyItem}>
                  <AppText variant="caption" color="tertiary">Logged</AppText>
                  <AppText variant="heading3">{overview.followups.totalFollowUps}</AppText>
                </View>
                <View style={[styles.followupMoneyDivider, { backgroundColor: colors.border }, !isTablet && styles.followupDividerMobile]} />
                <View style={styles.followupMoneyItem}>
                  <AppText variant="caption" color="tertiary">Promised</AppText>
                  <AppText variant={isTablet ? "heading3" : "bodyMedium"} style={{ color: palette.warning.default }}>
                    ₹{formatAmount(overview.followups.totalPromisedAmount)}
                  </AppText>
                </View>
                <View style={[styles.followupMoneyDivider, { backgroundColor: colors.border }, !isTablet && styles.followupDividerMobile]} />
                <View style={styles.followupMoneyItem}>
                  <AppText variant="caption" color="tertiary">Recovered</AppText>
                  <AppText variant={isTablet ? "heading3" : "bodyMedium"} style={{ color: palette.success.default }}>
                    ₹{formatAmount(overview.followups.totalPaidAmount)}
                  </AppText>
                </View>
              </View>

              <View style={styles.outcomePillRow}>
                {Object.entries(overview.followups.byOutcome)
                  .filter(([, count]) => count > 0)
                  .map(([outcomeKey, count]) => (
                    <View
                      key={outcomeKey}
                      style={[styles.outcomePill, { backgroundColor: (OUTCOME_COLORS[outcomeKey] ?? palette.neutral[400]) + "22" }]}
                    >
                      <AppText variant="caption" style={{ color: OUTCOME_COLORS[outcomeKey] ?? palette.neutral[500], fontSize: 11 }}>
                        {OUTCOME_LABELS[outcomeKey] ?? outcomeKey} · {count}
                      </AppText>
                    </View>
                  ))}
              </View>

              <View style={[styles.resolutionRow, { borderTopColor: colors.border }]}>
                <AppText variant="caption" color="tertiary">
                  {overview.followups.byResolution.resolved} resolved · {overview.followups.byResolution.open} open
                </AppText>
                {overview.notifications.unread_total > 0 && (
                  <AppText variant="caption" color="tertiary">
                    {overview.notifications.unread_total} unread notifications
                  </AppText>
                )}
              </View>
            </AppCard>
            </Pressable>

            {/* Staff leaderboard */}
            {(() => {
              const SORT_OPTIONS: { key: typeof leaderSort; label: string }[] = [
                { key: "outstanding", label: "Outstanding" },
                { key: "followups",   label: "Follow-ups" },
                { key: "paid",        label: "Paid" },
                { key: "promised",    label: "Promised" },
                { key: "open",        label: "Open" },
                { key: "customers",   label: "Customers" },
              ]
              const sortFn = (a: typeof overview.staff_leaderboard[0], b: typeof overview.staff_leaderboard[0]) => {
                switch (leaderSort) {
                  case "followups":   return (b.totalFollowUps ?? 0) - (a.totalFollowUps ?? 0)
                  case "paid":        return (b.totalPaidAmount ?? 0) - (a.totalPaidAmount ?? 0)
                  case "promised":    return (b.totalPromisedAmount ?? 0) - (a.totalPromisedAmount ?? 0)
                  case "customers":   return (b.customers_owned ?? 0) - (a.customers_owned ?? 0)
                  case "open":        return (b.byResolution?.open ?? 0) - (a.byResolution?.open ?? 0)
                  default:            return (b.total_outstanding ?? 0) - (a.total_outstanding ?? 0)
                }
              }
              const filteredLeaderboard = overview.staff_leaderboard
                .filter((e) => (e.customers_owned ?? 0) > 0)
                .filter((e) => outcome === "all" || (e.byOutcome?.[outcome] ?? 0) > 0)
                .filter((e) => {
                  if (resolutionStatus === "resolved") return (e.byResolution?.resolved ?? 0) > 0
                  if (resolutionStatus === "open") return (e.byResolution?.open ?? 0) > 0
                  return true
                })
                .slice()
                .sort(sortFn)
              if (filteredLeaderboard.length === 0) return null
              return (
                <AppCard elevation="sm" style={styles.leaderCard}>
                  <View style={styles.leaderHeader}>
                    <AppText variant="bodyMedium">Staff Follow-ups</AppText>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortChipRow} contentContainerStyle={styles.sortChipContent}>
                    <AppText variant="caption" color="tertiary" style={styles.sortByLabel}>Sort by</AppText>
                    {SORT_OPTIONS.map(({ key, label }) => {
                      const active = leaderSort === key
                      return (
                        <Pressable key={key} onPress={() => setLeaderSort(key)} style={[styles.sortTab, active && { borderBottomColor: colors.accent }]}>
                          <AppText variant="caption" style={{ color: active ? colors.accent : colors.text.secondary, fontWeight: active ? "600" : "400" }}>{label}</AppText>
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                  {filteredLeaderboard.map((entry, i) => (
                    <Pressable
                      key={entry.staff_id}
                      onPress={() => goToStaffFollowups(entry.user_id, entry.staff_name)}
                      style={styles.cursorPointer}
                    >
                      <StaffLeaderboardRow rank={i} entry={entry} accent={colors.accent} />
                    </Pressable>
                  ))}
                </AppCard>
              )
            })()}
          </>
        ) : null}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cursorPointer: {
    cursor: "pointer",
  },
  retryBtn: {
    cursor: "pointer",
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  headerBtn: {
    padding: spacing[2],
  },
  section: {
    padding: spacing[4],
  },
  filterBarWrap: {
    marginBottom: spacing[4],
  },
  loadingBox: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },
  errorCard: {
    alignItems: "center",
    gap: spacing[2],
  },
  statGrid: {
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statTilePressable: { flex: 1 },
  statTile: {
    flex: 1,
    gap: spacing[1],
  },
  statTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  followupCard: {
    marginBottom: spacing[3],
  },
  followupCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  followupMoneyRow: {
    flexDirection: "row",
    marginBottom: spacing[3],
  },
  followupMoneyRowMobile: {
    alignItems: "flex-start",
  },
  followupMoneyItem: {
    flex: 1,
    gap: spacing[1],
  },
  followupMoneyDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: spacing[3],
  },
  followupDividerMobile: {
    marginHorizontal: spacing[2],
  },
  outcomePillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  outcomePill: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  resolutionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  leaderCard: {
    marginBottom: spacing[1],
  },
  leaderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  sortChipRow: {
    marginBottom: spacing[3],
  },
  sortChipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  sortByLabel: {
    marginRight: spacing[2],
  },
  sortTab: {
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[1],
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
})
