import { useState } from "react"
import { View, TextInput, StyleSheet } from "react-native"
import moment from "moment"
import Popup from "../shared/Popup"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import type { LeaveRequest } from "../../types"

/**
 * Asks for the (required) reason before cancelling an approved leave. Shared
 * by the staff "My Leaves" screen and the admin team-leaves screen - the
 * server decides who may cancel (see LeaveService.canCancelLeave).
 */
export default function CancelLeaveModal({
  leave,
  onClose,
  onConfirm,
  isLoading,
}: {
  leave: LeaveRequest | null
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}) {
  const { colors } = useTheme()
  const [reason, setReason] = useState("")

  if (!leave) return null

  function handleClose() {
    setReason("")
    onClose()
  }

  return (
    <Popup title="Cancel Approved Leave" onClose={handleClose}>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing[1] }}>
        {leave.staffName ? `${leave.staffName} · ` : ""}{leave.leaveType} · {moment(leave.startDate).format("D MMM")} – {moment(leave.endDate).format("D MMM YYYY")}
      </AppText>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[4] }}>
        The leave will no longer count toward the balance. Provide a reason (required).
      </AppText>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
        placeholder="e.g. Plans changed"
        placeholderTextColor={colors.text.tertiary}
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <View style={styles.actions}>
        <AppButton label="Keep leave" variant="ghost" onPress={handleClose} />
        <AppButton
          label={isLoading ? "Cancelling…" : "Cancel leave"}
          onPress={() => reason.trim() && onConfirm(reason.trim())}
          disabled={!reason.trim() || isLoading}
          style={{ backgroundColor: palette.error.default }}
        />
      </View>
    </Popup>
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    minHeight: 80,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing[3],
    marginTop: spacing[4],
  },
})
