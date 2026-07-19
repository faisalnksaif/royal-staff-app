import { Pressable } from "react-native"
import { useRouter, useNavigation } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing } from "../../constants/theme"

interface BackButtonProps {
  color?: string
}

export default function BackButton({ color }: BackButtonProps) {
  const router = useRouter()
  const navigation = useNavigation()
  const { colors } = useTheme()

  if (!navigation.canGoBack()) return null

  return (
    <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: spacing[2], cursor: "pointer" }}>
      <ChevronLeft size={24} color={color ?? colors.text.primary} strokeWidth={1.75} />
    </Pressable>
  )
}
