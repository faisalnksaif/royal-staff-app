import { View, Modal, TouchableOpacity, StyleSheet } from "react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"

interface Props {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ visible, title, message, confirmLabel = "Confirm", onConfirm, onCancel }: Props) {
  const { colors } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <AppText variant="heading3" style={styles.title}>{title}</AppText>
          <AppText variant="body" color="secondary" style={styles.message}>{message}</AppText>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={onCancel} style={[styles.btn, { borderRightColor: colors.border }]}>
              <AppText variant="bodyMedium" color="secondary">Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => { onConfirm(); onCancel() }} style={styles.btn}>
              <AppText variant="bodyMedium" style={{ color: colors.accent }}>{confirmLabel}</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  title: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  message: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[4],
    borderRightWidth: StyleSheet.hairlineWidth,
  },
})
