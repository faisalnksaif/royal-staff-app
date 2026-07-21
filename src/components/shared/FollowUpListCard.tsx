import { TouchableOpacity, View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { CheckCircle2, Calendar, Clock, Wallet, ClipboardList, MessageCircle, ChevronRight } from "lucide-react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { formatDate, formatAmount, toTitleCase } from "../../utils/helpers"
import ContactMethodIcon from "./ContactMethodIcon"
import OutcomeBadge, { outcomeColor } from "./OutcomeBadge"
import FollowUpTimeline from "./FollowUpTimeline"
import type { TimelineEvent } from "./FollowUpTimeline"
import type { FollowUp } from "../../types"

export function buildFollowUpEvents(item: FollowUp): TimelineEvent[] {
  const resolved = item.resolvedByPayment
  const events: TimelineEvent[] = [
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
  return events
}

interface Props {
  item: FollowUp
  showStaffName?: boolean
}

export default function FollowUpListCard({ item, showStaffName }: Props) {
  const { colors } = useTheme()
  const router = useRouter()
  const color = outcomeColor(item.outcome)
  const events = buildFollowUpEvents(item)

  function goToCustomer() {
    if (!item.ledgerId && !item.customerId) return
    router.push({
      pathname: "/customer/[name]",
      params: {
        name: item.customerName,
        customerId: String(item.customerId ?? item.ledgerId ?? ""),
        totalBalance: "",
        drCr: "",
        mobile: item.mobile ?? "",
      },
    })
  }

  return (
    <TouchableOpacity onPress={goToCustomer} activeOpacity={0.75} disabled={!item.ledgerId && !item.customerId}>
      <View style={[styles.row, { borderBottomColor: colors.border as string }]}>
        <View style={styles.rowHeader}>
          <ContactMethodIcon method={item.contactMethod} color={colors.text.tertiary as string} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium" numberOfLines={1}>{toTitleCase(item.customerName)}</AppText>
            {showStaffName && (
              <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
                by {toTitleCase(item.staffName)}
              </AppText>
            )}
          </View>
          <OutcomeBadge outcome={item.outcome} />
          <AppText variant="caption" color="tertiary" numberOfLines={1}>{moment(item.loggedAt).fromNow()}</AppText>
          {(!!item.ledgerId || !!item.customerId) && (
            <ChevronRight size={14} color={colors.text.tertiary} strokeWidth={1.75} />
          )}
        </View>
        <FollowUpTimeline events={events} />
        {item.freeTextRemark ? (
          <AppText variant="caption" color="secondary" numberOfLines={2} style={styles.remark}>
            "{item.freeTextRemark}"
          </AppText>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
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
  remark: { fontStyle: "italic" },
})
