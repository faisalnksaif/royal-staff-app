import { View, Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { CalendarCheck, CalendarClock, ShieldCheck, Trophy, Award, LogOut } from "lucide-react-native"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii, colors as palette } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"

function MenuCard({
  icon,
  label,
  description,
  onPress,
  accent,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onPress: () => void
  accent: string
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <AppCard elevation="sm" style={[styles.menuCard, { opacity: pressed ? 0.7 : 1 }]}>
          <View style={[styles.menuIconWrap, { backgroundColor: accent + "22" }]}>
            {icon}
          </View>
          <View style={styles.menuText}>
            <AppText variant="bodyMedium">{label}</AppText>
            <AppText variant="caption" color="secondary">{description}</AppText>
          </View>
        </AppCard>
      )}
    </Pressable>
  )
}

export default function SuperAdminHome() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <AppText variant="heading2">Dashboard</AppText>
          <AppText variant="caption" color="secondary">
            {user?.fullName ?? "Super Admin"}
          </AppText>
        </View>
        {!isTablet && (
          <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
            <LogOut size={20} color={colors.text.tertiary} strokeWidth={1.75} />
          </Pressable>
        )}
      </View>

      <View style={[styles.grid, isTablet && styles.gridTablet]}>
        <MenuCard
          icon={<CalendarCheck size={26} color={colors.accent} strokeWidth={1.5} />}
          label="Attendance"
          description="View and manage staff attendance"
          onPress={() => router.push("/(super-admin)/attendance")}
          accent={colors.accent}
        />
        <MenuCard
          icon={<CalendarClock size={26} color={palette.warning.default} strokeWidth={1.5} />}
          label="Leave Requests"
          description="Approve or reject staff leave requests"
          onPress={() => router.push("/(super-admin)/leaves")}
          accent={palette.warning.default}
        />
        <MenuCard
          icon={<ShieldCheck size={26} color={palette.success.default} strokeWidth={1.5} />}
          label="Appearance"
          description="Daily uniform & grooming compliance check"
          onPress={() => router.push("/(super-admin)/appearance")}
          accent={palette.success.default}
        />
        <MenuCard
          icon={<Trophy size={26} color={palette.info?.default ?? "#6366F1"} strokeWidth={1.5} />}
          label="Scores"
          description="Monthly staff performance scores"
          onPress={() => router.push("/(super-admin)/scores")}
          accent={palette.info?.default ?? "#6366F1"}
        />
        <MenuCard
          icon={<Award size={26} color={palette.success.default} strokeWidth={1.5} />}
          label="Extra Performance"
          description="Approve staff achievements for bonus points"
          onPress={() => router.push("/(super-admin)/extra-performance")}
          accent={palette.success.default}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoutBtn: {
    padding: spacing[2],
  },
  grid: {
    padding: spacing[4],
    gap: spacing[3],
  },
  gridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing[6],
    gap: spacing[4],
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    padding: spacing[4],
  },
  menuIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    gap: spacing[1],
  },
})
