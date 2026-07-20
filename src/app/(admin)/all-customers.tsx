import { useState, useEffect, useRef } from "react"
import {
  View, FlatList, StyleSheet, Pressable, TouchableOpacity,
  ActivityIndicator, Animated, Easing, ScrollView, Platform, UIManager,
} from "react-native"
import { useRouter } from "expo-router"
import { CheckCircle2, MessageCircle, X, ChevronRight } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { RETENTION_COLOR, RETENTION_STATUS_LABEL } from "../../constants/retention"
import { useAllCustomers } from "../../hooks/useAllCustomers"
import { useRetention } from "../../hooks/useRetention"
import { usePaymentVelocity } from "../../hooks/usePaymentVelocity"
import { formatDate } from "../../utils/helpers"
import type {
  LedgerCustomerOutstanding,
  LedgerOutstandingFilter,
  RetentionCustomer,
  RetentionStatus,
  RetentionResponse,
  RetentionSortBy,
  PaymentVelocityCustomer,
  PaymentVelocityResponse,
  PaymentVelocitySortBy,
  SortOrder,
} from "../../types"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function formatAmount(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── outstanding tab ──────────────────────────────────────────────────────────

const OUTSTANDING_FILTERS: { value: LedgerOutstandingFilter; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "overdue",         label: "Overdue" },
  { value: "open_followup",   label: "Open follow-up" },
  { value: "followed_up",     label: "Followed up" },
  { value: "not_followed_up", label: "Not contacted" },
  { value: "paid",            label: "Paid" },
]

function OutstandingRow({ item }: { item: LedgerCustomerOutstanding }) {
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
              <View style={styles.customerNameRow}>
                <AppText variant="body">{toTitleCase(item.name)}</AppText>
                {isSettled && (
                  <View style={[styles.pill, { backgroundColor: palette.success.default + "22" }]}>
                    <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>Settled</AppText>
                  </View>
                )}
                {isOverdue && (
                  <View style={[styles.pill, { backgroundColor: palette.warning.default + "22" }]}>
                    <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>Overdue</AppText>
                  </View>
                )}
              </View>
              {/* retention + velocity hints */}
              <View style={styles.fuRow}>
                {item.retention_status && item.retention_status !== "never_purchased" && (() => {
                  const color = RETENTION_COLOR[item.retention_status]
                  return (
                    <View style={[styles.pill, { backgroundColor: color + "18" }]}>
                      <AppText variant="caption" numberOfLines={1} style={{ color, fontSize: 10 }}>
                        {RETENTION_STATUS_LABEL[item.retention_status]}
                      </AppText>
                    </View>
                  )
                })()}
                {item.days_since_last_purchase != null && (
                  <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
                    {item.days_since_last_purchase}d since purchase
                  </AppText>
                )}
                {item.avg_days_to_clear != null && (
                  <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
                    · clears in {item.avg_days_to_clear.toFixed(0)}d
                  </AppText>
                )}
              </View>
              {item.days_since_last_payment != null && (
                <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
                  Last paid{" "}
                  <AppText variant="caption" style={{ fontSize: 10, color: item.days_since_last_payment <= 30 ? palette.success.default : item.days_since_last_payment <= 90 ? palette.warning.default : palette.error.default }}>
                    {item.days_since_last_payment}d ago
                  </AppText>
                  {item.last_payment_amount != null ? ` · ₹${formatAmount(item.last_payment_amount)}` : ""}
                </AppText>
              )}
              {hasFollowUp && (
                <>
                  <View style={styles.fuRow}>
                    <View style={[styles.pill, { backgroundColor: palette.neutral[400] + "22" }]}>
                      <MessageCircle size={10} color={palette.neutral[500]} strokeWidth={1.75} />
                      <AppText variant="caption" style={{ color: palette.neutral[500], fontSize: 10 }}>
                        {fu.total} {fu.total === 1 ? "follow-up" : "follow-ups"}
                      </AppText>
                    </View>
                    {hasResolved && (
                      <View style={[styles.pill, { backgroundColor: palette.success.default + "22" }]}>
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
                style={{ color: (isSettled || item.outstanding_dr_cr === "Cr") ? palette.success.default : palette.error.default, fontSize: 16 }}
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

// ─── retention tab ────────────────────────────────────────────────────────────

type RetentionFilter = "all" | RetentionStatus

const RETENTION_FILTERS: { value: RetentionFilter; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "active",          label: "Active" },
  { value: "at_risk",         label: "At Risk" },
  { value: "churned",         label: "Inactive" },
  { value: "never_purchased", label: "Never Purchased" },
]

function RetentionSummaryStrip({
  summary,
  filters,
  activeFilter,
  onFilter,
}: {
  summary: RetentionResponse["summary"]
  filters: RetentionResponse["filters"] | undefined
  activeFilter: RetentionFilter
  onFilter: (f: RetentionFilter) => void
}) {
  const { colors } = useTheme()
  const a = filters?.activeDays ?? 30
  const c = filters?.churnedDays ?? 90
  const atRiskPct = summary.total_customers > 0 ? (summary.at_risk / summary.total_customers) * 100 : 0
  const neverPct = summary.total_customers > 0 ? (summary.never_purchased / summary.total_customers) * 100 : 0
  const buckets: { key: RetentionFilter; label: string; count: number; color: string; pct?: string; hint: string }[] = [
    { key: "active",          label: "Active",         count: summary.active,          color: palette.success.default, pct: `${summary.active_pct.toFixed(0)}%`,   hint: `≤ ${a}d since purchase` },
    { key: "at_risk",         label: "At Risk",        count: summary.at_risk,         color: palette.warning.default, pct: `${atRiskPct.toFixed(0)}%`,            hint: `${a + 1}–${c}d since purchase` },
    { key: "churned",         label: "Inactive",        count: summary.churned,         color: palette.error.default,   pct: `${summary.churn_pct.toFixed(0)}%`,    hint: `> ${c}d since purchase` },
    { key: "never_purchased", label: "Never Purchased",count: summary.never_purchased, color: palette.neutral[500],    pct: `${neverPct.toFixed(0)}%`,             hint: "No sales recorded" },
  ]
  return (
    <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.background.secondary }}>
      <View style={styles.retentionStrip}>
        {buckets.map((b, i) => (
          <TouchableOpacity
            key={b.key}
            activeOpacity={0.7}
            onPress={() => onFilter(activeFilter === b.key ? "all" : b.key)}
            style={[
              styles.retentionStripCell,
              activeFilter === b.key && { backgroundColor: b.color + "18" },
              i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
            ]}
          >
            <AppText variant="heading3" style={{ color: b.color }}>{formatAmount(b.count)}</AppText>
            <AppText variant="caption" color="tertiary">{b.label}</AppText>
            {b.pct && <AppText variant="caption" style={{ color: b.color, fontSize: 10 }}>{b.pct}</AppText>}
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.retentionHintRow, { borderTopColor: colors.border }]}>
        {buckets.map((b, i) => (
          <View key={b.key} style={[styles.retentionHintCell, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}>
            <AppText variant="caption" style={{ color: palette.neutral[500], fontSize: 10, textAlign: "center" }}>{b.hint}</AppText>
          </View>
        ))}
      </View>
    </View>
  )
}

function RetentionRow({ customer }: { customer: RetentionCustomer }) {
  const { colors } = useTheme()
  const router = useRouter()
  const color = RETENTION_COLOR[customer.status]

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/customer/[name]",
          params: {
            name: customer.name,
            totalBalance: String(customer.outstanding_balance),
            drCr: customer.outstanding_dr_cr,
            customerId: String(customer.ledger_id),
            mobile: customer.mobile ?? "",
            initialTab: "ledger",
          },
        })
      }
      style={({ pressed }) => [styles.retentionRow, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.retentionRowMain}>
        <View style={styles.customerNameRow}>
          <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>{toTitleCase(customer.name)}</AppText>
          <View style={[styles.pill, { backgroundColor: color + "18" }]}>
            <AppText variant="caption" numberOfLines={1} style={{ color, fontSize: 10 }}>{RETENTION_STATUS_LABEL[customer.status]}</AppText>
          </View>
          <AppText variant="mono" style={{
            color: customer.outstanding_balance === 0 || customer.outstanding_dr_cr === "Cr"
              ? palette.success.default
              : palette.error.default,
            fontSize: 13,
          }}>
            ₹{formatAmount(customer.outstanding_balance)}{customer.outstanding_dr_cr === "Cr" ? " Cr" : ""}
          </AppText>
          <ChevronRight size={15} color={colors.text.tertiary} strokeWidth={1.75} />
        </View>
        <View style={styles.fuRow}>
          {customer.days_since_last_purchase != null ? (
            <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
              Last purchase <AppText variant="caption" style={{ color, fontSize: 12 }}>{customer.days_since_last_purchase}d ago</AppText>
            </AppText>
          ) : (
            <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>No purchases recorded</AppText>
          )}
          <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>
            · {customer.total_purchases} purchase{customer.total_purchases !== 1 ? "s" : ""}
          </AppText>
        </View>
        {customer.last_purchase_date && (
          <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
            Last: {new Date(customer.last_purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </AppText>
        )}
      </View>
    </Pressable>
  )
}

// ─── velocity tab ────────────────────────────────────────────────────────────

function velocityColor(days: number, companyAvg: number | null): string {
  if (companyAvg == null) return palette.neutral[400]
  if (days <= companyAvg * 0.6) return palette.success.default
  if (days <= companyAvg * 1.2) return palette.warning.default
  return palette.error.default
}

function VelocitySummaryStrip({ summary }: { summary: PaymentVelocityResponse["summary"] }) {
  const { colors } = useTheme()
  const avg = summary.company_avg_days_to_clear
  return (
    <View style={[styles.retentionStrip, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
      <View style={[styles.retentionStripCell, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border }]}>
        <AppText variant="heading3" style={{ color: colors.accent }}>
          {avg != null ? `${avg.toFixed(1)}d` : "—"}
        </AppText>
        <AppText variant="caption" color="tertiary">Company Avg to Clear</AppText>
      </View>
      <View style={styles.retentionStripCell}>
        <AppText variant="heading3" style={{ color: colors.text.primary }}>
          {summary.customers_ranked}
        </AppText>
        <AppText variant="caption" color="tertiary">Customers Ranked</AppText>
      </View>
    </View>
  )
}

function VelocityRow({ customer, companyAvg }: { customer: PaymentVelocityCustomer; companyAvg: number | null }) {
  const { colors } = useTheme()
  const router = useRouter()
  const color = velocityColor(customer.avg_days_to_clear, companyAvg)
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/customer/[name]",
          params: {
            name: customer.name,
            totalBalance: String(customer.outstanding_balance),
            drCr: customer.outstanding_dr_cr,
            customerId: String(customer.ledger_id),
            mobile: customer.mobile ?? "",
            initialTab: "ledger",
          },
        })
      }
      style={({ pressed }) => [styles.retentionRow, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.velRowInner}>
        <View style={{ flex: 1, gap: 3 }}>
          <AppText variant="body" numberOfLines={1}>{toTitleCase(customer.name)}</AppText>
          <View style={styles.fuRow}>
            <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
              Clears in <AppText variant="caption" style={{ color, fontSize: 12 }}>{customer.avg_days_to_clear.toFixed(1)}d</AppText> avg
            </AppText>
            <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>
              · {customer.cleared_pct.toFixed(0)}% cleared
            </AppText>
          </View>
          {customer.days_since_last_payment != null && (
            <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
              Last paid{" "}
              <AppText variant="caption" style={{ fontSize: 11, color: customer.days_since_last_payment <= 30 ? palette.success.default : customer.days_since_last_payment <= 90 ? palette.warning.default : palette.error.default }}>
                {customer.days_since_last_payment}d ago
              </AppText>
              {customer.last_payment_amount != null && (
                <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>{" "}· ₹{formatAmount(customer.last_payment_amount)}</AppText>
              )}
            </AppText>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 3 }}>
          <AppText variant="mono" style={{
            color: customer.outstanding_balance === 0 || customer.outstanding_dr_cr === "Cr"
              ? palette.success.default
              : palette.error.default,
            fontSize: 14,
          }}>
            ₹{formatAmount(customer.outstanding_balance)}{customer.outstanding_dr_cr === "Cr" ? " Cr" : ""}
          </AppText>
          <ChevronRight size={15} color={colors.text.tertiary} strokeWidth={1.75} />
        </View>
      </View>
      {/* cleared progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: color + "22", marginTop: spacing[2] }]}>
        <View style={[styles.progressFill, { backgroundColor: color, width: `${Math.min(customer.cleared_pct, 100)}%` as any }]} />
      </View>
    </Pressable>
  )
}

// ─── screen ───────────────────────────────────────────────────────────────────

type MainTab = "outstanding" | "retention" | "velocity"

export default function AllCustomersScreen() {
  const { colors } = useTheme()
  const [mainTab, setMainTab] = useState<MainTab>("outstanding")

  // outstanding state
  const [outSearch, setOutSearch] = useState("")
  const [outSearchDebounced, setOutSearchDebounced] = useState("")
  const [outFilter, setOutFilter] = useState<LedgerOutstandingFilter>("all")
  const [outSort, setOutSort] = useState<"priority" | "balance">("priority")
  useEffect(() => {
    const t = setTimeout(() => setOutSearchDebounced(outSearch), 400)
    return () => clearTimeout(t)
  }, [outSearch])

  // retention state
  const [retSearch, setRetSearch] = useState("")
  const [retSearchDebounced, setRetSearchDebounced] = useState("")
  const [retFilter, setRetFilter] = useState<RetentionFilter>("all")
  const [retSortBy, setRetSortBy] = useState<RetentionSortBy>("days_since_last_purchase")
  const [retOrder, setRetOrder] = useState<SortOrder>("asc")
  useEffect(() => {
    const t = setTimeout(() => setRetSearchDebounced(retSearch), 350)
    return () => clearTimeout(t)
  }, [retSearch])

  const { data: outData, isLoading: outLoading, isError: outError, refetch, hasNextPage: outHasNext, isFetchingNextPage: outFetching, fetchNextPage: outFetchNext } =
    useAllCustomers({ limit: 50, search: outSearchDebounced || undefined, filter: outFilter, sortBy: outSort })

  const { data: retData, isLoading: retLoading, isError: retError, hasNextPage: retHasNext, isFetchingNextPage: retFetching, fetchNextPage: retFetchNext } =
    useRetention({ status: retFilter, search: retSearchDebounced || undefined, sortBy: retSortBy, order: retOrder })

  // velocity state
  const [velSearch, setVelSearch] = useState("")
  const [velSearchDebounced, setVelSearchDebounced] = useState("")
  const [velSortBy, setVelSortBy] = useState<PaymentVelocitySortBy>("avg_days_to_clear")
  const [velOrder, setVelOrder] = useState<SortOrder>("asc")
  useEffect(() => {
    const t = setTimeout(() => setVelSearchDebounced(velSearch), 350)
    return () => clearTimeout(t)
  }, [velSearch])

  const { data: velData, isLoading: velLoading, isError: velError, hasNextPage: velHasNext, isFetchingNextPage: velFetching, fetchNextPage: velFetchNext } =
    usePaymentVelocity({ search: velSearchDebounced || undefined, sortBy: velSortBy, order: velOrder })

  const customers = outData?.pages.flatMap((p) => p.data) ?? []
  const total = outData?.pages[0]?.pagination.total ?? 0
  const retCustomers = retData?.pages.flatMap((p) => p.data) ?? []
  const retSummary = retData?.pages[0]?.summary
  const retFilters = retData?.pages[0]?.filters
  const velCustomers = velData?.pages.flatMap((p) => p.data) ?? []
  const velSummary = velData?.pages[0]?.summary

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">All Customers</AppText>
          {mainTab === "outstanding" && !outLoading && (
            <AppText variant="caption" color="secondary">{total} total</AppText>
          )}
        </View>
      </View>

      {/* Main tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {([
          { value: "outstanding", label: "Outstanding" },
          { value: "retention",   label: "Retention" },
          { value: "velocity",    label: "Pay Velocity" },
        ] as { value: MainTab; label: string }[]).map(({ value, label }) => {
          const isActive = mainTab === value
          return (
            <TouchableOpacity
              key={value}
              activeOpacity={0.7}
              onPress={() => setMainTab(value)}
              style={[styles.tab, { borderBottomColor: isActive ? colors.accent : "transparent" }]}
            >
              <AppText variant={isActive ? "bodyMedium" : "body"} style={{ color: isActive ? colors.accent : colors.text.secondary }}>
                {label}
              </AppText>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Outstanding tab ── */}
      {mainTab === "outstanding" && (
        <>
          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <AppInput
              placeholder="Search customer name..."
              value={outSearch}
              onChangeText={setOutSearch}
              returnKeyType="search"
              rightIcon={
                outSearch.length > 0 ? (
                  <TouchableOpacity onPress={() => setOutSearch("")} hitSlop={8}>
                    <X size={16} color={colors.text.tertiary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : undefined
              }
            />
          </View>
          <View style={[styles.filterWrap, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {OUTSTANDING_FILTERS.map(({ value, label }) => {
                const isActive = outFilter === value
                return (
                  <TouchableOpacity
                    key={value}
                    activeOpacity={0.7}
                    onPress={() => setOutFilter(value)}
                    style={[styles.filterChip, {
                      backgroundColor: isActive ? colors.accent : colors.background.secondary,
                      borderColor: isActive ? colors.accent : colors.border,
                    }]}
                  >
                    <AppText variant="caption" style={{ color: isActive ? "#fff" : colors.text.secondary }}>{label}</AppText>
                  </TouchableOpacity>
                )
              })}
              <View style={[styles.sortDivider, { backgroundColor: colors.border }]} />
              {([
                { value: "priority", label: "Priority ↑" },
                { value: "balance",  label: "Balance ↑" },
              ] as { value: "priority" | "balance"; label: string }[]).map(({ value, label }) => {
                const isActive = outSort === value
                return (
                  <TouchableOpacity
                    key={value}
                    activeOpacity={0.7}
                    onPress={() => setOutSort(value)}
                    style={[styles.filterChip, {
                      backgroundColor: isActive ? colors.text.primary + "18" : colors.background.secondary,
                      borderColor: isActive ? colors.text.primary : colors.border,
                    }]}
                  >
                    <AppText variant="caption" style={{ color: isActive ? colors.text.primary : colors.text.tertiary }}>{label}</AppText>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
          {outLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : outError ? (
            <View style={styles.center}>
              <AppText color="secondary">Couldn't load customers.</AppText>
              <Pressable onPress={() => refetch()}>
                <AppText variant="bodyMedium" color="accent">Retry</AppText>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={customers}
              keyExtractor={(item) => String(item.ledger_id)}
              renderItem={({ item }) => <OutstandingRow item={item} />}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
              onEndReachedThreshold={0.3}
              onEndReached={() => { if (outHasNext && !outFetching) outFetchNext() }}
              ListFooterComponent={outFetching ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} /> : null}
              ListEmptyComponent={<View style={styles.center}><AppText color="tertiary">No customers found</AppText></View>}
            />
          )}
        </>
      )}

      {/* ── Velocity tab ── */}
      {mainTab === "velocity" && (
        <>
          {velSummary && <VelocitySummaryStrip summary={velSummary} />}
          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <AppInput
              placeholder="Search customer name..."
              value={velSearch}
              onChangeText={setVelSearch}
              returnKeyType="search"
              rightIcon={
                velSearch.length > 0 ? (
                  <TouchableOpacity onPress={() => setVelSearch("")} hitSlop={8}>
                    <X size={16} color={colors.text.tertiary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : undefined
              }
            />
          </View>
          <View style={[styles.filterWrap, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {(
                [
                  { value: "avg_days_to_clear",       label: "Avg Days" },
                  { value: "days_since_last_payment", label: "Last Payment" },
                  { value: "cleared_pct",             label: "% Cleared" },
                  { value: "outstanding_balance",     label: "Outstanding" },
                  { value: "total_debt_amount",       label: "Total Debt" },
                  { value: "total_cleared_amount",    label: "Cleared Amt" },
                ] as { value: PaymentVelocitySortBy; label: string }[]
              ).map(({ value, label }) => {
                const isActive = velSortBy === value
                const asc = velOrder === "asc"
                return (
                  <TouchableOpacity
                    key={value}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isActive) setVelOrder(asc ? "desc" : "asc")
                      else { setVelSortBy(value); setVelOrder("asc") }
                    }}
                    style={[styles.filterChip, {
                      backgroundColor: isActive ? colors.accent : colors.background.secondary,
                      borderColor: isActive ? colors.accent : colors.border,
                      flexDirection: "row",
                      gap: 4,
                    }]}
                  >
                    <AppText variant="caption" style={{ color: isActive ? "#fff" : colors.text.secondary }}>{label}</AppText>
                    {isActive && (
                      <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>{asc ? "↑" : "↓"}</AppText>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
          {velLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : velError ? (
            <View style={styles.center}><AppText color="secondary">Couldn't load velocity data.</AppText></View>
          ) : (
            <FlatList
              data={velCustomers}
              keyExtractor={(item) => String(item.ledger_id)}
              renderItem={({ item }) => <VelocityRow customer={item} companyAvg={velSummary?.company_avg_days_to_clear ?? null} />}
              contentContainerStyle={{ paddingBottom: spacing[12] }}
              onEndReachedThreshold={0.3}
              onEndReached={() => { if (velHasNext && !velFetching) velFetchNext() }}
              ListFooterComponent={velFetching ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} /> : null}
              ListEmptyComponent={<View style={styles.center}><AppText color="tertiary">No data yet</AppText></View>}
            />
          )}
        </>
      )}

      {/* ── Retention tab ── */}
      {mainTab === "retention" && (
        <>
          {retSummary && (
            <RetentionSummaryStrip summary={retSummary} filters={retFilters} activeFilter={retFilter} onFilter={setRetFilter} />
          )}
          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <AppInput
              placeholder="Search customer name..."
              value={retSearch}
              onChangeText={setRetSearch}
              returnKeyType="search"
              rightIcon={
                retSearch.length > 0 ? (
                  <TouchableOpacity onPress={() => setRetSearch("")} hitSlop={8}>
                    <X size={16} color={colors.text.tertiary} strokeWidth={2} />
                  </TouchableOpacity>
                ) : undefined
              }
            />
          </View>
          <View style={[styles.filterWrap, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {RETENTION_FILTERS.map(({ value, label }) => {
                const isActive = retFilter === value
                return (
                  <TouchableOpacity
                    key={value}
                    activeOpacity={0.7}
                    onPress={() => setRetFilter(value)}
                    style={[styles.filterChip, {
                      backgroundColor: isActive ? colors.accent : colors.background.secondary,
                      borderColor: isActive ? colors.accent : colors.border,
                    }]}
                  >
                    <AppText variant="caption" style={{ color: isActive ? "#fff" : colors.text.secondary }}>{label}</AppText>
                  </TouchableOpacity>
                )
              })}
              <View style={[styles.sortDivider, { backgroundColor: colors.border }]} />
              {(
                [
                  { value: "days_since_last_purchase", label: "Last Purchase" },
                  { value: "outstanding_balance",      label: "Balance" },
                  { value: "total_purchases",          label: "Purchases" },
                  { value: "last_purchase_date",       label: "Purchase Date" },
                ] as { value: RetentionSortBy; label: string }[]
              ).map(({ value, label }) => {
                const isActive = retSortBy === value
                const asc = retOrder === "asc"
                return (
                  <TouchableOpacity
                    key={value}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isActive) setRetOrder(asc ? "desc" : "asc")
                      else { setRetSortBy(value); setRetOrder("asc") }
                    }}
                    style={[styles.filterChip, {
                      backgroundColor: isActive ? colors.text.primary + "18" : colors.background.secondary,
                      borderColor: isActive ? colors.text.primary : colors.border,
                      flexDirection: "row",
                      gap: 4,
                    }]}
                  >
                    <AppText variant="caption" style={{ color: isActive ? colors.text.primary : colors.text.tertiary }}>{label}</AppText>
                    {isActive && (
                      <AppText variant="caption" style={{ color: colors.text.primary, fontSize: 10 }}>{asc ? "↑" : "↓"}</AppText>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
          {retLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : retError ? (
            <View style={styles.center}><AppText color="secondary">Couldn't load retention data.</AppText></View>
          ) : (
            <FlatList
              data={retCustomers}
              keyExtractor={(item) => String(item.ledger_id)}
              renderItem={({ item }) => <RetentionRow customer={item} />}
              contentContainerStyle={{ paddingBottom: spacing[12] }}
              onEndReachedThreshold={0.3}
              onEndReached={() => { if (retHasNext && !retFetching) retFetchNext() }}
              ListFooterComponent={retFetching ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} /> : null}
              ListEmptyComponent={<View style={styles.center}><AppText color="tertiary">No customers found</AppText></View>}
            />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    marginRight: spacing[2],
  },
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  filterChipRow: { flexDirection: "row", paddingHorizontal: spacing[4], paddingVertical: spacing[2], gap: spacing[2] },
  filterChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2, borderRadius: 20, borderWidth: 1 },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  customerCard: { padding: 0, overflow: "hidden" },
  overdueCard: { borderLeftWidth: 3, borderLeftColor: palette.warning.default },
  settledCard: { borderLeftWidth: 3, borderLeftColor: palette.success.default },
  customerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing[4] },
  customerLeft: { flex: 1, gap: spacing[1] },
  customerRight: { alignItems: "flex-end", gap: spacing[1] },
  customerNameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  fuRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], marginTop: 2 },
  pill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  progressTrack: { height: 3, overflow: "hidden" },
  progressFill: { height: 3 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[16] },
  retentionStrip: { flexDirection: "row" },
  retentionStripCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    gap: 2,
  },
  retentionHintRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  retentionHintCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[1] + 1,
  },
  retentionRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  retentionRowMain: { gap: spacing[1] },
  velRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  sortDivider: { width: StyleSheet.hairlineWidth, marginVertical: spacing[2] },
})
