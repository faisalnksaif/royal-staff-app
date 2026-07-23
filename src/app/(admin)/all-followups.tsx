import { useState } from "react"
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import {
  MessageCircle,
  CheckCircle2, Calendar, Clock, Wallet, ClipboardList, ChevronRight,
} from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import ErrorRetry from "../../components/shared/ErrorRetry"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import ContactMethodIcon from "../../components/shared/ContactMethodIcon"
import OutcomeBadge, { outcomeColor } from "../../components/shared/OutcomeBadge"
import FollowUpListCard from "../../components/shared/FollowUpListCard"
import FollowupSummaryStrip from "../../components/shared/FollowupSummaryStrip"
import AppText from "../../components/ui/AppText"
import DashboardFilterBar, { type DashboardPeriodValue } from "../../components/shared/DashboardFilterBar"
import type { ResolutionStatus } from "../../services/dashboardService"
import FollowUpListSkeleton from "../../components/shared/FollowUpListSkeleton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { useAllFollowups } from "../../hooks/useAllFollowups"
import { toAPIDate, formatDate, toTitleCase } from "../../utils/helpers"
import moment from "moment"
import type { FollowupDateField, FollowupSortBy, FollowupOrder } from "../../services/followupService"
import type { FollowUp, ContactMethod, FollowUpOutcome } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────



const CONTACT_LABELS: Record<ContactMethod, string> = {
  phoneCall: "Phone", sms: "SMS", email: "Email", inPerson: "In Person", whatsapp: "WhatsApp",
}




// ─── screen ───────────────────────────────────────────────────────────────────

export default function AllFollowupsScreen() {
  const { colors } = useTheme()

  const [period, setPeriod] = useState<DashboardPeriodValue>("this_month")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [dateField, setDateField] = useState<FollowupDateField>("loggedAt")
  const [outcome, setOutcome] = useState<FollowUpOutcome | "all">("all")
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus | "all">("all")
  const [sortBy, setSortBy] = useState<FollowupSortBy>("loggedAt")
  const [order, setOrder] = useState<FollowupOrder>("desc")

  const isCustom = period === "custom"

  const { data, isLoading, isError, refetch, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage } = useAllFollowups({
    limit: 50,
    period: isCustom ? undefined : period,
    startDate: isCustom && startDate ? toAPIDate(startDate) : undefined,
    endDate: isCustom && endDate ? toAPIDate(endDate) : undefined,
    dateField,
    outcome: outcome === "all" ? undefined : outcome,
    resolutionStatus: resolutionStatus === "all" ? undefined : resolutionStatus,
    sortBy,
    order,
  })

  const followups = data?.pages.flatMap((p) => p.data) ?? []
  const summary = data?.pages[0]?.summary
  const total = data?.pages[0]?.pagination.total ?? 0

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">All Follow-ups</AppText>
          {!isLoading && (
            <AppText variant="caption" color="secondary">{total} total</AppText>
          )}
        </View>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

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

      {/* Sort controls */}
      <View style={[styles.sortRow, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
          {([
            { key: "loggedAt",        label: "Date" },
            { key: "promisedAmount",  label: "Promised ₹" },
            { key: "amountRecovered", label: "Recovered ₹" },
            { key: "outstandingAmount", label: "Outstanding ₹" },
          ] as { key: FollowupSortBy; label: string }[]).map(({ key, label }) => {
            const active = sortBy === key
            return (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  if (active) setOrder(o => o === "desc" ? "asc" : "desc")
                  else { setSortBy(key); setOrder("desc") }
                }}
                style={[styles.sortChip, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? (colors.accent as string) + "18" : "transparent" }]}
              >
                <AppText variant="caption" style={{ color: active ? colors.accent : colors.text.secondary }}>
                  {label}{active ? (order === "desc" ? " ↓" : " ↑") : ""}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
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
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <FollowUpListCard item={item} index={index} showStaffName />
            </AnimatedListItem>
          )}
          contentContainerStyle={{ paddingBottom: spacing[10] }}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
              : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color="tertiary">No follow-ups in this range</AppText>
            </View>
          }
        />
      )}
    </View>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────────

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
  section: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2] },
  sortRow: { borderBottomWidth: StyleSheet.hairlineWidth },
  sortChips: { flexDirection: "row", gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
  sortChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: 99, borderWidth: 1 },
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[16] },
})
