import { useMemo, useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import {
  Phone,
  MessageSquare,
  Mail,
  UserCheck,
  MessageCircle,
  CheckCircle2,
  SlidersHorizontal,
  Calendar,
  Clock,
  Wallet,
  ClipboardList,
} from "lucide-react-native"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import DatePickerField from "../../components/shared/DatePickerField"
import BackButton from "../../components/shared/BackButton"
import { Linking } from "react-native"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"
import { useStaffFollowups } from "../../hooks/useStaffFollowups"
import { followupService } from "../../services/followupService"
import { formatDate } from "../../utils/helpers"
import moment from "moment"
import type { FollowUp, ContactMethod, FollowUpOutcome, FollowupsSummary } from "../../types"
import type { FollowupPeriod, FollowupDateField } from "../../services/followupService"
import { useTablet } from "../../hooks/useTablet"

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
  { value: "noResponse",      label: "No Response" },
  { value: "dispute",         label: "Dispute" },
]

// ─── summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ summary }: { summary: FollowupsSummary }) {
  const { byOutcome, byResolution } = summary
  const items = [
    { label: "Total",    value: summary.totalFollowUps,                              color: palette.neutral[500] },
    { label: "Open",     value: byResolution.open,                                   color: palette.info.default },
    { label: "Paid",     value: byResolution.resolved,                               color: palette.success.default },
    { label: "Promised", value: byOutcome.promisedToPay + byOutcome.promisedPartial, color: palette.warning.default },
    { label: "Dispute",  value: byOutcome.dispute,                                   color: palette.error.default },
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
          <AppText variant="heading3" style={{ color: palette.warning.default }}>
            ₹{summary.totalPromisedAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </AppText>
          <AppText variant="caption" color="tertiary">Promised</AppText>
        </View>
      )}
      {summary.totalPaidAmount > 0 && (
        <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: palette.neutral[200], paddingLeft: spacing[3] }]}>
          <AppText variant="heading3" style={{ color: palette.success.default }}>
            ₹{summary.totalPaidAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </AppText>
          <AppText variant="caption" color="tertiary">Collected</AppText>
        </View>
      )}
    </View>
  )
}

// ─── event row (inner timeline) ───────────────────────────────────────────────

function EventRow({
  icon, text, color, isLast,
}: {
  icon: React.ReactNode; text: string; color: string; isLast: boolean
}) {
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

// ─── follow-up card ───────────────────────────────────────────────────────────

function FollowUpCard({ item, userId }: { item: FollowUp; userId: number }) {
  const { colors } = useTheme()
  const router = useRouter()
  const color = outcomeColor(item.outcome)
  const resolved = item.resolvedByPayment
  const mobile = item.mobile ?? ""

  function goToCustomer() {
    if (!item.ledgerId) return
    router.push({
      pathname: "/customer/[name]",
      params: { name: item.customerName, customerId: String(item.ledgerId), totalBalance: "", drCr: "", mobile },
    })
  }

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
    const color = isReceipt ? palette.success.dark : palette.warning.dark
    events.push({
      icon: <MessageCircle size={11} color={color} strokeWidth={1.75} />,
      text: `WhatsApp ${isReceipt ? "receipt" : "reminder"} sent ${formatDate(send.sentAt)}`,
      color,
    })
  }

  return (
    <TouchableOpacity onPress={goToCustomer} activeOpacity={0.75}>
      <AppCard elevation="sm" style={styles.card}>
        {/* Header: contact icon + customer name + outcome badge + time ago */}
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <ContactIcon method={item.contactMethod} color={colors.text.tertiary as string} />
          <AppText variant="bodyMedium" style={{ flex: 1 }}>{toTitleCase(item.customerName)}</AppText>
          <View style={[styles.outcomeBadge, { backgroundColor: color + "22" }]}>
            <AppText variant="caption" style={{ color, fontSize: 11 }}>{OUTCOME_LABELS[item.outcome]}</AppText>
          </View>
          <AppText variant="caption" color="tertiary">{moment(item.loggedAt).fromNow()}</AppText>
        </View>

        {/* Inner event timeline */}
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

        {/* WhatsApp action buttons */}
        {(resolved || (!resolved && !!item.promisedAmount)) && !!mobile && (
          <View style={styles.waActions}>
            {resolved && (
              <TouchableOpacity activeOpacity={0.7} onPress={(e) => { e.stopPropagation?.(); sendReceiptWhatsApp() }} style={styles.waBtn}>
                <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
                <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Send Receipt</AppText>
              </TouchableOpacity>
            )}
            {!resolved && !!item.promisedAmount && (
              <TouchableOpacity activeOpacity={0.7} onPress={(e) => { e.stopPropagation?.(); sendReminderWhatsApp() }} style={styles.waBtnReminder}>
                <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
                <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Send Reminder</AppText>
              </TouchableOpacity>
            )}
          </View>
        )}

      </AppCard>
    </TouchableOpacity>
  )
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function FollowUpsScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
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
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <BackButton />
          <View style={{ flex: 1 }}>
            <AppText variant="heading2">Follow-ups</AppText>
            {!isLoading && data?.summary != null && (
              <AppText variant="caption" color="secondary">{data.summary.totalFollowUps} total</AppText>
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
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
            style={styles.tabWrap}
          >
            {TABS.map(({ value, label }) => {
              const isActive = activeTab === value
              return (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab(value)}
                  style={[styles.tab, { borderBottomColor: isActive ? colors.accent : "transparent" }]}
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
          <View style={[styles.tabDivider, { backgroundColor: colors.border }]} />
        </View>

        {data?.summary && <SummaryStrip summary={data.summary} />}

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : (
          <FlatList
            data={followups}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <FollowUpCard item={item} userId={user?.user_id ?? 0} />}
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
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mobileContent: { flex: 1 },
  desktopContent: {
    flex: 1,
    maxWidth: 860,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  chipRow: { flexDirection: "row", paddingHorizontal: spacing[4], gap: spacing[2] },
  periodChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: 20,
    borderWidth: 1,
  },
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
  card: { gap: spacing[3] },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
    paddingBottom: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  waActions: { flexDirection: "row", gap: spacing[2] },
  dateRangeRow: { flexDirection: "row", gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  waBtn: { flexDirection: "row", alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[2], paddingVertical: spacing[1] + 1, borderRadius: 6, backgroundColor: palette.success.default },
  waBtnReminder: { flexDirection: "row", alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[2], paddingVertical: spacing[1] + 1, borderRadius: 6, backgroundColor: palette.warning.default },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: 20, borderWidth: 1 },
  filterPanel: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing[3] },
  filterLabel: { paddingHorizontal: spacing[4], marginBottom: spacing[1], marginTop: spacing[2], letterSpacing: 0.8 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
})
