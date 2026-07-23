import { useMemo, useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import {
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
import WhatsAppActions from "../../components/shared/WhatsAppActions"
import RefreshButton from "../../components/shared/RefreshButton"
import ContactMethodIcon from "../../components/shared/ContactMethodIcon"
import OutcomeBadge, { outcomeColor } from "../../components/shared/OutcomeBadge"
import FollowUpListCard from "../../components/shared/FollowUpListCard"
import FollowupSummaryStrip from "../../components/shared/FollowupSummaryStrip"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"
import { useStaffFollowups } from "../../hooks/useStaffFollowups"
import { followupService } from "../../services/followupService"
import { formatDate, formatAmount, toTitleCase } from "../../utils/helpers"
import moment from "moment"
import type { FollowUp, ContactMethod, FollowUpOutcome } from "../../types"
import type { FollowupPeriod, FollowupDateField } from "../../services/followupService"
import { useTablet } from "../../hooks/useTablet"

// ─── helpers ─────────────────────────────────────────────────────────────────



const CONTACT_LABELS: Record<ContactMethod, string> = {
  phoneCall: "Phone",
  sms: "SMS",
  email: "Email",
  inPerson: "In Person",
  whatsapp: "WhatsApp",
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
  { value: "reminderSent",    label: "Reminder Sent" },
]

// ─── summary strip ────────────────────────────────────────────────────────────

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

  const { data, isLoading, refetch, isRefetching } = useStaffFollowups(user?.user_id, {
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
            <AppText variant="caption" color="tertiary">Only my follow-ups</AppText>
          </View>
          <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
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

        {data?.summary && <FollowupSummaryStrip summary={data.summary} />}

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : (
          <FlatList
            data={followups}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <AnimatedListItem index={index}>
                <FollowUpListCard item={item} index={index} />
              </AnimatedListItem>
            )}
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
