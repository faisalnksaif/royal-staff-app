import { useState, useEffect, useRef } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Pressable, Animated, Easing, LayoutAnimation, Platform, UIManager, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { MessageCircle, CheckCircle2, X } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"
import { useStaffCustomers } from "../../hooks/useStaffCustomers"
import { formatDate } from "../../utils/helpers"
import type { LedgerCustomerOutstanding, LedgerFollowUpInsights, FollowUpOutcome, LedgerOutstandingFilter } from "../../types"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const PAGE_SIZE = 20

function formatAmount(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const OUTCOME_LABELS: Record<FollowUpOutcome, string> = {
  promisedToPay: "Promised Full Payment",
  promisedPartial: "Promised Partial",
  paid: "Paid",
  noContact: "No Contact",
  dispute: "Dispute",
}


// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTERS: { value: LedgerOutstandingFilter; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "overdue",         label: "Overdue" },
  { value: "open_followup",   label: "Open follow-up" },
  { value: "followed_up",     label: "Followed up" },
  { value: "not_followed_up", label: "Not contacted" },
  { value: "paid",            label: "Paid" },
]

function FilterChips({
  active,
  onChange,
}: {
  active: LedgerOutstandingFilter
  onChange: (f: LedgerOutstandingFilter) => void
}) {
  const { colors } = useTheme()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
      style={[styles.filterWrap, { borderBottomColor: colors.border }]}
    >
      {FILTERS.map(({ value, label }) => {
        const isActive = active === value
        return (
          <TouchableOpacity
            key={value}
            activeOpacity={0.7}
            onPress={() => onChange(value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive ? colors.accent : colors.background.secondary,
                borderColor: isActive ? colors.accent : colors.border,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={{ color: isActive ? "#fff" : colors.text.secondary }}
            >
              {label}
            </AppText>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

// ─── InsightsPanel ────────────────────────────────────────────────────────────

const OUTCOME_COLORS: Record<string, string> = {
  promisedToPay:   palette.success.default,
  promisedPartial: palette.warning.default,
  paid:            palette.success.dark,
  dispute:         palette.error.default,
  noContact:       palette.neutral[400],
}

function InsightsPanel({ insights }: { insights: LedgerFollowUpInsights }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const anim = useRef(new Animated.Value(0)).current

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    Animated.timing(anim, {
      toValue: open ? 0 : 1,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
    setOpen((v) => !v)
  }

  const chevronRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] })

  const resolutionPct = Math.round(insights.resolution_rate_pct ?? 0)
  const neverPct = insights.customers_total > 0
    ? Math.round((insights.customers_never_followed_up / insights.customers_total) * 100)
    : 0

  return (
    <View style={[styles.insightsWrapper, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <TouchableOpacity activeOpacity={0.7} onPress={toggle} style={styles.insightsHeader}>
        <AppText variant="bodyMedium" color="secondary">Follow-up Insights</AppText>
        <Animated.Text style={[styles.chevron, { transform: [{ rotate: chevronRotate }], color: colors.text.tertiary }]}>
          ▾
        </Animated.Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.insightsBody}>
          {/* Resolution rate bar */}
          <View style={styles.insightRow}>
            <View style={styles.insightLabelRow}>
              <AppText variant="caption" color="tertiary">Resolution rate</AppText>
              <AppText variant="caption" style={{ color: resolutionPct >= 50 ? palette.success.default : palette.warning.default }}>
                {resolutionPct}%
              </AppText>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.background.tertiary }]}>
              <View style={[styles.barFill, { width: `${resolutionPct}%`, backgroundColor: resolutionPct >= 50 ? palette.success.default : palette.warning.default }]} />
            </View>
          </View>

          {/* Open / Resolved counts */}
          <View style={styles.insightPillRow}>
            <View style={[styles.insightPill, { backgroundColor: palette.error.light }]}>
              <AppText variant="caption" style={{ color: palette.error.dark }}>{insights.open_followups} open</AppText>
            </View>
            <View style={[styles.insightPill, { backgroundColor: palette.success.light }]}>
              <AppText variant="caption" style={{ color: palette.success.dark }}>{insights.resolved_followups} paid</AppText>
            </View>
            <View style={[styles.insightPill, { backgroundColor: colors.background.secondary }]}>
              <AppText variant="caption" color="secondary">{insights.total_followups} total</AppText>
            </View>
          </View>

          {/* By outcome */}
          {Object.keys(insights.by_outcome).length > 0 && (
            <View style={styles.insightSection}>
              <AppText variant="caption" color="tertiary" style={styles.insightSectionLabel}>By outcome</AppText>
              <View style={styles.insightPillRow}>
                {Object.entries(insights.by_outcome).map(([outcome, count]) => (
                  <View key={outcome} style={[styles.insightPill, { backgroundColor: (OUTCOME_COLORS[outcome] ?? palette.neutral[400]) + "22" }]}>
                    <AppText variant="caption" style={{ color: OUTCOME_COLORS[outcome] ?? palette.neutral[500], fontSize: 11 }}>
                      {OUTCOME_LABELS[outcome as FollowUpOutcome] ?? outcome} · {count}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Coverage gap */}
          <View style={styles.insightSection}>
            <AppText variant="caption" color="tertiary" style={styles.insightSectionLabel}>Coverage gap</AppText>
            <View style={styles.insightPillRow}>
              <View style={[styles.insightPill, { backgroundColor: palette.warning.light }]}>
                <AppText variant="caption" style={{ color: palette.warning.dark }}>
                  {insights.customers_never_followed_up} never contacted ({neverPct}%)
                </AppText>
              </View>
            </View>
          </View>

          {/* Money metrics */}
          <View style={[styles.insightMoneyRow, { backgroundColor: colors.background.secondary, borderRadius: 8 }]}>
            <View style={styles.insightMoneyItem}>
              <AppText variant="caption" color="tertiary">Promised</AppText>
              <AppText variant="bodyMedium" style={{ color: palette.warning.default }}>
                ₹{formatAmount(insights.total_promised_amount)}
              </AppText>
            </View>
            <View style={[styles.insightMoneyDivider, { backgroundColor: colors.border }]} />
            <View style={styles.insightMoneyItem}>
              <AppText variant="caption" color="tertiary">Collected</AppText>
              <AppText variant="bodyMedium" style={{ color: palette.success.default }}>
                ₹{formatAmount(insights.total_received_via_resolved_followups)}
              </AppText>
            </View>
            {insights.avg_days_to_resolve != null && (
              <>
                <View style={[styles.insightMoneyDivider, { backgroundColor: colors.border }]} />
                <View style={styles.insightMoneyItem}>
                  <AppText variant="caption" color="tertiary">Avg resolve</AppText>
                  <AppText variant="bodyMedium" color="secondary">
                    {Math.round(insights.avg_days_to_resolve)}d
                  </AppText>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  totalCustomers, totalReceived, totalOutstanding, totalPromised, isLoading, accent,
}: {
  totalCustomers: number
  totalReceived: number
  totalOutstanding: number
  totalPromised: number
  isLoading: boolean
  accent: string
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.strip, { borderBottomColor: colors.border }]}>
      <View style={styles.stripItem}>
        <AppText variant="caption" color="tertiary">Customers</AppText>
        {isLoading ? (
          <ActivityIndicator size="small" color={accent} />
        ) : (
          <AppText variant="heading3" style={{ color: colors.text.primary }}>{totalCustomers}</AppText>
        )}
      </View>
      <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
      <View style={styles.stripItem}>
        <AppText variant="caption" color="tertiary">Collected</AppText>
        {isLoading ? (
          <ActivityIndicator size="small" color={palette.success.default} />
        ) : (
          <AppText variant="heading3" style={{ color: palette.success.default }}>
            ₹{formatAmount(totalReceived)}
          </AppText>
        )}
      </View>
      <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
      <View style={styles.stripItem}>
        <AppText variant="caption" color="tertiary">Outstanding</AppText>
        {isLoading ? (
          <ActivityIndicator size="small" color={palette.error.default} />
        ) : (
          <AppText variant="heading3" style={{ color: palette.error.default }}>
            ₹{formatAmount(totalOutstanding)}
          </AppText>
        )}
      </View>
      <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
      <View style={styles.stripItem}>
        <AppText variant="caption" color="tertiary">Promised</AppText>
        {isLoading ? (
          <ActivityIndicator size="small" color={palette.warning.default} />
        ) : (
          <AppText variant="heading3" style={{ color: palette.warning.default }}>
            ₹{formatAmount(totalPromised)}
          </AppText>
        )}
      </View>
    </View>
  )
}

// ─── CustomerRow ─────────────────────────────────────────────────────────────

function CustomerRow({ item }: { item: LedgerCustomerOutstanding }) {
  const router = useRouter()
  const fu = item.follow_up

  const totalPromised = fu?.total_promised_amount ?? 0
  const isFullPromise = fu?.last_outcome === "promisedToPay"
  const progressRatio = isFullPromise
    ? 1
    : item.outstanding_balance > 0
    ? Math.min(totalPromised / item.outstanding_balance, 1)
    : 0
  const progressColor = isFullPromise ? palette.success.default : palette.warning.default

  const animProgress = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: progressRatio,
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
  }, [progressRatio])

  const hasFollowUp = fu && fu.total > 0
  const isOverdue = fu?.is_overdue ?? false
  const isSettled = item.outstanding_balance === 0 && (fu?.open ?? 0) === 0 && (fu?.resolved ?? 0) > 0
  const hasResolved = (fu?.resolved ?? 0) > 0

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/customer/[name]",
          params: {
            name: item.name,
            totalBalance: String(item.outstanding_balance),
            drCr: item.outstanding_dr_cr,
            customerId: String(item.ledger_id),
            mobile: item.mobile ?? "",
          },
        })
      }
    >
      {({ pressed }) => (
        <AppCard
          elevation="sm"
          style={[
            styles.customerCard,
            { opacity: pressed ? 0.7 : 1 },
            isOverdue && styles.overdueCard,
            isSettled && styles.settledCard,
          ]}
        >
          <View style={styles.customerRow}>
            <View style={styles.customerLeft}>
              <View style={styles.nameRow}>
                <AppText variant="body">{toTitleCase(item.name)}</AppText>
                {isSettled && (
                  <View style={[styles.overduePill, { backgroundColor: palette.success.default + "22" }]}>
                    <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>
                      Settled
                    </AppText>
                  </View>
                )}
                {isOverdue && (
                  <View style={[styles.overduePill, { backgroundColor: palette.warning.default + "22" }]}>
                    <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>
                      Overdue
                    </AppText>
                  </View>
                )}
              </View>
              {hasFollowUp && (
                <>
                  <View style={styles.followupRow}>
                    <View style={[styles.outcomePill, { backgroundColor: palette.neutral[400] + "22" }]}>
                      <MessageCircle size={10} color={palette.neutral[500]} strokeWidth={1.75} />
                      <AppText variant="caption" style={{ color: palette.neutral[500], fontSize: 10 }}>
                        {fu.total} {fu.total === 1 ? "follow-up" : "follow-ups"}
                      </AppText>
                    </View>
                    {hasResolved && (
                      <View style={[styles.outcomePill, { backgroundColor: palette.success.default + "22" }]}>
                        <CheckCircle2 size={10} color={palette.success.default} strokeWidth={1.75} />
                        <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>
                          {fu.resolved} paid
                        </AppText>
                      </View>
                    )}
                  </View>
                  {fu.last_logged_at && (
                    <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
                      Last: {formatDate(fu.last_logged_at)}
                    </AppText>
                  )}
                  {fu.next_followup_date && (fu?.open ?? 0) > 0 && (
                    <AppText variant="caption" style={{ fontSize: 10, color: isOverdue ? palette.warning.default : palette.info.default }}>
                      Next: {formatDate(fu.next_followup_date)}
                    </AppText>
                  )}
                </>
              )}
            </View>
            <View style={styles.customerRight}>
              <AppText
                variant="mono"
                style={{
                  color: (isSettled || item.outstanding_dr_cr === "Cr") ? palette.success.default : palette.error.default,
                  fontSize: 16,
                }}
              >
                ₹{formatAmount(item.outstanding_balance)}{item.outstanding_dr_cr === "Cr" ? " Cr" : ""}
              </AppText>
              {totalPromised > 0 && (
                <AppText variant="mono" style={{ color: palette.warning.default, fontSize: 11, textAlign: "right" }}>
                  ₹{formatAmount(totalPromised)} promised
                </AppText>
              )}
            </View>
          </View>

          {(isFullPromise || (totalPromised > 0 && item.outstanding_balance > 0)) && (
            <View style={[styles.progressTrack, { backgroundColor: progressColor + "22" }]}>
              <Animated.View
                style={[styles.progressFill, {
                  backgroundColor: progressColor,
                  width: animProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                }]}
              />
            </View>
          )}
        </AppCard>
      )}
    </Pressable>
  )
}

// ─── CustomersScreen ─────────────────────────────────────────────────────────

export default function CustomersScreen() {
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<LedgerOutstandingFilter>("all")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useStaffCustomers(user?.user_id, { limit: PAGE_SIZE, search: debouncedSearch || undefined, filter: activeFilter })

  const customerList = data?.pages.flatMap((p) => p.data) ?? []

  // summary comes from first page (follow_up_insights is computed across all customers, not just the page)
  const firstPage = data?.pages[0]
  const insights = firstPage?.follow_up_insights
  const totalCustomers = insights?.customers_total ?? 0
  const totalReceived = insights?.total_received_via_resolved_followups ?? 0
  const totalOutstanding = firstPage?.totals?.total_outstanding ?? 0
  const totalPromised = insights?.total_promised_amount ?? 0

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <AppText variant="heading2">Customers</AppText>
      </View>

      <SummaryStrip
        totalCustomers={totalCustomers}
        totalReceived={totalReceived}
        totalOutstanding={totalOutstanding}
        totalPromised={totalPromised}
        isLoading={isLoading}
        accent={colors.accent}
      />

      {insights && <InsightsPanel insights={insights} />}

      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <AppInput
          placeholder="Search customer name..."
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          rightIcon={
            searchInput.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchInput("")} hitSlop={8}>
                <X size={16} color={colors.text.tertiary} strokeWidth={2} />
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      <FlatList
        data={customerList}
        keyExtractor={(item) => String(item.ledger_id)}
        renderItem={({ item }) => <CustomerRow item={item} />}
        ListHeaderComponent={<FilterChips active={activeFilter} onChange={setActiveFilter} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        onEndReachedThreshold={0.3}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.emptyCenter} />
          ) : (
            <View style={styles.emptyCenter}>
              <AppText color="tertiary">No customers found</AppText>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  strip: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stripItem: { flex: 1, alignItems: "center", gap: spacing[1] },
  stripDivider: { width: StyleSheet.hairlineWidth, alignSelf: "stretch" },
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  customerCard: { padding: 0, overflow: "hidden" },
  overdueCard: { borderLeftWidth: 3, borderLeftColor: palette.warning.default },
  settledCard: { borderLeftWidth: 3, borderLeftColor: palette.success.default },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
  },
  customerLeft: { flex: 1, gap: spacing[1] },
  customerRight: { alignItems: "flex-end", gap: spacing[1] },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  followupRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], marginTop: 2 },
  outcomePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  overduePill: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  progressTrack: { height: 3, overflow: "hidden" },
  progressFill: { height: 3 },
  emptyCenter: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
  // ─── InsightsPanel ───────────────────────────────────────────────────────────
  insightsWrapper: { paddingHorizontal: spacing[5] },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
  },
  chevron: { fontSize: 14 },
  insightsBody: { paddingBottom: spacing[4], gap: spacing[3] },
  insightRow: { gap: spacing[1] },
  insightLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  insightPillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  insightPill: { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 6 },
  insightSection: { gap: spacing[1] },
  insightSectionLabel: { marginBottom: 2 },
  insightMoneyRow: {
    flexDirection: "row",
    padding: spacing[3],
    gap: spacing[3],
  },
  insightMoneyItem: { flex: 1, gap: 2, alignItems: "center" },
  insightMoneyDivider: { width: StyleSheet.hairlineWidth, alignSelf: "stretch" },
  // ─── FilterChips ─────────────────────────────────────────────────────────────
  filterWrap: {},
  filterRow: { flexDirection: "row", gap: spacing[2], paddingBottom: spacing[3] },
  filterChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2, borderRadius: 20, borderWidth: 1 },
})
