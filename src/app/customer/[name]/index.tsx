import { useMemo } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TouchableOpacity,
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
} from "lucide-react-native"
import { Linking } from "react-native"
import AppText from "../../../components/ui/AppText"
import AppCard from "../../../components/ui/AppCard"
import { useTheme } from "../../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../../constants/theme"
import useAuthStore from "../../../stores/useAuthStore"
import { useCustomerFollowups } from "../../../hooks/useCustomerFollowups"
import { followupService } from "../../../services/followupService"
import { formatDate } from "../../../utils/helpers"
import moment from "moment"
import type { FollowUp, ContactMethod, FollowUpOutcome } from "../../../types"

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

// ─── timeline row ────────────────────────────────────────────────────────────

function TLRow({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlIcon}>{icon}</View>
      <AppText variant="caption" style={{ color, flex: 1, fontSize: 11 }}>{text}</AppText>
    </View>
  )
}

// ─── follow-up card ──────────────────────────────────────────────────────────

function FollowUpCard({
  followup, mobile, customerName, totalBalance, drCr, isLast,
}: {
  followup: FollowUp; mobile: string; customerName: string; totalBalance: string; drCr: string; isLast: boolean
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

  return (
    <View style={styles.tlItem}>
      {/* Left: dot + connector line */}
      <View style={styles.tlDotCol}>
        <View style={[styles.tlDot, { backgroundColor: color }]} />
        {!isLast && <View style={[styles.tlLine, { backgroundColor: colors.border }]} />}
      </View>

      {/* Right: content */}
      <View style={[styles.tlContent, !isLast && styles.tlContentSpaced]}>
        {/* Top row: method + outcome badge + time */}
        <View style={styles.tlHeader}>
          <ContactIcon method={followup.contactMethod} color={palette.neutral[400]} />
          <AppText variant="caption" color="secondary">{CONTACT_LABELS[followup.contactMethod]}</AppText>
          <View style={[styles.outcomeBadge, { backgroundColor: color + "22" }]}>
            <AppText variant="caption" style={{ color, fontSize: 10 }}>{OUTCOME_LABELS[followup.outcome]}</AppText>
          </View>
          <AppText variant="caption" color="tertiary" style={{ marginLeft: "auto" as any }}>
            {moment(followup.loggedAt).fromNow()}
          </AppText>
        </View>

        {/* Timeline rows */}
        {followup.outstandingAmount != null && !followup.outstandingBackfilled && (
          <TLRow
            icon={<Wallet size={11} color={palette.neutral[400]} strokeWidth={1.75} />}
            text={`Balance then: ₹${formatAmount(followup.outstandingAmount)} ${followup.outstandingDrCr}`}
            color={palette.neutral[500]}
          />
        )}
        {followup.promisedAmount != null && (
          <TLRow
            icon={<Calendar size={11} color={palette.warning.default} strokeWidth={1.75} />}
            text={`Promised ₹${formatAmount(followup.promisedAmount)}${followup.promisedDate ? ` by ${formatDate(followup.promisedDate)}` : ""}`}
            color={palette.warning.default}
          />
        )}
        {followup.nextFollowUpDate && !resolved && (
          <TLRow
            icon={<Clock size={11} color={palette.info.default} strokeWidth={1.75} />}
            text={`Next follow-up: ${formatDate(followup.nextFollowUpDate)}`}
            color={palette.info.default}
          />
        )}
        {resolved && followup.resolvedAt && (
          <TLRow
            icon={<CheckCircle2 size={11} color={palette.success.default} strokeWidth={1.75} />}
            text={`Paid on ${formatDate(followup.resolvedAt)}${followup.amountRecovered ? ` · ₹${formatAmount(followup.amountRecovered)} recovered` : ""}`}
            color={palette.success.default}
          />
        )}
        {followup.whatsapp?.lastReminderSentAt && (
          <TLRow
            icon={<MessageCircle size={11} color={palette.warning.default} strokeWidth={1.75} />}
            text={`WhatsApp reminder sent ${formatDate(followup.whatsapp.lastReminderSentAt)}`}
            color={palette.warning.default}
          />
        )}
        {followup.whatsapp?.lastReceiptSentAt && (
          <TLRow
            icon={<MessageCircle size={11} color={palette.success.default} strokeWidth={1.75} />}
            text={`WhatsApp receipt sent ${formatDate(followup.whatsapp.lastReceiptSentAt)}`}
            color={palette.success.default}
          />
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

        <AppText variant="caption" color="tertiary" style={{ fontSize: 10 }}>
          Logged {formatDate(followup.loggedAt)}
        </AppText>
      </View>
    </View>
  )
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function CustomerDetailScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const user = useAuthStore((s) => s.user)

  const { name, totalBalance, drCr, customerId, mobile } = useLocalSearchParams<{
    name: string
    totalBalance: string
    drCr: string
    customerId: string
    mobile: string
  }>()

  const isSettled = Number(totalBalance) === 0

  const { data, isLoading } = useCustomerFollowups(customerId)

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
          <AppText variant="caption" color={drCr === "Cr" ? "secondary" : "secondary"}>
            {isSettled
              ? "Balance cleared"
              : drCr === "Cr"
              ? `₹${formatAmount(Number(totalBalance))} in credit`
              : `₹${formatAmount(Number(totalBalance))} outstanding`}
          </AppText>
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
            </View>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : (
        <FlatList
          data={customerFollowups}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <FollowUpCard
              followup={item}
              mobile={mobile ?? ""}
              customerName={toTitleCase(name)}
              totalBalance={totalBalance ?? "0"}
              drCr={drCr ?? "Dr"}
              isLast={index === customerFollowups.length - 1}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color="tertiary">No follow-ups yet</AppText>
            </View>
          }
        />
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
  // ─── timeline ──────────────────────────────────────────────────────────────
  tlItem: {
    flexDirection: "row",
  },
  tlDotCol: {
    width: 24,
    alignItems: "center",
  },
  tlDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  tlLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  tlContent: {
    flex: 1,
    paddingLeft: spacing[3],
    paddingBottom: spacing[2],
    gap: spacing[1],
  },
  tlContentSpaced: {
    paddingBottom: spacing[5],
  },
  tlHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
    marginBottom: spacing[1],
  },
  outcomeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  tlRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  tlIcon: {
    width: 14,
    alignItems: "center",
    paddingTop: 1,
  },
  remark: {
    fontStyle: "italic",
    marginTop: spacing[1],
  },
  waActions: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[1],
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
})
