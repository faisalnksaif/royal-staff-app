import { useState } from "react"
import { Tabs, useRouter, usePathname } from "expo-router"
import { StyleSheet, View, Pressable, ScrollView, Platform, StatusBar } from "react-native"
import type { ColorValue } from "react-native"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarClock,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native"

const EXPANDED_WIDTH = 240
const COLLAPSED_WIDTH = 60
import { useTheme } from "../../providers/ThemeProvider"
import { colors as palette, spacing, radii } from "../../constants/theme"
import { useTablet } from "../../hooks/useTablet"
import useAuthStore from "../../stores/useAuthStore"
import AppText from "../../components/ui/AppText"

const NAV_ITEMS = [
  { label: "Home",        href: "/(tabs)/",               icon: LayoutDashboard, match: "__home__" },
  { label: "Customers",   href: "/(tabs)/customers",       icon: Users,           match: "customers" },
  { label: "Follow-ups",  href: "/(tabs)/followups",       icon: ClipboardList,   match: "followups" },
  { label: "Leaves",      href: "/(tabs)/leaves",          icon: CalendarClock,   match: "leaves" },
  { label: "Performance", href: "/(tabs)/extra-performance", icon: Award,         match: "extra-performance" },
  { label: "Settings",    href: "/(tabs)/settings",        icon: Settings,        match: "settings" },
]

function StaffSidebar() {
  const { colors } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(match: string) {
    if (match === "__home__") return pathname === "/" || pathname === "/index"
    return pathname.includes(match)
  }

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  const w = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <View style={[styles.sidebar, { width: w, backgroundColor: colors.background.secondary, borderRightColor: colors.border }]}>
      <View style={[styles.brand, { borderBottomColor: colors.border, justifyContent: collapsed ? "center" : "space-between" }]}>
        {!collapsed && (
          <View style={{ flex: 1 }}>
            <AppText variant="heading3" style={{ color: colors.accent }}>RoyalPulse</AppText>
            <AppText variant="caption" color="tertiary">{user?.name ?? "Staff"}</AppText>
          </View>
        )}
        <Pressable onPress={() => setCollapsed(!collapsed)} hitSlop={8}>
          {collapsed
            ? <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.75} />
            : <ChevronLeft size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
      </View>

      <ScrollView style={styles.navScroll} contentContainerStyle={styles.nav} showsVerticalScrollIndicator={false} alwaysBounceVertical={false}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.match)
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
                  <Icon size={20} strokeWidth={active ? 2 : 1.6} color={active ? colors.accent : colors.text.secondary} />
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

export default function TabsLayout() {
  const { colors, isDark } = useTheme()
  const { isTablet } = useTablet()
  const activeColor = isDark ? palette.primary[400] : palette.primary[600]
  const inactiveColor = colors.text.tertiary as string

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isTablet
          ? { display: "none" }
          : {
              backgroundColor: colors.background.secondary,
              borderTopColor: colors.border,
              borderTopWidth: StyleSheet.hairlineWidth,
            },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color as string} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={22} color={color as string} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen name="customers"         options={{ href: null }} />
      <Tabs.Screen name="leaves"            options={{ href: null }} />
      <Tabs.Screen name="extra-performance" options={{ href: null }} />
      <Tabs.Screen name="followups"         options={{ href: null }} />
    </Tabs>
  )

  if (!isTablet) return tabs

  return (
    <View style={[styles.row, { backgroundColor: colors.background.primary }]}>
      <StaffSidebar />
      <View style={styles.main}>{tabs}</View>
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
  logoutBtn: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
