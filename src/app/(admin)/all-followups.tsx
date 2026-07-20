import { useState } from "react"
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import {
  Phone, MessageSquare, Mail, UserCheck, MessageCircle,
  CheckCircle2, Calendar, Clock, Wallet, ClipboardList, ChevronRight, RefreshCw,
} from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import DashboardFilterBar, { type DashboardPeriodValue } from "../../components/shared/DashboardFilterBar"
import type { ResolutionStatus } from "../../services/dashboardService"
import FollowUpListSkeleton from "../../components/shared/FollowUpListSkeleton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { useAllFollowups } from "../../hooks/useAllFollowups"
import { toAPIDate, formatDate } from "../../utils/helpers"
import moment from "moment"
import type { FollowupDateField } from "../../services/followupService"
import type { FollowUp, ContactMethod, FollowUpOutcome } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatAmount(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
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

// ─── timeline ────────────────────────────────────────────────────────────────

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

  function goToCustomer() {
    if (!item.ledgerId) return
    router.push({
      pathname: "/customer/[name]",
      params: { name: item.customerName, customerId: String(item.ledgerId), totalBalance: "", drCr: "", mobile: item.mobile ?? "" },
    })
  }

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

  return (
    <TouchableOpacity onPress={goToCustomer} activeOpacity={0.75} disabled={!item.ledgerId}>
      <View style={[styles.row, { borderBottomColor: colors.border as string }]}>
        <View style={styles.rowHeader}>
          <ContactIcon method={item.contactMethod} color={colors.text.tertiary as string} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium" numberOfLines={1}>{toTitleCase(item.customerName)}</AppText>
            <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
              by {toTitleCase(item.staffName)}
            </AppText>
          </View>
          <View style={[styles.outcomeBadge, { backgroundColor: color + "22", flexShrink: 1 }]}>
            <AppText variant="caption" numberOfLines={1} style={{ color, fontSize: 11 }}>{OUTCOME_LABELS[item.outcome]}</AppText>
          </View>
          <AppText variant="caption" color="tertiary" numberOfLines={1}>{moment(item.loggedAt).fromNow()}</AppText>
          {!!item.ledgerId && <ChevronRight size={14} color={colors.text.tertiary} strokeWidth={1.75} />}
        </View>

        <View style={styles.eventList}>
          {events.map((ev, i) => (
            <EventRow key={i} icon={ev.icon} text={ev.text} color={ev.color} isLast={i === events.length - 1} />
          ))}
        </View>

        {item.freeTextRemark ? (
          <AppText variant="caption" color="secondary" numberOfLines={2} style={styles.remark}>
            "{item.freeTextRemark}"
          </AppText>
        ) : null}
      </View>
    </TouchableOpacity>
  )
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

  const isCustom = period === "custom"

  const { data, isLoading, isError, refetch, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage } = useAllFollowups({
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
        <Pressable onPress={() => refetch()} hitSlop={8} style={{ padding: spacing[2], cursor: "pointer" } as any}>
          {isRefetching ? <ActivityIndicator size="small" color={colors.accent} /> : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
        </Pressable>
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
          <Pressable onPress={() => refetch()}>
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
