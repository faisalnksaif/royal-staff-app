import { View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { LayoutDashboard } from "lucide-react-native"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"

export default function ManagerDashboard() {
  const { colors } = useTheme()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSubtle }]}>
          <LayoutDashboard size={40} color={colors.accent} strokeWidth={1.5} />
        </View>
        <AppText variant="heading2">Manager Dashboard</AppText>
        <AppText variant="body" color="secondary" style={styles.sub}>
          Welcome{user?.name ? `, ${user.name}` : ""}. Manager views are coming soon.
        </AppText>
      </View>

      <View style={styles.footer}>
        <AppButton
          label="Log Out"
          variant="destructive"
          onPress={handleLogout}
          size="lg"
          style={styles.logoutBtn}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  sub: { textAlign: "center" },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  logoutBtn: { width: "100%" },
})
