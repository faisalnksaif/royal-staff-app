import { View, Pressable, StyleSheet } from "react-native"
import { Stack, useRouter, usePathname } from "expo-router"
import { MessageCircleMore, CalendarCheck, CalendarClock, ShieldCheck, Trophy, Award, Users, Settings, LogOut, UsersRound, Bell } from "lucide-react-native"
import { useQuery } from "@tanstack/react-query"
import AppText from "../../components/ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { useRole } from "../../hooks/useRole"
import { spacing, radii } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"
import { notificationService } from "../../services/notificationService"
import type { UserRole } from "../../types"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<any>
  matchExact: boolean
  roles?: UserRole[]  // undefined = visible to all admin roles
}

const NAV_ITEMS: NavItem[] = [
  { label: "Follow Up Dashboard", href: "/(admin)",                  icon: MessageCircleMore, matchExact: true  },
  { label: "Customers",         href: "/(admin)/all-customers",    icon: UsersRound,      matchExact: false },
  { label: "Attendance",        href: "/(admin)/attendance",       icon: CalendarCheck,   matchExact: false },
  { label: "Leaves",            href: "/(admin)/leaves",           icon: CalendarClock,   matchExact: false },
  { label: "Scores",            href: "/(admin)/scores",           icon: Trophy,          matchExact: false },
  { label: "Extra Performance", href: "/(admin)/extra-performance",icon: Award,           matchExact: false },
  { label: "Mappings",          href: "/(admin)/mappings",         icon: Users,           matchExact: false, roles: ["superAdmin"] },
  { label: "Appearance",        href: "/(admin)/appearance",       icon: ShieldCheck,     matchExact: false, roles: ["superAdmin"] },
  { label: "Settings",          href: "/(admin)/settings",         icon: Settings,        matchExact: false, roles: ["superAdmin"] },
  { label: "Notifications",     href: "/notifications",            icon: Bell,            matchExact: false },
]

function Sidebar() {
  const { colors } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuthStore()
  const { role } = useRole()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count", user?.user_id],
    queryFn: () => notificationService.getUnreadCount(user!.user_id!),
    enabled: user?.user_id != null,
    refetchInterval: 60_000,
  })

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  )

  function isActive(item: NavItem) {
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
        <AppText variant="caption" color="tertiary">{user?.fullName ?? user?.name ?? "Admin"}</AppText>
      </View>

      {/* Nav */}
      <View style={styles.nav}>
        {visibleItems.map((item) => {
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
                  <View style={{ position: "relative" }}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.6}
                  color={active ? colors.accent : colors.text.secondary}
                />
                {item.label === "Notifications" && unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <AppText variant="caption" style={{ color: "#fff", fontSize: 9, lineHeight: 13 }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </AppText>
                  </View>
                )}
              </View>
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

export default function AdminLayout() {
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
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
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
