import { View, Pressable, StyleSheet } from "react-native"
import { Stack, useRouter, usePathname } from "expo-router"
import { LayoutDashboard, CalendarCheck, CalendarClock, ShieldCheck, Trophy, Award, LogOut } from "lucide-react-native"
import AppText from "../../components/ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/(super-admin)",
    icon: LayoutDashboard,
    matchExact: true,
  },
  {
    label: "Attendance",
    href: "/(super-admin)/attendance",
    icon: CalendarCheck,
    matchExact: false,
  },
  {
    label: "Leaves",
    href: "/(super-admin)/leaves",
    icon: CalendarClock,
    matchExact: false,
  },
  {
    label: "Appearance",
    href: "/(super-admin)/appearance",
    icon: ShieldCheck,
    matchExact: false,
  },
  {
    label: "Scores",
    href: "/(super-admin)/scores",
    icon: Trophy,
    matchExact: false,
  },
  {
    label: "Extra Performance",
    href: "/(super-admin)/extra-performance",
    icon: Award,
    matchExact: false,
  },
]

function Sidebar() {
  const { colors } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuthStore()

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.matchExact) return pathname === "/" || pathname === "/index"
    return pathname.includes(item.href.split("/").pop() ?? "")
  }

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.background.secondary, borderRightColor: colors.border }]}>
      {/* Brand */}
      <View style={[styles.brand, { borderBottomColor: colors.border }]}>
        <AppText variant="heading3" style={{ color: colors.accent }}>RoyalPulse</AppText>
        <AppText variant="caption" color="tertiary">{user?.fullName ?? "Super Admin"}</AppText>
      </View>

      {/* Nav */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={({ pressed }) => [
                styles.navItem,
                active && { backgroundColor: colors.accent + "18" },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.6}
                color={active ? colors.accent : colors.text.secondary}
              />
              <AppText
                variant={active ? "bodyMedium" : "body"}
                style={{ color: active ? colors.accent : colors.text.secondary }}
              >
                {item.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutBtn, { borderTopColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
      >
        <LogOut size={18} color={colors.text.tertiary} strokeWidth={1.6} />
        <AppText variant="body" color="tertiary">Logout</AppText>
      </Pressable>
    </View>
  )
}

export default function SuperAdminLayout() {
  const { isTablet } = useTablet()
  const { colors } = useTheme()

  if (!isTablet) {
    return <Stack screenOptions={{ headerShown: false }} />
  }

  return (
    <View style={[styles.row, { backgroundColor: colors.background.primary }]}>
      <Sidebar />
      <View style={styles.main}>
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 240,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[12],
  },
  main: { flex: 1 },
  brand: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  nav: { gap: spacing[1], paddingHorizontal: spacing[3] },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
  },
  logoutBtn: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
