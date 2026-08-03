import { View, Modal, Pressable, StyleSheet, Dimensions } from "react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"

export interface ActionMenuItem {
  label: string
  icon: React.ReactNode
  color?: string
  onPress: () => void
}

export interface ActionMenuAnchor {
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  visible: boolean
  onClose: () => void
  items: ActionMenuItem[]
  anchor?: ActionMenuAnchor | null
}

const MENU_WIDTH = 220

export default function ActionMenu({ visible, onClose, items, anchor }: Props) {
  const { colors } = useTheme()

  if (!visible) return null

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

  let positionStyle: { top: number; left: number } | undefined
  if (anchor) {
    let left = anchor.x + anchor.width - MENU_WIDTH
    left = Math.max(spacing[3], Math.min(left, screenWidth - MENU_WIDTH - spacing[3]))
    let top = anchor.y + anchor.height + spacing[1]
    const estimatedHeight = items.length * 48 + spacing[3]
    if (top + estimatedHeight > screenHeight - spacing[3]) {
      top = anchor.y - estimatedHeight - spacing[1]
    }
    positionStyle = { top, left }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border as string, width: MENU_WIDTH },
            positionStyle ?? styles.centered,
          ]}
        >
          {items.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={() => { onClose(); item.onPress() }}
              style={[
                styles.item,
                index < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border as string },
              ]}
              hitSlop={4}
            >
              {item.icon}
              <AppText variant="body" style={item.color ? { color: item.color } : undefined}>
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  centered: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -MENU_WIDTH / 2,
  },
  card: {
    position: "absolute",
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
  },
})
