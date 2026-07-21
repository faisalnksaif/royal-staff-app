import { Pressable } from "react-native"
import { Menu } from "lucide-react-native"
import { useTheme } from "../../providers/ThemeProvider"
import { useAdminDrawer } from "../../contexts/adminDrawer"
import { useTablet } from "../../hooks/useTablet"
import { spacing } from "../../constants/theme"

export default function DrawerMenuButton() {
  const { colors } = useTheme()
  const { openDrawer } = useAdminDrawer()
  const { isTablet } = useTablet()
  if (isTablet) return null
  return (
    <Pressable onPress={openDrawer} hitSlop={8} style={{ paddingRight: spacing[1] }}>
      <Menu size={20} color={colors.text.primary as string} strokeWidth={1.75} />
    </Pressable>
  )
}
