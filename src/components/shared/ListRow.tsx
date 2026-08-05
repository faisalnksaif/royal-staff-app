import { useRef, useState } from "react"
import { View, Pressable, ActivityIndicator, StyleSheet } from "react-native"
import { MoreVertical } from "lucide-react-native"
import AppText from "../ui/AppText"
import NumberedAvatar from "./NumberedAvatar"
import ActionMenu, { ActionMenuItem, ActionMenuAnchor } from "./ActionMenu"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"

export interface ListRowPill {
  key: string
  label: string
  color: string
  bgColor: string
  muted?: boolean
}

interface Props {
  number: number
  avatarColor: string
  avatarBgColor: string
  title: string
  pills?: ListRowPill[]
  trailing?: React.ReactNode
  menuItems?: ActionMenuItem[]
  isBusy?: boolean
  metaLines?: React.ReactNode[]
}

export default function ListRow({
  number,
  avatarColor,
  avatarBgColor,
  title,
  pills = [],
  trailing,
  menuItems = [],
  isBusy = false,
  metaLines = [],
}: Props) {
  const { colors } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<ActionMenuAnchor | null>(null)
  const menuBtnRef = useRef<View>(null)

  function openMenu() {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height })
      setMenuOpen(true)
    })
  }

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowHeader}>
        <NumberedAvatar number={number} color={avatarColor} bgColor={avatarBgColor} />

        <View style={styles.titleCol}>
          <AppText variant="bodyMedium" numberOfLines={1}>{title}</AppText>

          {pills.length > 0 && (
            <View style={styles.pillRow}>
              {pills.map((pill) => (
                pill.muted ? (
                  <AppText key={pill.key} variant="caption" style={{ color: colors.text.tertiary, fontSize: 11 }}>
                    {pill.label}
                  </AppText>
                ) : (
                  <View key={pill.key} style={[styles.pill, { backgroundColor: pill.bgColor }]}>
                    <AppText variant="caption" style={{ color: pill.color, fontSize: 10, fontWeight: "600" }}>{pill.label}</AppText>
                  </View>
                )
              ))}
            </View>
          )}
        </View>

        {trailing}

        {menuItems.length > 0 && (
          <View ref={menuBtnRef} collapsable={false}>
            <Pressable onPress={openMenu} disabled={isBusy} hitSlop={8} style={styles.menuBtn}>
              {isBusy
                ? <ActivityIndicator size="small" color={colors.text.tertiary} />
                : <MoreVertical size={18} color={colors.text.tertiary} strokeWidth={1.75} />
              }
            </Pressable>
          </View>
        )}
      </View>

      <ActionMenu visible={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} anchor={menuAnchor} />

      {metaLines.length > 0 && (
        <View style={styles.metaCol}>
          {metaLines.map((line, i) => (
            <View key={i} style={styles.rowMeta}>{line}</View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  titleCol: {
    flex: 1,
    gap: spacing[1],
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing[1],
  },
  metaCol: {
    gap: spacing[1],
    marginTop: spacing[2],
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingLeft: 32 + spacing[3],
  },
  pill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  menuBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
  },
})
