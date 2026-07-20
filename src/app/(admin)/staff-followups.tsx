import { useState, useEffect, useRef } from "react"
import {
  View, FlatList, StyleSheet, Pressable, TouchableOpacity,
  ScrollView, ActivityIndicator, Animated, Easing, LayoutAnimation, Platform, UIManager,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import {
  Phone, MessageSquare, Mail, UserCheck, MessageCircle,
  CheckCircle2, Calendar, Clock, Wallet, X, ClipboardList, ChevronRight, RefreshCw,
} from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import DashboardFilterBar, { type DashboardPeriodValue } from "../../components/shared/DashboardFilterBar"
import type { ResolutionStatus } from "../../services/dashboardService"
import FollowUpListSkeleton from "../../components/shared/FollowUpListSkeleton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { useAllFollowups } from "../../hooks/useAllFollowups"
import { useStaffCustomers } from "../../hooks/useStaffCustomers"
import { toAPIDate, formatDate } from "../../utils/helpers"
import moment from "moment"
import type { FollowupDateField } from "../../services/followupService"
import type { FollowUp, ContactMethod, FollowUpOutcome, LedgerCustomerOutstanding, LedgerOutstandingFilter } from "../../types"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatAmount(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function isDashboardPeriod(value: unknown): value is DashboardPeriodValue {
  return value === "today" || value === "yesterday" || value === "this_month" || value === "custom"
}

function isDateField(value: unknown): value is FollowupDateField {
  return value === "loggedAt" || value === "promisedDate" || value === "resolvedAt"
}

function isOutcome(value: unknown): value is FollowUpOutcome {
  return value === "promisedToPay" || value === "promisedPartial" || value === "dispute" || value === "noResponse"
}

function parseParamDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

const CONTACT_LABELS: Record<ContactMethod, string> = {
  phoneCall: "Phone", sms: "SMS", email: "Email", inPerson: "In Person", whatsapp: "WhatsApp",
}

const OUTCOME_LABELS: Record<FollowUpOutcome, string> = {
  promisedToPay:   "Promised Full Payment",
  promisedPartial: "Promised Partial",
  dispute:         "Dispute",
  noResponse:      "No Response",
}

function outcomeColor(o: FollowUpOutcome): string {
  switch (o) {
    case "promisedToPay":   return palette.success.default
    case "promisedPartial": return palette.warning.default
    case "dispute":         return palette.error.default
    case "noResponse":      return palette.neutral[500]
  }
}

function ContactIcon({ method, color }: { method: ContactMethod; color: string }) {
  const p = { size: 12, color, strokeWidth: 1.75 }
  switch (method) {
    case "phoneCall":  return <Phone {...p} />
    case "sms":        return <MessageSquare {...p} />
    case "email":      return <Mail {...p} />
    case "inPerson":   return <UserCheck {...p} />
    case "whatsapp":   return <MessageCircle {...p} />
  }
}

// ─── follow-up timeline card ──────────────────────────────────────────────────

function EventRow({ icon, text, color, isLast }: { icon: React.ReactNode; text: string; color: string; isLast: boolean }) {
  return (
    <View style={styles.eventRow}>
      <View style={styles.eventDotCol}>
        <View style={[styles.eventDot, { backgroundColor: color }]} />
        {!isLast && <View style={[styles.eventLine, { backgroundColor: color + "40" }]} />}
      </View>
      <View style={[styles.eventText, !isLast && styles.eventTextSpaced]}>
        <View style={styles.eventTextInner}>
          {icon}
          <AppText variant="caption" style={{ color, flex: 1, fontSize: 12 }}>{text}</AppText>
        </View>
      </View>
    </View>
  )
}

function FollowUpCard({ item }: { item: FollowUp }) {
  const { colors } = useTheme()
  const router = useRouter()
  const color = outcomeColor(item.outcome)
  const resolved = item.resolvedByPayment

  type Event = { icon: React.ReactNode; text: string; color: string }
  const events: Event[] = [
    {
      icon: <ClipboardList size={11} color={palette.neutral[400]} strokeWidth={1.75} />,
      text: `Logged ${formatDate(item.loggedAt)}`,
      color: palette.neutral[500],
    },
  ]
  if (item.outstandingAmount != null && !item.outstandingBackfilled) {
    events.push({
      icon: <Wallet size={11} color={palette.neutral[400]} strokeWidth={1.75} />,
      text: `Balance then: ₹${formatAmount(item.outstandingAmount)} ${item.outstandingDrCr}`,
      color: palette.neutral[500],
    })
  }
  if (item.promisedAmount != null) {
    events.push({
      icon: <Calendar size={11} color={palette.warning.default} strokeWidth={1.75} />,
      text: `Promised ₹${formatAmount(item.promisedAmount)}${item.promisedDate ? ` by ${formatDate(item.promisedDate)}` : ""}`,
      color: palette.warning.default,
    })
  }
  if (item.nextFollowUpDate && !resolved) {
    events.push({
      icon: <Clock size={11} color={palette.info.default} strokeWidth={1.75} />,
      text: `Next follow-up: ${formatDate(item.nextFollowUpDate)}`,
      color: palette.info.default,
    })
  }
  if (resolved && item.resolvedAt) {
    events.push({
      icon: <CheckCircle2 size={11} color={palette.success.default} strokeWidth={1.75} />,
      text: `Paid on ${formatDate(item.resolvedAt)}${item.amountRecovered ? ` · ₹${formatAmount(item.amountRecovered)} recovered` : ""}`,
      color: palette.success.default,
    })
  }
  if (resolved && item.outstandingAmountAtResolution != null) {
    const bal = item.outstandingAmountAtResolution
    const balDrCr = item.outstandingDrCrAtResolution ?? "Dr"
    events.push({
      icon: <Wallet size={11} color={bal === 0 ? palette.success.default : palette.neutral[400]} strokeWidth={1.75} />,
      text: bal === 0 ? `Balance cleared` : `Balance after: ₹${formatAmount(bal)} ${balDrCr}`,
      color: bal === 0 ? palette.success.default : palette.neutral[500],
    })
  }
  for (const send of (item.whatsappSends ?? [])) {
    const isReceipt = send.type === "receipt"
    const sendColor = isReceipt ? palette.success.dark : palette.warning.dark
    events.push({
      icon: <MessageCircle size={11} color={sendColor} strokeWidth={1.75} />,
      text: `WhatsApp ${isReceipt ? "receipt" : "reminder"} sent ${formatDate(send.sentAt)}`,
      color: sendColor,
    })
  }

  function goToCustomer() {
    router.push({
      pathname: "/customer/[name]",
      params: {
        name: item.customerName,
        customerId: item.customerId ?? item.ledgerId ?? "",
        totalBalance: "",
        drCr: "",
        mobile: item.mobile ?? "",
      },
    })
  }

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={goToCustomer}>
      <View style={[styles.row, { borderBottomColor: colors.border as string }]}>
        {/* Header row */}
        <View style={styles.rowHeader}>
          <ContactIcon method={item.contactMethod} color={colors.text.tertiary as string} />
          <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>{toTitleCase(item.customerName)}</AppText>
          <View style={[styles.outcomeBadge, { backgroundColor: color + "22", flexShrink: 1 }]}>
            <AppText variant="caption" style={{ color, fontSize: 11 }} numberOfLines={1}>{OUTCOME_LABELS[item.outcome]}</AppText>
          </View>
          <AppText variant="caption" color="tertiary" numberOfLines={1}>{moment(item.loggedAt).fromNow()}</AppText>
          <ChevronRight size={14} color={colors.text.tertiary} strokeWidth={1.75} />
        </View>
        {events.length > 0 && (
          <View style={styles.eventList}>
            {events.map((ev, i) => (
              <EventRow key={i} icon={ev.icon} text={ev.text} color={ev.color} isLast={i === events.length - 1} />
            ))}
          </View>
        )}
        {item.freeTextRemark ? (
          <AppText variant="caption" color="secondary" numberOfLines={2} style={styles.remark}>
            "{item.freeTextRemark}"
          </AppText>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

// ─── customers tab ────────────────────────────────────────────────────────────

const CUSTOMER_FILTERS: { value: LedgerOutstandingFilter; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "overdue",         label: "Overdue" },
  { value: "open_followup",   label: "Open follow-up" },
  { value: "followed_up",     label: "Followed up" },
  { value: "not_followed_up", label: "Not contacted" },
  { value: "paid",            label: "Paid" },
]

function CustomerRow({ item }: { item: LedgerCustomerOutstanding }) {
  const router = useRouter()
  const { colors } = useTheme()
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
    <TouchableOpacity
      activeOpacity={0.7}
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
      <View style={[styles.row, { borderBottomColor: colors.border as string }]}>
        <View style={styles.rowHeader}>
          <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>{toTitleCase(item.name)}</AppText>
          {isSettled && (
            <View style={[styles.pill, { backgroundColor: palette.success.default + "22" }]}>
              <AppText variant="caption" numberOfLines={1} style={{ color: palette.success.default, fontSize: 10 }}>Settled</AppText>
            </View>
          )}
          {isOverdue && (
            <View style={[styles.pill, { backgroundColor: palette.warning.default + "22" }]}>
              <AppText variant="caption" numberOfLines={1} style={{ color: palette.warning.default, fontSize: 10 }}>Overdue</AppText>
            </View>
          )}
          <AppText
            variant="mono"
            style={{ color: (isSettled || item.outstanding_dr_cr === "Cr") ? palette.success.default : palette.error.default, fontSize: 13 }}
          >
            ₹{formatAmount(item.outstanding_balance)}{item.outstanding_dr_cr === "Cr" ? " Cr" : ""}
          </AppText>
          <ChevronRight size={15} color={colors.text.tertiary} strokeWidth={1.75} />
        </View>

        {hasFollowUp && (
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
            {totalPromised > 0 && (
              <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>
                ₹{formatAmount(totalPromised)} promised
              </AppText>
            )}
          </View>
        )}

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
      </View>
    </TouchableOpacity>
  )
}

function CustomersTab({ staffId }: { staffId: number }) {
  const { colors } = useTheme()
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<LedgerOutstandingFilter>("all")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useStaffCustomers(staffId, { limit: 20, search: debouncedSearch || undefined, filter: activeFilter })

  const customerList = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <FlatList
      data={customerList}
      keyExtractor={(item) => String(item.ledger_id)}
      renderItem={({ item }) => <CustomerRow item={item} />}
      ListHeaderComponent={
        <View>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
            style={[styles.filterWrap, { borderBottomColor: colors.border }]}
          >
            {CUSTOMER_FILTERS.map(({ value, label }) => {
              const isActive = activeFilter === value
              return (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.7}
                  onPress={() => setActiveFilter(value)}
                  style={[styles.filterChip, {
                    backgroundColor: isActive ? colors.accent : colors.background.secondary,
                    borderColor: isActive ? colors.accent : colors.border,
                  }]}
                >
                  <AppText variant="caption" style={{ color: isActive ? "#fff" : colors.text.secondary }}>
                    {label}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      }
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      onEndReachedThreshold={0.3}
      onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : (
          <View style={styles.center}>
            <AppText color="tertiary">No customers found</AppText>
          </View>
        )
      }
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} /> : null
      }
    />
  )
}

// ─── screen ───────────────────────────────────────────────────────────────────

type Tab = "followups" | "customers"
const TABS: { value: Tab; label: string }[] = [
  { value: "followups", label: "Follow-ups" },
  { value: "customers", label: "Customers" },
]

export default function StaffFollowupsScreen() {
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>("followups")

  const params = useLocalSearchParams<{
    staffId?: string
    staffName?: string
    period?: string
    startDate?: string
    endDate?: string
    dateField?: string
    outcome?: string
  }>()

  const staffId = params.staffId ? Number(params.staffId) : undefined

  const [period, setPeriod] = useState<DashboardPeriodValue>(
    isDashboardPeriod(params.period) ? params.period : "this_month"
  )
  const [startDate, setStartDate] = useState<Date | null>(parseParamDate(params.startDate))
  const [endDate, setEndDate] = useState<Date | null>(parseParamDate(params.endDate))
  const [dateField, setDateField] = useState<FollowupDateField>(
    isDateField(params.dateField) ? params.dateField : "loggedAt"
  )
  const [outcome, setOutcome] = useState<FollowUpOutcome | "all">(
    isOutcome(params.outcome) ? params.outcome : "all"
  )
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus | "all">("all")

  const isCustom = period === "custom"

  const { data, isLoading, isError, refetch, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage } = useAllFollowups({
    staffId,
    limit: 50,
    period: isCustom ? undefined : period,
    startDate: isCustom && startDate ? toAPIDate(startDate) : undefined,
    endDate: isCustom && endDate ? toAPIDate(endDate) : undefined,
    dateField,
    outcome: outcome === "all" ? undefined : outcome,
  })

  const followups = data?.pages.flatMap((p) => p.data) ?? []
  const summary = data?.pages[0]?.summary

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">{params.staffName ?? "Staff Follow-ups"}</AppText>
        </View>
        <Pressable onPress={() => refetch()} hitSlop={8} style={{ padding: spacing[2], cursor: "pointer" } as any}>
          {isRefetching ? <ActivityIndicator size="small" color={colors.accent} /> : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
        </Pressable>
      </View>

      {/* Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={styles.tabWrap}>
          {TABS.map(({ value, label }) => {
            const isActive = activeTab === value
            return (
              <TouchableOpacity
                key={value}
                activeOpacity={0.7}
                onPress={() => setActiveTab(value)}
                style={[styles.tab, { borderBottomColor: isActive ? colors.accent : "transparent" }]}
              >
                <AppText variant="bodyMedium" style={{ color: isActive ? colors.accent : colors.text.secondary }}>
                  {label}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
        <View style={[styles.tabDivider, { backgroundColor: colors.border }]} />
      </View>

      {/* Follow-ups tab */}
      {activeTab === "followups" && (
        <>
          <View style={styles.section}>
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

          {summary && summary.totalFollowUps > 0 && (
            <View style={[styles.summaryStrip, { borderBottomColor: colors.border }]}>
              <View style={styles.summaryItem}>
                <AppText variant="heading3">{summary.totalFollowUps}</AppText>
                <AppText variant="caption" color="tertiary">Total</AppText>
              </View>
              <View style={styles.summaryItem}>
                <AppText variant="heading3" style={{ color: palette.info.default }}>{summary.byResolution.open}</AppText>
                <AppText variant="caption" color="tertiary">Open</AppText>
              </View>
              <View style={styles.summaryItem}>
                <AppText variant="heading3" style={{ color: palette.success.default }}>{summary.byResolution.resolved}</AppText>
                <AppText variant="caption" color="tertiary">Paid</AppText>
              </View>
              {summary.totalPromisedAmount > 0 && (
                <View style={styles.summaryItem}>
                  <AppText variant="heading3" style={{ color: palette.warning.default }}>
                    ₹{formatAmount(summary.totalPromisedAmount)}
                  </AppText>
                  <AppText variant="caption" color="tertiary">Promised</AppText>
                </View>
              )}
              {summary.totalPaidAmount > 0 && (
                <View style={styles.summaryItem}>
                  <AppText variant="heading3" style={{ color: palette.success.default }}>
                    ₹{formatAmount(summary.totalPaidAmount)}
                  </AppText>
                  <AppText variant="caption" color="tertiary">Collected</AppText>
                </View>
              )}
            </View>
          )}

          {isLoading ? (
            <FollowUpListSkeleton />
          ) : isError ? (
            <View style={styles.center}>
              <AppText variant="body" color="secondary">Couldn't load follow-ups.</AppText>
              <Pressable onPress={() => refetch()} style={{ cursor: "pointer" } as any}>
                <AppText variant="bodyMedium" color="accent">Retry</AppText>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={followups}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <FollowUpCard item={item} />}
              contentContainerStyle={{ paddingBottom: spacing[10] }}
              onEndReachedThreshold={0.3}
              onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
              ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} /> : null}
              ListEmptyComponent={
                <View style={styles.center}>
                  <AppText color="tertiary">No follow-ups in this range</AppText>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Customers tab */}
      {activeTab === "customers" && staffId != null && (
        <CustomersTab staffId={staffId} />
      )}
    </View>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cursorPointer: { cursor: "pointer" } as any,
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  // ─── tabs ────────────────────────────────────────────────────────────────────
  tabWrap: { flexGrow: 0 },
  tabRow: { flexDirection: "row", paddingHorizontal: spacing[4] },
  tab: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    marginRight: spacing[1],
    borderBottomWidth: 2,
  },
  tabDivider: { height: StyleSheet.hairlineWidth },
  // ─── follow-ups tab ───────────────────────────────────────────────────────────
  section: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2] },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[4],
    flexWrap: "wrap",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryItem: { alignItems: "center", gap: 2 },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  // ─── follow-up card ───────────────────────────────────────────────────────────
  row: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    gap: spacing[3],
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  outcomeBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  eventList: { gap: 0 },
  eventRow: { flexDirection: "row" },
  eventDotCol: { width: 18, alignItems: "center", paddingTop: 3 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventLine: { width: 1.5, flex: 1, marginTop: 3, borderRadius: 1 },
  eventText: { flex: 1, paddingLeft: spacing[2] },
  eventTextSpaced: { paddingBottom: spacing[3] },
  eventTextInner: { flexDirection: "row", alignItems: "flex-start", gap: spacing[2] },
  remark: { fontStyle: "italic" },
  // ─── customers tab ────────────────────────────────────────────────────────────
  searchWrap: { paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth },
  filterWrap: { borderBottomWidth: StyleSheet.hairlineWidth, flexGrow: 0 },
  filterChipRow: { flexDirection: "row", paddingHorizontal: spacing[4], paddingVertical: spacing[2], gap: spacing[2] },
  filterChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2, borderRadius: 20, borderWidth: 1 },
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
})
