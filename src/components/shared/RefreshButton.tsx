import { ActivityIndicator, Pressable } from "react-native"
import { RefreshCw } from "lucide-react-native"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing } from "../../constants/theme"

interface Props {
  onPress: () => void
  isRefreshing: boolean
}

export default function RefreshButton({ onPress, isRefreshing }: Props) {
  const { colors } = useTheme()
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ padding: spacing[2], cursor: "pointer" } as any}>
      {isRefreshing
        ? <ActivityIndicator size="small" color={colors.accent} />
        : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
    </Pressable>
  )
}
