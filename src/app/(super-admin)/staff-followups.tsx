import { useState } from "react"
import { View, FlatList, StyleSheet, Pressable } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { Phone, MessageSquare, Mail, UserCheck, MessageCircle, CheckCircle2 } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
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
  phoneCall: "Phone",
  sms: "SMS",
  email: "Email",
  inPerson: "In Person",
  whatsapp: "WhatsApp",
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

function FollowUpCard({ item }: { item: FollowUp }) {
  const color = outcomeColor(item.outcome)
  const resolved = item.resolvedByPayment

  return (
    <AppCard elevation="sm" style={[styles.card, resolved && styles.resolvedCard]}>
      <View style={styles.nameRow}>
        <AppText variant="bodyMedium" style={{ flex: 1 }}>
          {toTitleCase(item.customerName)}
        </AppText>
        {resolved && (
          <View style={styles.resolvedPill}>
            <CheckCircle2 size={10} color={palette.success.default} strokeWidth={1.75} />
            <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>Paid</AppText>
          </View>
        )}
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailLeft}>
          <View style={styles.methodRow}>
            <ContactIcon method={item.contactMethod} color={palette.neutral[400]} />
            <AppText variant="caption" color="secondary">{CONTACT_LABELS[item.contactMethod]}</AppText>
          </View>
          <View style={[styles.outcomePill, { backgroundColor: color + "22" }]}>
            <AppText variant="caption" style={{ color, fontSize: 10 }}>{OUTCOME_LABELS[item.outcome]}</AppText>
          </View>
          {item.promisedDate && (
            <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>
              Promised: {formatDate(item.promisedDate)}
            </AppText>
          )}
          {resolved && item.resolvedAt && (
            <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>
              Paid on {formatDate(item.resolvedAt)}
            </AppText>
          )}
          {resolved && item.amountRecovered != null && item.amountRecovered > 0 && (
            <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>
              Recovered: ₹{formatAmount(item.amountRecovered)}
            </AppText>
          )}
        </View>

        <View style={styles.detailRight}>
          {item.promisedAmount != null && (
            <AppText
              variant="mono"
              style={{
                fontSize: 13,
                color: resolved ? palette.neutral[400] : palette.warning.default,
                textDecorationLine: resolved ? "line-through" : "none",
              }}
            >
              ₹{formatAmount(item.promisedAmount)}
            </AppText>
          )}
          <AppText variant="caption" color="tertiary" style={{ fontSize: 10 }}>
            {moment(item.loggedAt).fromNow()}
          </AppText>
        </View>
      </View>
    </AppCard>
  )
}

export default function StaffFollowupsScreen() {
  const { colors } = useTheme()
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

  const { data, isLoading, isError, refetch } = useAllFollowups({
    staffId,
    limit: 100,
    period: isCustom ? undefined : period,
    startDate: isCustom && startDate ? toAPIDate(startDate) : undefined,
    endDate: isCustom && endDate ? toAPIDate(endDate) : undefined,
    dateField,
    outcome: outcome === "all" ? undefined : outcome,
  })

  const followups = data?.data ?? []
  const summary = data?.summary

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">{params.staffName ?? "Staff Follow-ups"}</AppText>
          {!isLoading && (
            <AppText variant="caption" color="secondary">{data?.pagination.total ?? 0} follow-ups</AppText>
          )}
        </View>
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
          <Pressable onPress={() => refetch()} style={styles.cursorPointer}>
            <AppText variant="bodyMedium" color="accent">Retry</AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={followups}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FollowUpCard item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cursorPointer: {
    cursor: "pointer",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
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
  card: { padding: spacing[4] },
  resolvedCard: { borderLeftWidth: 3, borderLeftColor: palette.success.default },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing[2] },
  detailRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  detailLeft: { flex: 1, gap: spacing[1] },
  detailRight: { alignItems: "flex-end", gap: spacing[1] },
  methodRow: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  outcomePill: { alignSelf: "flex-start", paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  resolvedPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4, backgroundColor: palette.success.default + "22" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[16] },
})
