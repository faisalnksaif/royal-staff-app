import { View, Modal, Pressable, StyleSheet, StyleProp, ViewStyle } from "react-native"
import { X } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"

interface Props {
  title?: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
  contentStyle?: StyleProp<ViewStyle>
}

export default function Popup({ title, onClose, children, maxWidth = 480, contentStyle }: Props) {
  const { colors } = useTheme()

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { maxWidth, backgroundColor: colors.surface, borderColor: colors.border as string }, contentStyle]}>
          {title && (
            <View style={styles.header}>
              <AppText variant="heading3">{title}</AppText>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={colors.text.secondary as string} strokeWidth={2} />
              </Pressable>
            </View>
          )}
          {children}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: spacing[6],
  },
  card: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[5],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
})
