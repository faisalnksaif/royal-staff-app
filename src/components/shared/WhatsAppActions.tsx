import { useState } from "react"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import { MessageCircle } from "lucide-react-native"
import { Linking } from "react-native"
import AppText from "../ui/AppText"
import ConfirmModal from "./ConfirmModal"
import { spacing, colors as palette } from "../../constants/theme"

interface Props {
  mobile: string
  customerName: string
  // Receipt
  showReceipt?: boolean
  receiptAmount?: number
  receiptBalanceLine?: string
  onReceiptSent?: () => void
  // Reminder
  showReminder?: boolean
  reminderAmount?: number
  reminderDateLine?: string
  onReminderSent?: () => void
}

export default function WhatsAppActions({
  mobile,
  customerName,
  showReceipt,
  receiptAmount = 0,
  receiptBalanceLine = "",
  onReceiptSent,
  showReminder,
  reminderAmount = 0,
  reminderDateLine = "",
  onReminderSent,
}: Props) {
  const [confirm, setConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  if (!showReceipt && !showReminder) return null

  function handleReceipt() {
    const msg = `Dear ${customerName},\n\nWe acknowledge receipt of ₹${fmt(receiptAmount)} payment.\n\n${receiptBalanceLine}\n\nThank you!\nRoyal Glass Vengara`
    setConfirm({
      title: "Send Receipt",
      message: `Send WhatsApp receipt of ₹${fmt(receiptAmount)} to ${customerName}?`,
      onConfirm: () => {
        Linking.openURL(`whatsapp://send?phone=${mobile}&text=${encodeURIComponent(msg)}`)
        onReceiptSent?.()
      },
    })
  }

  function handleReminder() {
    const msg = `Dear ${customerName},\n\nThis is a friendly reminder that you have promised to pay ₹${fmt(reminderAmount)}${reminderDateLine}.\n\nKindly ensure the payment is made on time.\n\nThank you!\nRoyal Glass Vengara`
    setConfirm({
      title: "Send Reminder",
      message: `Send WhatsApp reminder of ₹${fmt(reminderAmount)} to ${customerName}?`,
      onConfirm: () => {
        Linking.openURL(`whatsapp://send?phone=${mobile}&text=${encodeURIComponent(msg)}`)
        onReminderSent?.()
      },
    })
  }

  return (
    <>
      <View style={styles.row}>
        {showReceipt && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleReceipt} style={styles.receiptBtn}>
            <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
            <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Send Receipt</AppText>
          </TouchableOpacity>
        )}
        {showReminder && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleReminder} style={styles.reminderBtn}>
            <MessageCircle size={11} color="#fff" strokeWidth={1.75} />
            <AppText variant="caption" style={{ color: "#fff", fontSize: 10 }}>Send Reminder</AppText>
          </TouchableOpacity>
        )}
      </View>
      {confirm && (
        <ConfirmModal
          visible
          title={confirm.title}
          message={confirm.message}
          confirmLabel="Send"
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing[2] },
  receiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] + 1,
    borderRadius: 6,
    backgroundColor: palette.success.default,
  },
  reminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] + 1,
    borderRadius: 6,
    backgroundColor: palette.warning.default,
  },
})
