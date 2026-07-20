import { useState } from "react"
import { View, Pressable, ScrollView, StyleSheet, Platform, StatusBar } from "react-native"
import { Stack, useRouter, usePathname } from "expo-router"
import { MessageCircleMore, CalendarCheck, CalendarClock, ShieldCheck, Trophy, Award, Users, Settings, LogOut, UsersRound, Bell, ChevronLeft, ChevronRight } from "lucide-react-native"
import { useQuery } from "@tanstack/react-query"
import AppText from "../../components/ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { useRole } from "../../hooks/useRole"
import { spacing, radii } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"
import { notificationService } from "../../services/notificationService"
import type { UserRole } from "../../types"

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 60

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<any>
  matchExact: boolean
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: "Follow Up Dashboard", href: "/(admin)",                   icon: MessageCircleMore, matchExact: true  },
  { label: "Customers",           href: "/(admin)/all-customers",     icon: UsersRound,        matchExact: false },
  { label: "Attendance",          href: "/(admin)/attendance",        icon: CalendarCheck,     matchExact: false },
  { label: "Leaves",              href: "/(admin)/leaves",            icon: CalendarClock,     matchExact: false },
  { label: "Scores",              href: "/(admin)/scores",            icon: Trophy,            matchExact: false },
  { label: "Extra Performance",   href: "/(admin)/extra-performance", icon: Award,             matchExact: false },
  { label: "Mappings",            href: "/(admin)/mappings",          icon: Users,             matchExact: false, roles: ["superAdmin"] },
  { label: "Appearance",          href: "/(admin)/appearance",        icon: ShieldCheck,       matchExact: false, roles: ["superAdmin"] },
  { label: "Settings",            href: "/(admin)/settings",          icon: Settings,          matchExact: false, roles: ["superAdmin"] },
  { label: "Notifications",       href: "/notifications",             icon: Bell,              matchExact: false },
]

function Sidebar() {
  const { colors } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuthStore()
  const { role } = useRole()
  const [collapsed, setCollapsed] = useState(false)

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

  const w = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <View style={[styles.sidebar, { width: w, backgroundColor: colors.background.secondary, borderRightColor: colors.border }]}>
      {/* Brand + toggle */}
      <View style={[styles.brand, { borderBottomColor: colors.border, justifyContent: collapsed ? "center" : "space-between" }]}>
        {!collapsed && (
          <View style={{ flex: 1 }}>
            <AppText variant="heading3" style={{ color: colors.accent }}>RoyalPulse</AppText>
            <AppText variant="caption" color="tertiary">{user?.name ?? "Admin"}</AppText>
          </View>
        )}
        <Pressable onPress={() => setCollapsed(!collapsed)} hitSlop={8}>
          {collapsed
            ? <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.75} />
            : <ChevronLeft size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
      </View>

      {/* Nav */}
      <ScrollView style={styles.navScroll} contentContainerStyle={styles.nav} showsVerticalScrollIndicator={false} alwaysBounceVertical={false}>
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
              {() => (
                <View style={[styles.navItemInner, { justifyContent: collapsed ? "center" : "flex-start" }]}>
                  <View style={{ position: "relative" }}>
                    <Icon size={20} strokeWidth={active ? 2 : 1.6} color={active ? colors.accent : colors.text.secondary} />
                    {item.label === "Notifications" && unreadCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                        <AppText variant="caption" style={{ color: "#fff", fontSize: 9, lineHeight: 13 }}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </AppText>
                      </View>
                    )}
                  </View>
                  {!collapsed && (
                    <AppText variant={active ? "bodyMedium" : "body"} style={{ color: active ? colors.accent : colors.text.secondary }} numberOfLines={1}>
                      {item.label}
                    </AppText>
                  )}
                </View>
              )}
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutBtn, { borderTopColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
      >
        {() => (
          <View style={[styles.navItemInner, { justifyContent: collapsed ? "center" : "flex-start" }]}>
            <LogOut size={18} color={colors.text.tertiary} strokeWidth={1.6} />
            {!collapsed && <AppText variant="body" color="tertiary">Logout</AppText>}
          </View>
        )}
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
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + spacing[4] : spacing[12],
    flexDirection: "column",
    overflow: "hidden",
  },
  main: { flex: 1 },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  navScroll: { flex: 1 },
  nav: { flexDirection: "column", gap: spacing[1], paddingHorizontal: spacing[2], paddingBottom: spacing[4] },
  navItem: { borderRadius: radii.md, width: "100%" },
  navItemInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
