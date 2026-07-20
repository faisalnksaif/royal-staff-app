import { useMemo, useState, useRef, useEffect } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useTablet } from "../../../hooks/useTablet"
import {
  ChevronLeft,
  Phone,
  MessageSquare,
  Mail,
  UserCheck,
  MessageCircle,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Wallet,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  BellRing,
} from "lucide-react-native"
import { Linking } from "react-native"
import AppText from "../../../components/ui/AppText"
import AppCard from "../../../components/ui/AppCard"
import { useTheme } from "../../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../../constants/theme"
import useAuthStore from "../../../stores/useAuthStore"
import { useCustomerFollowups } from "../../../hooks/useCustomerFollowups"
import { useCustomerLedger } from "../../../hooks/useCustomerLedger"
import { followupService } from "../../../services/followupService"
import { formatDate } from "../../../utils/helpers"
import moment from "moment"
import type { FollowUp, ContactMethod, FollowUpOutcome, LedgerEntry } from "../../../types"
import { RETENTION_COLOR, RETENTION_STATUS_LABEL } from "../../../constants/retention"
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line as SvgLine, Text as SvgText, Rect } from "react-native-svg"

// ─── helpers ────────────────────────────────────────────────────────────────

function formatAmount(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── follow-up helpers ───────────────────────────────────────────────────────

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
  const p = { size: 13, color, strokeWidth: 1.75 }
  switch (method) {
    case "phoneCall":  return <Phone {...p} />
    case "sms":        return <MessageSquare {...p} />
    case "email":      return <Mail {...p} />
    case "inPerson":   return <UserCheck {...p} />
    case "whatsapp":   return <MessageCircle {...p} />
  }
}

// ─── event row (timeline inside card) ────────────────────────────────────────

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

// ─── follow-up card ──────────────────────────────────────────────────────────

function FollowUpCard({
  followup, mobile, customerName, totalBalance, drCr,
}: {
  followup: FollowUp; mobile: string; customerName: string; totalBalance: string; drCr: string
}) {
  const { colors } = useTheme()
  const color = outcomeColor(followup.outcome)
  const resolved = followup.resolvedByPayment
  const user = useAuthStore((s) => s.user)

  function sendReceiptWhatsApp() {
    const amount = followup.amountRecovered ?? followup.promisedAmount ?? 0
    const balance = Number(totalBalance)
    const balanceLine = balance === 0
      ? `Your account balance is now fully cleared.`
      : `Your closing balance is ₹${formatAmount(balance)} ${drCr === "Cr" ? "in credit" : "outstanding"}.`
    const msg = `Dear ${customerName},\n\nWe acknowledge receipt of ₹${formatAmount(amount)} payment.\n\n${balanceLine}\n\nThank you!\nRoyal Glass Vengara`
    Linking.openURL(`whatsapp://send?phone=${mobile}&text=${encodeURIComponent(msg)}`)
    followupService.logWhatsApp(followup._id, { staffId: user?.user_id ?? 0, type: "receipt", mobile, amountMentioned: amount }).catch(() => {})
  }

  function sendReminderWhatsApp() {
    const amount = followup.promisedAmount ?? 0
    const dateLine = followup.promisedDate ? ` by ${formatDate(followup.promisedDate)}` : ""
    const msg = `Dear ${customerName},\n\nThis is a friendly reminder that you have promised to pay ₹${formatAmount(amount)}${dateLine}.\n\nKindly ensure the payment is made on time.\n\nThank you!\nRoyal Glass Vengara`
    Linking.openURL(`whatsapp://send?phone=${mobile}&text=${encodeURIComponent(msg)}`)
    followupService.logWhatsApp(followup._id, { staffId: user?.user_id ?? 0, type: "reminder", mobile, amountMentioned: amount }).catch(() => {})
  }

  // Build ordered event list so we can know which is last
  type Event = { icon: React.ReactNode; text: string; color: string }
  const events: Event[] = [
    {
      icon: <ClipboardList size={11} color={palette.neutral[400]} strokeWidth={1.75} />,
      text: `Logged by ${toTitleCase(followup.staffName)} · ${formatDate(followup.loggedAt)}`,
      color: palette.neutral[500],
    },
  ]
  if (followup.outstandingAmount != null && !followup.outstandingBackfilled) {
    events.push({
      icon: <Wallet size={11} color={palette.neutral[400]} strokeWidth={1.75} />,
      text: `Balance then: ₹${formatAmount(followup.outstandingAmount)} ${followup.outstandingDrCr}`,
      color: palette.neutral[500],
    })
  }
  if (followup.promisedAmount != null) {
    events.push({
      icon: <Calendar size={11} color={palette.warning.default} strokeWidth={1.75} />,
      text: `Promised ₹${formatAmount(followup.promisedAmount)}${followup.promisedDate ? ` by ${formatDate(followup.promisedDate)}` : ""}`,
      color: palette.warning.default,
    })
  }
  if (followup.nextFollowUpDate && !resolved) {
    events.push({
      icon: <Clock size={11} color={palette.info.default} strokeWidth={1.75} />,
      text: `Next follow-up: ${formatDate(followup.nextFollowUpDate)}`,
      color: palette.info.default,
    })
  }
  if (resolved && followup.resolvedAt) {
    events.push({
      icon: <CheckCircle2 size={11} color={palette.success.default} strokeWidth={1.75} />,
      text: `Paid on ${formatDate(followup.resolvedAt)}${followup.amountRecovered ? ` · ₹${formatAmount(followup.amountRecovered)} recovered` : ""}`,
      color: palette.success.default,
    })
  }
  if (resolved && followup.outstandingAmountAtResolution != null) {
    const bal = followup.outstandingAmountAtResolution
    const balDrCr = followup.outstandingDrCrAtResolution ?? "Dr"
    events.push({
      icon: <Wallet size={11} color={bal === 0 ? palette.success.default : palette.neutral[400]} strokeWidth={1.75} />,
      text: bal === 0 ? `Balance cleared` : `Balance after: ₹${formatAmount(bal)} ${balDrCr}`,
      color: bal === 0 ? palette.success.default : palette.neutral[500],
    })
  }
  for (const send of (followup.whatsappSends ?? [])) {
    const isReceipt = send.type === "receipt"
    const color = isReceipt ? palette.success.dark : palette.warning.dark
    events.push({
      icon: <MessageCircle size={11} color={color} strokeWidth={1.75} />,
      text: `WhatsApp ${isReceipt ? "receipt" : "reminder"} sent ${formatDate(send.sentAt)}`,
      color,
    })
  }

  return (
    <AppCard elevation="sm" style={styles.card}>
      {/* Header: contact method + outcome + time ago */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <ContactIcon method={followup.contactMethod} color={colors.text.tertiary as string} />
        <AppText variant="caption" color="secondary">{CONTACT_LABELS[followup.contactMethod]}</AppText>
        <View style={[styles.outcomeBadge, { backgroundColor: color + "22" }]}>
          <AppText variant="caption" style={{ color, fontSize: 11 }}>{OUTCOME_LABELS[followup.outcome]}</AppText>
        </View>
        <AppText variant="caption" color="tertiary" style={{ marginLeft: "auto" as any }}>
          {moment(followup.loggedAt).fromNow()}
        </AppText>
      </View>

      {/* Inner timeline of events */}
      {events.length > 0 && (
        <View style={styles.eventList}>
          {events.map((ev, i) => (
            <EventRow key={i} icon={ev.icon} text={ev.text} color={ev.color} isLast={i === events.length - 1} />
          ))}
        </View>
      )}

      {followup.freeTextRemark ? (
        <AppText variant="caption" color="secondary" numberOfLines={3} style={styles.remark}>
          "{followup.freeTextRemark}"
        </AppText>
      ) : null}

      {/* WhatsApp action buttons */}
      {(resolved || (!resolved && !!followup.promisedAmount)) && !!mobile && (
        <View style={styles.waActions}>
          {resolved && (
            <TouchableOpacity activeOpacity={0.7} onPress={sendReceiptWhatsApp} style={styles.waBtn}>
              <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
              <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Send Receipt</AppText>
            </TouchableOpacity>
          )}
          {!resolved && !!followup.promisedAmount && (
            <TouchableOpacity activeOpacity={0.7} onPress={sendReminderWhatsApp} style={styles.waBtnReminder}>
              <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
              <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Send Reminder</AppText>
            </TouchableOpacity>
          )}
        </View>
      )}

    </AppCard>
  )
}

// ─── ledger entry row ────────────────────────────────────────────────────────

function LedgerEntryRow({ entry, isLast }: { entry: LedgerEntry; isLast: boolean }) {
  const { colors } = useTheme()
  const isDebit = entry.debit > 0
  const amount = isDebit ? entry.debit : entry.credit
  const dotColor = isDebit ? palette.error.default : palette.success.default

  return (
    <View style={[styles.tlRow, { paddingLeft: spacing[4] }]}>
      <View style={styles.tlDotCol}>
        <View style={[styles.tlDot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={[styles.tlLine, { backgroundColor: dotColor + "30" }]} />}
      </View>
      <View style={[styles.tlContent, { borderBottomColor: colors.border }, isLast && { borderBottomWidth: 0 }]}>
        <View style={styles.tlTopRow}>
          <View style={[styles.tlTypePill, { backgroundColor: dotColor + "18" }]}>
            {isDebit
              ? <TrendingUp size={9} color={dotColor} strokeWidth={1.75} />
              : <TrendingDown size={9} color={dotColor} strokeWidth={1.75} />
            }
            <AppText variant="caption" style={{ fontSize: 10, color: dotColor }}>
              {entry.voucher_type}
            </AppText>
          </View>
          {entry.voucher_number && (
            <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>
              #{entry.voucher_number}
            </AppText>
          )}
          <View style={{ flex: 1 }} />
          <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>
            {formatDate(entry.voucher_date)}
          </AppText>
        </View>
        <View style={styles.tlAmountRow}>
          <AppText variant="mono" style={{ color: dotColor, fontSize: 16 }}>
            {isDebit ? "+" : "−"}₹{formatAmount(amount)}
          </AppText>
          {entry.running_balance != null && (
            <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>
              Bal ₹{formatAmount(entry.running_balance)} {entry.running_balance_dr_cr}
            </AppText>
          )}
        </View>
        {!!entry.sales_executive_raw && (
          <AppText variant="caption" color="tertiary" numberOfLines={1} style={{ fontSize: 12 }}>
            {entry.sales_executive_raw}
          </AppText>
        )}
        {!!entry.remarks && (
          <AppText variant="caption" color="tertiary" numberOfLines={1} style={{ fontSize: 12 }}>
            Remarks: {entry.remarks}
          </AppText>
        )}
      </View>
    </View>
  )
}

// ─── balance trend chart ─────────────────────────────────────────────────────

const CHART_H = 220
const CP = { top: 20, right: 56, bottom: 30, left: 8 }

function BalanceTrendChart({ entries, width }: { entries: LedgerEntry[]; width: number }) {
  const { colors } = useTheme()
  const animOpacity = useRef(new Animated.Value(0)).current
  const animTranslate = useRef(new Animated.Value(10)).current
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null)

  const points = useMemo(() => {
    return [...entries]
      .filter((e) => e.running_balance != null)
      .reverse()
      .map((e) => ({
        balance: e.running_balance!,
        drCr: e.running_balance_dr_cr ?? "Dr",
        date: e.voucher_date,
        debit: e.debit,
      }))
  }, [entries])

  useEffect(() => {
    animOpacity.setValue(0)
    animTranslate.setValue(10)
    Animated.parallel([
      Animated.timing(animOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(animTranslate, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start()
  }, [points.length, width])

  const plotW = width - CP.left - CP.right
  const plotH = CHART_H - CP.top - CP.bottom

  // split: 62% for balance line, gap, rest for bars
  const lineH = Math.floor(plotH * 0.62)
  const barGap = 8
  const barAreaH = plotH - lineH - barGap
  const lineBottom = CP.top + lineH
  const barTop = lineBottom + barGap
  const barBottom = CP.top + plotH

  function fmtAmt(v: number) {
    if (v >= 10_00_000) return `₹${(v / 10_00_000).toFixed(1)}M`
    if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`
    return `₹${Math.round(v)}`
  }

  if (points.length < 2) {
    return (
      <View style={styles.chartEmpty}>
        <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>Not enough data yet</AppText>
      </View>
    )
  }

  const balances = points.map((p) => p.balance)
  const minVal = Math.min(...balances)
  const maxVal = Math.max(...balances)
  const range = maxVal - minVal || maxVal || 1

  const maxDebit = Math.max(...points.map((p) => p.debit), 1)
  const barW = Math.min(20, Math.max(1, plotW / points.length - 0.5))

  function xAt(i: number) { return CP.left + (i / (points.length - 1)) * plotW }
  function yAt(v: number) { return CP.top + (1 - (v - minVal) / range) * lineH }
  function barHAt(debit: number) { return (debit / maxDebit) * barAreaH }

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.balance).toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L${xAt(points.length - 1).toFixed(1)},${lineBottom.toFixed(1)} L${CP.left.toFixed(1)},${lineBottom.toFixed(1)} Z`

  const isDr = points[points.length - 1].drCr === "Dr"
  const lineColor = isDr ? palette.error.default : palette.success.default

  const yTicks = [maxVal, (maxVal + minVal) / 2, minVal]
  const xLabels = [0, Math.floor((points.length - 1) / 2), points.length - 1]

  function fmtDateShort(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }

  function resolveIdx(touchX: number) {
    const raw = Math.round((touchX - CP.left) / plotW * (points.length - 1))
    return Math.max(0, Math.min(points.length - 1, raw))
  }


  const tp = tooltipIdx !== null ? points[tooltipIdx] : null
  const tpX = tooltipIdx !== null ? xAt(tooltipIdx) : 0
  const tpY = tp ? yAt(tp.balance) : 0
  const tooltipLeft = tooltipIdx !== null
    ? tpX < (width - CP.right) / 2 ? tpX + 10 : tpX - 114
    : 0

  return (
    <View
      style={{ position: "relative" }}
      onMouseMove={(e: any) => setTooltipIdx(resolveIdx(e.nativeEvent.offsetX ?? e.nativeEvent.locationX))}
      onMouseLeave={() => setTooltipIdx(null)}
    >
      <Animated.View style={{ opacity: animOpacity, transform: [{ translateY: animTranslate }] }}>
        <Svg width={width} height={CHART_H}>
          <Defs>
            <LinearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* balance grid lines */}
          {yTicks.map((v, i) => (
            <SvgLine key={i} x1={CP.left} y1={yAt(v)} x2={width - CP.right} y2={yAt(v)}
              stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,3" />
          ))}

          {/* balance area + line */}
          <Path d={areaPath} fill="url(#balGrad)" />
          <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />

          {/* start / end dots */}
          <Circle cx={xAt(0)} cy={yAt(points[0].balance)} r={2.5} fill={lineColor} fillOpacity={0.5} />
          <Circle cx={xAt(points.length - 1)} cy={yAt(points[points.length - 1].balance)} r={3.5} fill={lineColor} />

          {/* separator between line and bar areas */}
          <SvgLine x1={CP.left} y1={barTop - 2} x2={width - CP.right} y2={barTop - 2}
            stroke={colors.border} strokeWidth={0.5} />

          {/* debit bars */}
          {points.map((p, i) => {
            const h = barHAt(p.debit)
            if (h < 0.5) return null
            return (
              <Rect
                key={i}
                x={xAt(i) - barW / 2}
                y={barBottom - h}
                width={barW}
                height={h}
                fill={colors.accent}
                fillOpacity={0.5}
                rx={barW > 2 ? 1 : 0}
              />
            )
          })}

          {/* y-axis labels */}
          {yTicks.map((v, i) => (
            <SvgText key={i} x={width - CP.right + 4} y={yAt(v) + 3} fontSize={11} fill={colors.text.tertiary} textAnchor="start">
              {fmtAmt(v)}
            </SvgText>
          ))}

          {/* x-axis labels */}
          {xLabels.map((idx, i) => (
            <SvgText key={i} x={xAt(idx)} y={CHART_H - 4} fontSize={10} fill={colors.text.tertiary}
              textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}>
              {fmtDateShort(points[idx].date)}
            </SvgText>
          ))}

          {/* tooltip crosshair */}
          {tp && (
            <>
              <SvgLine x1={tpX} y1={CP.top} x2={tpX} y2={barBottom}
                stroke={lineColor} strokeWidth={1} strokeDasharray="3,3" strokeOpacity={0.5} />
              <Circle cx={tpX} cy={tpY} r={7} fill={lineColor} fillOpacity={0.15} />
              <Circle cx={tpX} cy={tpY} r={3.5} fill={lineColor} />
            </>
          )}
        </Svg>
      </Animated.View>

      {tp && (
        <View style={[styles.chartTooltip, { left: tooltipLeft, backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <AppText variant="caption" style={{ color: lineColor, fontSize: 12 }}>
            ₹{formatAmount(tp.balance)} {tp.drCr}
          </AppText>
          {tp.debit > 0 && (
            <AppText variant="caption" style={{ color: colors.accent, fontSize: 10 }}>
              +₹{formatAmount(tp.debit)} sale
            </AppText>
          )}
          <AppText variant="caption" color="tertiary" style={{ fontSize: 10 }}>
            {fmtDateShort(tp.date)}
          </AppText>
        </View>
      )}
    </View>
  )
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function CustomerDetailScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const user = useAuthStore((s) => s.user)

  const { name, totalBalance, drCr, customerId, mobile, initialTab } = useLocalSearchParams<{
    name: string
    totalBalance: string
    drCr: string
    customerId: string
    mobile: string
    initialTab?: string
  }>()

  const [activeTab, setActiveTab] = useState<"followups" | "ledger" | "profile">(
    initialTab === "ledger" ? "ledger" : initialTab === "profile" ? "profile" : "followups"
  )
  const [chartContainerWidth, setChartContainerWidth] = useState(0)

  const isStaff = user?.role === "staff"

  const { data, isLoading } = useCustomerFollowups(customerId)
  const {
    data: ledgerData,
    isLoading: ledgerLoading,
    isError: ledgerError,
    hasNextPage: ledgerHasNext,
    isFetchingNextPage: ledgerFetchingNext,
    fetchNextPage: ledgerFetchNext,
  } = useCustomerLedger(isStaff ? null : customerId, { limit: 500 })

  const ledgerEntries = ledgerData?.pages.flatMap((p) => p.data.entries) ?? []
  const ledgerSummary = ledgerData?.pages[0]?.summary
  const profileRetention = ledgerData?.pages[0]?.retention ?? null
  const profileVelocity = ledgerData?.pages[0]?.payment_velocity ?? null
  const profileFollowUp = ledgerData?.pages[0]?.follow_up ?? null
  const profileOwnership = ledgerData?.pages[0]?.ownership ?? null

  const calculatedOpening = useMemo(() => {
    if (!ledgerSummary) return null
    const signedClosing = (ledgerSummary.closing_balance ?? 0) * (ledgerSummary.closing_dr_cr === "Cr" ? -1 : 1)
    const signed = signedClosing - ledgerSummary.net_movement
    return { balance: Math.abs(signed), drCr: (signed >= 0 ? "Dr" : "Cr") as "Dr" | "Cr" }
  }, [ledgerSummary])

  // Prefer live outstanding from API; fall back to URL params (when navigating from customers list)
  const liveBalance = data?.outstanding?.outstanding_balance
  const liveDrCr = data?.outstanding?.outstanding_dr_cr
  const balanceAmount = liveBalance ?? (totalBalance !== "" ? Number(totalBalance) : null)
  const balanceDrCr = liveDrCr ?? drCr ?? "Dr"
  const hasBalance = balanceAmount != null
  const isSettled = hasBalance && balanceAmount === 0

  const customerFollowups = useMemo(() => {
    return (data?.data ?? []).sort(
      (a, b) => moment(b.loggedAt).valueOf() - moment(a.loggedAt).valueOf()
    )
  }, [data])

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.75} />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <AppText variant="heading3">{toTitleCase(name)}</AppText>
            {isSettled && (
              <View style={styles.settledPill}>
                <AppText variant="caption" style={{ color: palette.success.default }}>Settled</AppText>
              </View>
            )}
          </View>
          {hasBalance && (
            <AppText variant="caption" color="secondary">
              {isSettled
                ? "Balance cleared"
                : balanceDrCr === "Cr"
                ? `₹${formatAmount(balanceAmount!)} in credit`
                : `₹${formatAmount(balanceAmount!)} outstanding`}
            </AppText>
          )}
          {mobile ? (
            <View style={styles.mobileRow}>
              <TouchableOpacity activeOpacity={0.6} style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${mobile}`)}>
                <Phone size={11} color={palette.info.default} strokeWidth={1.75} />
                <AppText variant="caption" style={{ color: palette.info.default }}>{mobile}</AppText>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.6} style={styles.contactBtn} onPress={() => Linking.openURL(`whatsapp://send?phone=${mobile}`)}>
                <MessageCircle size={11} color={palette.success.default} strokeWidth={1.75} />
                <AppText variant="caption" style={{ color: palette.success.default }}>WhatsApp</AppText>
              </TouchableOpacity>
              {!isSettled && hasBalance && balanceDrCr === "Dr" && (
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.contactBtn}
                  onPress={() => {
                    const msg = `Dear ${toTitleCase(name)},\n\nThis is a friendly reminder that you have an outstanding balance of ₹${formatAmount(balanceAmount!)}.\n\nKindly clear the dues at your earliest convenience.\n\nThank you!\nRoyal Glass Vengara`
                    Linking.openURL(`whatsapp://send?phone=${mobile}&text=${encodeURIComponent(msg)}`)
                  }}
                >
                  <BellRing size={11} color={palette.warning.default} strokeWidth={1.75} />
                  <AppText variant="caption" style={{ color: palette.warning.default }}>Remind</AppText>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={styles.tabWrap}>
          {([
            { value: "followups", label: "Follow-ups" },
            ...(user?.role !== "staff" ? [
              { value: "ledger",  label: "Ledger" },
              { value: "profile", label: "Profile" },
            ] : []),
          ] as { value: "followups" | "ledger" | "profile"; label: string }[]).map(({ value, label }) => {
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
        isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : (
          <FlatList
            data={customerFollowups}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <FollowUpCard
                followup={item}
                mobile={mobile ?? ""}
                customerName={toTitleCase(name)}
                totalBalance={totalBalance ?? "0"}
                drCr={drCr ?? "Dr"}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <AppText color="tertiary">No follow-ups yet</AppText>
              </View>
            }
          />
        )
      )}

      {/* Ledger tab */}
      {activeTab === "ledger" && (
        ledgerLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : ledgerError ? (
          <View style={styles.center}>
            <AppText color="secondary">Couldn't load ledger entries.</AppText>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={ledgerEntries}
            keyExtractor={(item) => String(item.voucher_id)}
            renderItem={({ item, index }) => <LedgerEntryRow entry={item} isLast={index === ledgerEntries.length - 1} />}
            contentContainerStyle={styles.ledgerList}
            ListHeaderComponent={(
              <>
                {ledgerSummary && (
                  <View style={[styles.ledgerSummary, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
                    <View style={styles.summaryItem}>
                      <AppText
                        variant="heading3"
                        style={{ color: calculatedOpening?.drCr === "Dr" ? palette.error.default : palette.success.default }}
                      >
                        {calculatedOpening ? `₹${formatAmount(calculatedOpening.balance)}` : "—"}
                      </AppText>
                      <AppText variant="caption" color="tertiary">Opening {calculatedOpening?.drCr ?? ""}</AppText>
                    </View>
                    <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.summaryItem}>
                      <AppText variant="heading3" style={{ color: palette.error.default }}>₹{formatAmount(ledgerSummary.total_debit)}</AppText>
                      <AppText variant="caption" color="tertiary">Debit</AppText>
                    </View>
                    <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.summaryItem}>
                      <AppText variant="heading3" style={{ color: palette.success.default }}>₹{formatAmount(ledgerSummary.total_credit)}</AppText>
                      <AppText variant="caption" color="tertiary">Credit</AppText>
                    </View>
                    <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.summaryItem}>
                      <AppText
                        variant="heading3"
                        style={{ color: ledgerSummary.closing_dr_cr === "Dr" ? palette.error.default : palette.success.default }}
                      >
                        ₹{formatAmount(Math.abs(ledgerSummary.closing_balance ?? 0))}
                      </AppText>
                      <AppText variant="caption" color="tertiary">Closing {ledgerSummary.closing_dr_cr ?? ""}</AppText>
                    </View>
                  </View>
                )}
                {isTablet && ledgerEntries.length > 1 && (
                  <View
                    onLayout={(e) => setChartContainerWidth(e.nativeEvent.layout.width)}
                    style={[styles.chartBanner, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}
                  >
                    <View style={styles.chartBannerHeader}>
                      <AppText variant="label" color="tertiary" style={{ letterSpacing: 0.5 }}>BALANCE TREND</AppText>
                      {ledgerSummary && (
                        <View style={styles.chartBannerStats}>
                          <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
                            Peak{" "}
                            <AppText variant="caption" style={{ color: palette.error.default, fontSize: 11 }}>
                              ₹{formatAmount(Math.max(...ledgerEntries.filter(e => e.running_balance != null).map(e => e.running_balance!)))}
                            </AppText>
                          </AppText>
                          <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>·</AppText>
                          <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
                            {ledgerEntries.length}{ledgerHasNext ? "+" : ""} entries
                          </AppText>
                        </View>
                      )}
                    </View>
                    {chartContainerWidth > 0 && (
                      <BalanceTrendChart entries={ledgerEntries} width={chartContainerWidth} />
                    )}
                  </View>
                )}
              </>
            )}
            onEndReachedThreshold={0.3}
            onEndReached={() => { if (ledgerHasNext && !ledgerFetchingNext) ledgerFetchNext() }}
            ListFooterComponent={
              ledgerFetchingNext
                ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
                : null
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <AppText color="tertiary">No ledger entries found</AppText>
              </View>
            }
          />
        )
      )}

      {/* Profile tab */}
      {activeTab === "profile" && (
        ledgerLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : (
          <ScrollView contentContainerStyle={styles.profileScroll}>
            {/* Retention */}
            <AppCard elevation="sm" style={styles.profileCard}>
              <AppText variant="label" color="tertiary" style={styles.profileSectionLabel}>BUYING ACTIVITY</AppText>
              {profileRetention ? (() => {
                const ret = profileRetention
                const color = RETENTION_COLOR[ret.status]
                return (
                  <View style={styles.profileCardBody}>
                    <View style={styles.profileRow}>
                      <AppText variant="caption" color="secondary">Status</AppText>
                      <View style={[styles.profilePill, { backgroundColor: color + "18" }]}>
                        <AppText variant="caption" numberOfLines={1} style={{ color, fontSize: 12 }}>{RETENTION_STATUS_LABEL[ret.status]}</AppText>
                      </View>
                    </View>
                    {ret.days_since_last_purchase != null && (
                      <View style={styles.profileRow}>
                        <AppText variant="caption" color="secondary">Last purchase</AppText>
                        <AppText variant="caption" style={{ color }}>{ret.days_since_last_purchase}d ago</AppText>
                      </View>
                    )}
                    <View style={styles.profileRow}>
                      <AppText variant="caption" color="secondary">Total purchases</AppText>
                      <AppText variant="caption" color="primary">{ret.total_purchases}</AppText>
                    </View>
                    {ret.first_purchase_date && (
                      <View style={styles.profileRow}>
                        <AppText variant="caption" color="secondary">First purchase</AppText>
                        <AppText variant="caption" color="primary">
                          {new Date(ret.first_purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </AppText>
                      </View>
                    )}
                    {ret.last_purchase_date && (
                      <View style={styles.profileRow}>
                        <AppText variant="caption" color="secondary">Last purchase date</AppText>
                        <AppText variant="caption" color="primary">
                          {new Date(ret.last_purchase_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </AppText>
                      </View>
                    )}
                    <View style={[styles.profileHint, { borderTopColor: colors.border }]}>
                      <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
                        {"Active ≤"}{ret.activeDays}{"d · At Risk "}{ret.activeDays + 1}{"–"}{ret.churnedDays}{"d · Churned >"}{ret.churnedDays}d
                      </AppText>
                    </View>
                  </View>
                )
              })() : <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[2] }}>No purchase history</AppText>}
            </AppCard>

            {/* Payment velocity */}
            <AppCard elevation="sm" style={styles.profileCard}>
              <AppText variant="label" color="tertiary" style={styles.profileSectionLabel}>PAYMENT SPEED</AppText>
              {profileVelocity && profileVelocity.avg_days_to_clear != null ? (() => {
                const vel = profileVelocity
                return (
                  <View style={styles.profileCardBody}>
                    <View style={styles.profileRow}>
                      <AppText variant="caption" color="secondary">Avg days to clear</AppText>
                      <AppText variant="mono" style={{ color: colors.accent }}>{vel.avg_days_to_clear!.toFixed(1)}d</AppText>
                    </View>
                    <View style={styles.profileRow}>
                      <AppText variant="caption" color="secondary">Total debt</AppText>
                      <AppText variant="caption" color="primary">₹{formatAmount(vel.total_debt_amount)}</AppText>
                    </View>
                    <View style={styles.profileRow}>
                      <AppText variant="caption" color="secondary">Total cleared</AppText>
                      <AppText variant="caption" style={{ color: palette.success.default }}>₹{formatAmount(vel.total_cleared_amount)}</AppText>
                    </View>
                    <View style={styles.profileRow}>
                      <AppText variant="caption" color="secondary">Cleared</AppText>
                      <AppText variant="caption" color="primary">{vel.cleared_pct.toFixed(0)}%</AppText>
                    </View>
                    {vel.days_since_last_payment != null && (
                      <View style={styles.profileRow}>
                        <AppText variant="caption" color="secondary">Last payment</AppText>
                        <AppText variant="caption" style={{ color: vel.days_since_last_payment <= 30 ? palette.success.default : vel.days_since_last_payment <= 90 ? palette.warning.default : palette.error.default }}>
                          {vel.days_since_last_payment}d ago{vel.last_payment_amount != null ? ` · ₹${formatAmount(vel.last_payment_amount)}` : ""}
                        </AppText>
                      </View>
                    )}
                    <View style={[styles.progressTrack, { backgroundColor: palette.success.default + "22", marginTop: spacing[2] }]}>
                      <View style={[styles.progressFill, { backgroundColor: palette.success.default, width: `${Math.min(vel.cleared_pct, 100)}%` as any }]} />
                    </View>
                  </View>
                )
              })() : <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[2] }}>No payment velocity data yet</AppText>}
            </AppCard>

            {/* Follow-up summary */}
            <AppCard elevation="sm" style={styles.profileCard}>
              <AppText variant="label" color="tertiary" style={styles.profileSectionLabel}>FOLLOW-UP SUMMARY</AppText>
              {profileFollowUp && profileFollowUp.total > 0 ? (() => {
                const fu = profileFollowUp
                const isOverdue = fu.is_overdue
                return (
                  <View style={styles.profileCardBody}>
                    <View style={styles.profileStatRow}>
                      <View style={styles.profileStat}>
                        <AppText variant="heading3">{fu.total}</AppText>
                        <AppText variant="caption" color="tertiary">Total</AppText>
                      </View>
                      <View style={styles.profileStat}>
                        <AppText variant="heading3" style={{ color: palette.warning.default }}>{fu.open}</AppText>
                        <AppText variant="caption" color="tertiary">Open</AppText>
                      </View>
                      <View style={styles.profileStat}>
                        <AppText variant="heading3" style={{ color: palette.success.default }}>{fu.resolved}</AppText>
                        <AppText variant="caption" color="tertiary">Resolved</AppText>
                      </View>
                    </View>
                    {fu.total_promised_amount > 0 && (
                      <View style={styles.profileRow}>
                        <AppText variant="caption" color="secondary">Total promised</AppText>
                        <AppText variant="caption" style={{ color: palette.warning.default }}>₹{formatAmount(fu.total_promised_amount)}</AppText>
                      </View>
                    )}
                    {fu.last_logged_at && (
                      <View style={styles.profileRow}>
                        <AppText variant="caption" color="secondary">Last follow-up</AppText>
                        <AppText variant="caption" color="primary">{formatDate(fu.last_logged_at)}</AppText>
                      </View>
                    )}
                    {fu.next_followup_date && (
                      <View style={styles.profileRow}>
                        <AppText variant="caption" color="secondary">Next follow-up</AppText>
                        <AppText variant="caption" style={{ color: isOverdue ? palette.warning.default : palette.info.default }}>
                          {formatDate(fu.next_followup_date)}{isOverdue ? " · Overdue" : ""}
                        </AppText>
                      </View>
                    )}
                  </View>
                )
              })() : <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[2] }}>No follow-ups recorded</AppText>}
            </AppCard>

            {/* Ownership */}
            <AppCard elevation="sm" style={styles.profileCard}>
              <AppText variant="label" color="tertiary" style={styles.profileSectionLabel}>OWNERSHIP</AppText>
              <View style={styles.profileCardBody}>
                {profileOwnership?.staffName ? (
                  <View style={styles.profileRow}>
                    <AppText variant="caption" color="secondary">Assigned to</AppText>
                    <AppText variant="caption" color="primary">{profileOwnership.staffName}</AppText>
                  </View>
                ) : null}
                <View style={styles.profileRow}>
                  <AppText variant="caption" color="secondary">Source</AppText>
                  <View style={[styles.profilePill, { backgroundColor: colors.background.secondary }]}>
                    <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
                      {profileOwnership?.source ?? "unassigned"}
                    </AppText>
                  </View>
                </View>
              </View>
            </AppCard>
          </ScrollView>
        )
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          router.push({ pathname: "/customer/[name]/followup", params: { name, totalBalance, drCr, customerId, mobile } })
        }
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
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
  backBtn: { padding: spacing[2] },
  headerInfo: { flex: 1, gap: spacing[1] },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  mobileRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  settledPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: palette.success.default + "22",
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[20],
  },
  // ─── tabs ──────────────────────────────────────────────────────────────────
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
  // ─── card ──────────────────────────────────────────────────────────────────
  card: { gap: spacing[3] },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
    paddingBottom: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  outcomeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventList: { gap: 0 },
  // ─── inner event timeline ──────────────────────────────────────────────────
  eventRow: {
    flexDirection: "row",
  },
  eventDotCol: {
    width: 18,
    alignItems: "center",
    paddingTop: 3,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventLine: {
    width: 1.5,
    flex: 1,
    marginTop: 3,
    borderRadius: 1,
  },
  eventText: {
    flex: 1,
    paddingLeft: spacing[2],
  },
  eventTextSpaced: {
    paddingBottom: spacing[3],
  },
  eventTextInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  remark: {
    fontStyle: "italic",
  },
  waActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] + 1,
    borderRadius: 6,
    backgroundColor: palette.success.default,
  },
  waBtnReminder: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] + 1,
    borderRadius: 6,
    backgroundColor: palette.warning.default,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
  // ─── ledger ────────────────────────────────────────────────────────────────
  chartBanner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  chartBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  chartBannerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  chartEmpty: { height: CHART_H, alignItems: "center", justifyContent: "center" },
  chartTooltip: {
    position: "absolute",
    top: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 1,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  ledgerList: { paddingBottom: spacing[10] },
  ledgerSummary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[1],
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  tlRow: { flexDirection: "row" },
  tlDotCol: { width: 22, alignItems: "center", paddingTop: 4 },
  tlDot: { width: 10, height: 10, borderRadius: 5 },
  tlLine: { width: 1.5, flex: 1, marginTop: 4, borderRadius: 1, minHeight: 16 },
  tlContent: {
    flex: 1,
    paddingLeft: spacing[3],
    paddingRight: spacing[4],
    paddingTop: 2,
    paddingBottom: spacing[3],
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[1],
  },
  tlTopRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  tlTypePill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  tlAmountRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  fab: {
    position: "absolute",
    bottom: spacing[8],
    right: spacing[6],
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  // ─── profile tab ───────────────────────────────────────────────────────────
  profileScroll: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[20], maxWidth: 640, width: "100%", alignSelf: "center" },
  profileCard: { gap: spacing[3] },
  profileSectionLabel: { letterSpacing: 0.5, marginBottom: spacing[1] },
  profileCardBody: { gap: spacing[3] },
  profileRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profilePill: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 4 },
  profileHint: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing[2], marginTop: spacing[1] },
  profileStatRow: { flexDirection: "row", justifyContent: "space-around" },
  profileStat: { alignItems: "center", gap: 2 },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 3 },
})
