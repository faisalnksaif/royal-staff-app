import { useMemo } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import {
  ChevronLeft,
  Phone,
  MessageSquare,
  Mail,
  UserCheck,
  MessageCircle,
  Plus,
} from "lucide-react-native"
import { Linking } from "react-native"
import AppText from "../../../components/ui/AppText"
import AppCard from "../../../components/ui/AppCard"
import { useTheme } from "../../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../../constants/theme"
import useAuthStore from "../../../stores/useAuthStore"
import { useStaffFollowups } from "../../../hooks/useStaffFollowups"
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
  promisedToPay: "Promised to Pay",
  promisedPartial: "Promised Partial",
  dispute: "Dispute",
  noContact: "No Contact",
  paid: "Paid",
}

function outcomeColor(o: FollowUpOutcome): string {
  switch (o) {
    case "paid":
    case "promisedToPay":
      return palette.success.default
    case "promisedPartial":
      return palette.warning.default
    case "dispute":
      return palette.error.default
    case "noContact":
      return palette.neutral[500]
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

// ─── follow-up card ──────────────────────────────────────────────────────────

function FollowUpCard({ followup }: { followup: FollowUp }) {
  const color = outcomeColor(followup.outcome)
  const resolved = followup.resolvedByPayment
  return (
    <AppCard elevation="sm" style={[styles.card, resolved && styles.resolvedCard]}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.methodRow}>
            <ContactIcon method={followup.contactMethod} color={palette.neutral[400]} />
            <AppText variant="caption" color="secondary">
              {CONTACT_LABELS[followup.contactMethod]}
            </AppText>
          </View>
          {followup.promisedDate && (
            <AppText variant="caption" style={{ color: palette.warning.default }}>
              Promised: {formatDate(followup.promisedDate)}
            </AppText>
          )}
          {followup.nextFollowUpDate && !resolved && (
            <AppText variant="caption" style={{ color: palette.info.default }}>
              Next: {formatDate(followup.nextFollowUpDate)}
            </AppText>
          )}
          {resolved && followup.resolvedAt && (
            <AppText variant="caption" style={{ color: palette.success.default }}>
              Paid on {formatDate(followup.resolvedAt)}
            </AppText>
          )}
          {followup.freeTextRemark ? (
            <AppText variant="caption" color="secondary" numberOfLines={2}>
              {followup.freeTextRemark}
            </AppText>
          ) : null}
          <AppText variant="caption" color="tertiary">
            Logged {formatDate(followup.loggedAt)}
          </AppText>
        </View>
        <View style={styles.rowRight}>
          <View style={[styles.badge, { backgroundColor: color + "33" }]}>
            <AppText variant="caption" style={{ color }}>
              {OUTCOME_LABELS[followup.outcome]}
            </AppText>
          </View>
          {followup.promisedAmount ? (
            <AppText
              variant="mono"
              style={{ fontSize: 12, textDecorationLine: resolved ? "line-through" : "none" }}
              color={resolved ? "tertiary" : "secondary"}
            >
              ₹{formatAmount(followup.promisedAmount)}
            </AppText>
          ) : null}
          {resolved && (
            <View style={styles.resolvedPill}>
              <AppText variant="caption" style={{ color: palette.success.default }}>Resolved</AppText>
            </View>
          )}
        </View>
      </View>
    </AppCard>
  )
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function CustomerDetailScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)

  const { name, totalBalance, customerId, mobile } = useLocalSearchParams<{
    name: string
    totalBalance: string
    customerId: string
    mobile: string
  }>()

  const isSettled = Number(totalBalance) === 0

  const { data, isLoading } = useStaffFollowups(user?.user_id)

  const customerFollowups = useMemo(() => {
    return (data?.data ?? [])
      .filter((f) => f.customerName.toLowerCase() === name.toLowerCase())
      .sort((a, b) => moment(b.loggedAt).valueOf() - moment(a.loggedAt).valueOf())
  }, [data, name])

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
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
          <AppText variant="caption" color="secondary">
            {isSettled ? "Balance cleared" : `₹${formatAmount(Number(totalBalance))} outstanding`}
          </AppText>
          {mobile ? (
            <Pressable style={styles.mobileRow} onPress={() => Linking.openURL(`tel:${mobile}`)}>
              <Phone size={11} color={palette.info.default} strokeWidth={1.75} />
              <AppText variant="caption" style={{ color: palette.info.default }}>{mobile}</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : (
        <FlatList
          data={customerFollowups}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <FollowUpCard followup={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color="tertiary">No follow-ups yet</AppText>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() =>
          router.push({ pathname: "/customer/[name]/followup", params: { name, totalBalance, customerId, mobile } })
        }
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
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
  headerInfo: { flex: 1, gap: spacing[1] },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  mobileRow: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  settledPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: palette.success.default + "22",
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[20],
  },
  card: { padding: 0 },
  resolvedCard: { borderLeftWidth: 3, borderLeftColor: palette.success.default },
  resolvedPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: palette.success.default + "22",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
  },
  rowLeft: { flex: 1, gap: spacing[1] },
  rowRight: { alignItems: "flex-end", gap: spacing[1] },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
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
