import { useState, useEffect, useRef } from "react"
import { useDebounce } from "../../hooks/useDebounce"
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, LayoutAnimation, Platform, UIManager,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import {
  MessageCircle,
  CheckCircle2, Calendar, Clock, Wallet, X, ClipboardList, ChevronRight,
} from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import ErrorRetry from "../../components/shared/ErrorRetry"
import ContactMethodIcon from "../../components/shared/ContactMethodIcon"
import OutcomeBadge, { outcomeColor } from "../../components/shared/OutcomeBadge"
import FollowUpListCard from "../../components/shared/FollowUpListCard"
import FollowupSummaryStrip from "../../components/shared/FollowupSummaryStrip"
import CustomerOutstandingRow from "../../components/shared/CustomerOutstandingRow"
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
import { toAPIDate, formatDate, toTitleCase } from "../../utils/helpers"
import moment from "moment"
import type { FollowupDateField } from "../../services/followupService"
import type { FollowUp, ContactMethod, FollowUpOutcome, LedgerOutstandingFilter } from "../../types"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ─── helpers ─────────────────────────────────────────────────────────────────



function isDashboardPeriod(value: unknown): value is DashboardPeriodValue {
  return value === "today" || value === "yesterday" || value === "this_month" || value === "custom"
}

function isDateField(value: unknown): value is FollowupDateField {
  return value === "loggedAt" || value === "promisedDate" || value === "resolvedAt"
}

function isOutcome(value: unknown): value is FollowUpOutcome {
  return value === "promisedToPay" || value === "promisedPartial" || value === "dispute" || value === "noResponse" || value === "reminderSent"
}

function parseParamDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

const CONTACT_LABELS: Record<ContactMethod, string> = {
  phoneCall: "Phone", sms: "SMS", email: "Email", inPerson: "In Person", whatsapp: "WhatsApp",
}



// ─── follow-up timeline card ──────────────────────────────────────────────────

// ─── customers tab ────────────────────────────────────────────────────────────

const CUSTOMER_FILTERS: { value: LedgerOutstandingFilter; label: string }[] = [
  { value: "all",              label: "All" },
  { value: "overdue",         label: "Overdue" },
  { value: "open_followup",   label: "Open follow-up" },
  { value: "followed_up",     label: "Followed up" },
  { value: "not_followed_up", label: "Not contacted" },
  { value: "paid",            label: "Paid" },
]


function CustomersTab({ staffId }: { staffId: number }) {
  const { colors } = useTheme()
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 400)
  const [activeFilter, setActiveFilter] = useState<LedgerOutstandingFilter>("all")

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useStaffCustomers(staffId, { limit: 20, search: debouncedSearch || undefined, filter: activeFilter })

  const customerList = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <FlatList
      data={customerList}
      keyExtractor={(item) => String(item.ledger_id)}
      renderItem={({ item }) => <CustomerOutstandingRow item={item} />}
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
    resolutionStatus: resolutionStatus === "all" ? undefined : resolutionStatus,
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
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
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
            <FollowupSummaryStrip summary={summary} bordered />
          )}

          {isLoading ? (
            <FollowUpListSkeleton />
          ) : isError ? (
            <ErrorRetry message="Couldn't load follow-ups." onRetry={refetch} />
          ) : (
            <FlatList
              data={followups}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <FollowUpListCard item={item} showStaffName />}
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
