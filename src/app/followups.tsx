import { useMemo, useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import {
  ChevronLeft,
  Phone,
  MessageSquare,
  Mail,
  UserCheck,
  MessageCircle,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react-native"
import AppText from "../components/ui/AppText"
import AppCard from "../components/ui/AppCard"
import DatePickerField from "../components/shared/DatePickerField"
import { Linking } from "react-native"
import { useTheme } from "../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../constants/theme"
import useAuthStore from "../stores/useAuthStore"
import { useStaffFollowups } from "../hooks/useStaffFollowups"
import { followupService } from "../services/followupService"
import { formatDate } from "../utils/helpers"
import moment from "moment"
import type { FollowUp, ContactMethod, FollowUpOutcome, FollowupsSummary } from "../types"
import type { FollowupPeriod, FollowupDateField } from "../services/followupService"

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatAmount(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const CONTACT_LABELS: Record<ContactMethod, string> = {
  phoneCall: "Phone",
  sms: "SMS",
  email: "Email",
  inPerson: "In Person",
  whatsapp: "WhatsApp",
}

const OUTCOME_LABELS: Record<FollowUpOutcome, string> = {
  promisedToPay: "Promised Full Payment",
  promisedPartial: "Promised Partial",
  dispute: "Dispute",
  noContact: "No Contact",
  paid: "Paid",
}

function outcomeColor(o: FollowUpOutcome): string {
  switch (o) {
    case "paid":
    case "promisedToPay":  return palette.success.default
    case "promisedPartial": return palette.warning.default
    case "dispute":         return palette.error.default
    case "noContact":       return palette.neutral[500]
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

// ─── filter tabs ─────────────────────────────────────────────────────────────

type FilterTab = "all" | "open" | "resolved"
const TABS: { value: FilterTab; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "open",     label: "Open" },
  { value: "resolved", label: "Paid" },
]

type PeriodChip = "all" | FollowupPeriod | "custom"
const PERIOD_CHIPS: { value: PeriodChip; label: string }[] = [
  { value: "all",        label: "All time" },
  { value: "today",      label: "Today" },
  { value: "yesterday",  label: "Yesterday" },
  { value: "this_month", label: "This month" },
  { value: "custom",     label: "Custom" },
]

const DATE_FIELD_CHIPS: { value: FollowupDateField; label: string }[] = [
  { value: "loggedAt",     label: "Logged date" },
  { value: "promisedDate", label: "Promised date" },
  { value: "resolvedAt",   label: "Paid date" },
]

const OUTCOME_CHIPS: { value: FollowUpOutcome | "all"; label: string }[] = [
  { value: "all",             label: "All outcomes" },
  { value: "promisedToPay",   label: "Promised Full" },
  { value: "promisedPartial", label: "Promised Partial" },
  { value: "paid",            label: "Paid" },
  { value: "noContact",       label: "No Contact" },
  { value: "dispute",         label: "Dispute" },
]

// ─── summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ summary }: { summary: FollowupsSummary }) {
  const { byOutcome, byResolution } = summary
  const items = [
    { label: "Total",    value: summary.totalFollowUps,                          color: palette.neutral[500] },
    { label: "Open",     value: byResolution.open,                               color: palette.info.default },
    { label: "Paid",     value: byResolution.resolved,                           color: palette.success.default },
    { label: "Promised", value: byOutcome.promisedToPay + byOutcome.promisedPartial, color: palette.warning.default },
    { label: "Dispute",  value: byOutcome.dispute,                               color: palette.error.default },
  ]
  return (
    <View style={styles.summaryStrip}>
      {items.map(({ label, value, color }) => (
        <View key={label} style={styles.summaryItem}>
          <AppText variant="heading3" style={{ color }}>{value}</AppText>
          <AppText variant="caption" color="tertiary">{label}</AppText>
        </View>
      ))}
      {summary.totalPromisedAmount > 0 && (
        <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: palette.neutral[200], paddingLeft: spacing[3] }]}>
          <AppText variant="mono" style={{ color: palette.warning.default, fontSize: 13 }}>
            ₹{summary.totalPromisedAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </AppText>
          <AppText variant="caption" color="tertiary">Promised</AppText>
        </View>
      )}
      {summary.totalPaidAmount > 0 && (
        <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: palette.neutral[200], paddingLeft: spacing[3] }]}>
          <AppText variant="mono" style={{ color: palette.success.default, fontSize: 13 }}>
            ₹{summary.totalPaidAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </AppText>
          <AppText variant="caption" color="tertiary">Collected</AppText>
        </View>
      )}
    </View>
  )
}

// ─── follow-up card ───────────────────────────────────────────────────────────

function FollowUpCard({ item, userId }: { item: FollowUp; userId: number }) {
  const color = outcomeColor(item.outcome)
  const resolved = item.resolvedByPayment
  const mobile = item.mobile ?? ""

  function sendReceiptWhatsApp() {
    const amount = item.amountRecovered ?? item.promisedAmount ?? 0
    const msg = `Dear ${toTitleCase(item.customerName)},\n\nWe acknowledge receipt of ₹${formatAmount(amount)} payment.\n\nThank you!\nRoyal Glass Vengara`
    Linking.openURL(`whatsapp://send?phone=${mobile}&text=${encodeURIComponent(msg)}`)
    followupService.logWhatsApp(item._id, { staffId: userId, type: "receipt", mobile, amountMentioned: amount }).catch(() => {})
  }

  function sendReminderWhatsApp() {
    const amount = item.promisedAmount ?? 0
    const dateLine = item.promisedDate ? ` by ${formatDate(item.promisedDate)}` : ""
    const msg = `Dear ${toTitleCase(item.customerName)},\n\nThis is a friendly reminder that you have promised to pay ₹${formatAmount(amount)}${dateLine}.\n\nKindly ensure the payment is made on time.\n\nThank you!\nRoyal Glass Vengara`
    Linking.openURL(`whatsapp://send?phone=${mobile}&text=${encodeURIComponent(msg)}`)
    followupService.logWhatsApp(item._id, { staffId: userId, type: "reminder", mobile, amountMentioned: amount }).catch(() => {})
  }

  return (
    <View>
      <AppCard elevation="sm" style={[styles.card, resolved && styles.resolvedCard]}>
        {/* Customer name row */}
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
            {/* Contact method */}
            <View style={styles.methodRow}>
              <ContactIcon method={item.contactMethod} color={palette.neutral[400]} />
              <AppText variant="caption" color="secondary">{CONTACT_LABELS[item.contactMethod]}</AppText>
            </View>
            {/* Outcome */}
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
            {resolved && !!mobile && (
              <>
                <TouchableOpacity activeOpacity={0.7} onPress={(e) => { e.stopPropagation?.(); sendReceiptWhatsApp() }} style={styles.waBtn}>
                  <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
                  <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Receipt</AppText>
                </TouchableOpacity>
                {item.whatsapp?.lastReceiptSentAt && (
                  <AppText variant="caption" color="tertiary" style={{ fontSize: 9 }}>
                    Sent {formatDate(item.whatsapp.lastReceiptSentAt)}
                  </AppText>
                )}
              </>
            )}
            {!resolved && !!mobile && !!item.promisedAmount && (
              <>
                <TouchableOpacity activeOpacity={0.7} onPress={(e) => { e.stopPropagation?.(); sendReminderWhatsApp() }} style={styles.waBtnReminder}>
                  <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
                  <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Reminder</AppText>
                </TouchableOpacity>
                {item.whatsapp?.lastReminderSentAt && (
                  <AppText variant="caption" color="tertiary" style={{ fontSize: 9 }}>
                    Sent {formatDate(item.whatsapp.lastReminderSentAt)}
                  </AppText>
                )}
              </>
            )}
          </View>
        </View>
      </AppCard>
    </View>
  )
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function FollowUpsScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const [activePeriod, setActivePeriod] = useState<PeriodChip>("all")
  const [activeDateField, setActiveDateField] = useState<FollowupDateField>("loggedAt")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [activeOutcome, setActiveOutcome] = useState<FollowUpOutcome | "all">("all")
  const [showFilters, setShowFilters] = useState(false)

  const isCustom = activePeriod === "custom"

  const activeFilterCount = [
    activePeriod !== "all" ? 1 : 0,
    activeOutcome !== "all" ? 1 : 0,
    activeDateField !== "loggedAt" ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const { data, isLoading } = useStaffFollowups(user?.user_id, {
    period: activePeriod === "all" || isCustom ? undefined : activePeriod,
    startDate: isCustom && startDate ? startDate.toISOString().split("T")[0] : undefined,
    endDate: isCustom && endDate ? endDate.toISOString().split("T")[0] : undefined,
    dateField: activeDateField,
    outcome: activeOutcome === "all" ? undefined : activeOutcome,
  })

  const followups = useMemo(() => {
    const all = (data?.data ?? []).sort(
      (a, b) => moment(b.loggedAt).valueOf() - moment(a.loggedAt).valueOf()
    )
    if (activeTab === "open")     return all.filter((f) => !f.resolvedByPayment)
    if (activeTab === "resolved") return all.filter((f) => f.resolvedByPayment)
    return all
  }, [data, activeTab])

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.75} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <AppText variant="heading2">Follow-ups</AppText>
          {!isLoading && (
            <AppText variant="caption" color="secondary">{data?.count ?? 0} total</AppText>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowFilters((v) => !v)}
          style={[styles.filterBtn, { backgroundColor: showFilters ? colors.accent : colors.background.secondary, borderColor: activeFilterCount > 0 ? colors.accent : colors.border }]}
        >
          <SlidersHorizontal size={16} color={showFilters ? "#fff" : activeFilterCount > 0 ? colors.accent : colors.text.secondary} strokeWidth={1.75} />
          <AppText variant="caption" style={{ color: showFilters ? "#fff" : activeFilterCount > 0 ? colors.accent : colors.text.secondary }}>
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Collapsible filter panel */}
      {showFilters && (
        <View style={[styles.filterPanel, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
          {/* Period */}
          <AppText variant="caption" color="tertiary" style={styles.filterLabel}>PERIOD</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {PERIOD_CHIPS.map(({ value, label }) => {
              const isActive = activePeriod === value
              return (
                <TouchableOpacity key={value} activeOpacity={0.7} onPress={() => setActivePeriod(value)}
                  style={[styles.periodChip, { backgroundColor: isActive ? colors.accent : colors.background.primary, borderColor: isActive ? colors.accent : colors.border }]}>
                  <AppText variant="caption" style={{ color: isActive ? "#fff" : colors.text.secondary }}>{label}</AppText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Custom date range */}
          {isCustom && (
            <View style={styles.dateRangeRow}>
              <View style={{ flex: 1 }}><DatePickerField label="From" value={startDate} onChange={setStartDate} placeholder="Start date" /></View>
              <View style={{ flex: 1 }}><DatePickerField label="To" value={endDate} onChange={setEndDate} placeholder="End date" /></View>
            </View>
          )}

          {/* Date field — only when period selected */}
          {activePeriod !== "all" && (
            <>
              <AppText variant="caption" color="tertiary" style={styles.filterLabel}>FILTER BY</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {DATE_FIELD_CHIPS.map(({ value, label }) => {
                  const isActive = activeDateField === value
                  return (
                    <TouchableOpacity key={value} activeOpacity={0.7} onPress={() => setActiveDateField(value)}
                      style={[styles.periodChip, { backgroundColor: isActive ? colors.accent + "22" : colors.background.primary, borderColor: isActive ? colors.accent : colors.border }]}>
                      <AppText variant="caption" style={{ color: isActive ? colors.accent : colors.text.secondary }}>{label}</AppText>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </>
          )}

          {/* Outcome */}
          <AppText variant="caption" color="tertiary" style={styles.filterLabel}>OUTCOME</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {OUTCOME_CHIPS.map(({ value, label }) => {
              const isActive = activeOutcome === value
              return (
                <TouchableOpacity key={value} activeOpacity={0.7} onPress={() => setActiveOutcome(value)}
                  style={[styles.periodChip, { backgroundColor: isActive ? colors.accent + "22" : colors.background.primary, borderColor: isActive ? colors.accent : colors.border }]}>
                  <AppText variant="caption" style={{ color: isActive ? colors.accent : colors.text.secondary }}>{label}</AppText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
        style={[styles.tabWrap, { borderBottomColor: colors.border }]}
      >
        {TABS.map(({ value, label }) => {
          const isActive = activeTab === value
          return (
            <TouchableOpacity
              key={value}
              activeOpacity={0.7}
              onPress={() => setActiveTab(value)}
              style={[
                styles.tab,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? colors.accent : "transparent",
                },
              ]}
            >
              <AppText
                variant="bodyMedium"
                style={{ color: isActive ? colors.accent : colors.text.secondary }}
              >
                {label}
              </AppText>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {data?.summary && <SummaryStrip summary={data.summary} />}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : (
        <FlatList
          data={followups}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) =>
            <FollowUpCard item={item} userId={user?.user_id ?? 0} />
          }
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color="tertiary">No follow-ups yet</AppText>
            </View>
          }
        />
      )}
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  backBtn: { padding: spacing[2] },
  chipWrap: { flexGrow: 0, paddingVertical: spacing[3] },
  chipRow: { flexDirection: "row", paddingHorizontal: spacing[4], gap: spacing[2] },
  periodChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabWrap: { borderBottomWidth: StyleSheet.hairlineWidth, flexGrow: 0 },
  tabRow: { flexDirection: "row", paddingHorizontal: spacing[4] },
  tab: { paddingHorizontal: spacing[3], paddingVertical: spacing[3], marginRight: spacing[2] },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[4],
    flexWrap: "wrap",
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
  dateRangeRow: { flexDirection: "row", gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 6, backgroundColor: palette.success.default },
  waBtnReminder: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: 6, backgroundColor: palette.warning.default },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 20, borderWidth: 1 },
  filterPanel: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing[3] },
  filterLabel: { paddingHorizontal: spacing[4], marginBottom: spacing[1], marginTop: spacing[2], letterSpacing: 0.8 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
})
