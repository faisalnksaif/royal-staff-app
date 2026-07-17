import { Tabs } from "expo-router"
import { StyleSheet } from "react-native"
import type { ColorValue } from "react-native"
import { LayoutDashboard, Settings } from "lucide-react-native"
import { useTheme } from "../../providers/ThemeProvider"
import { colors as palette } from "../../constants/theme"

export default function TabsLayout() {
  const { colors, isDark } = useTheme()
  const activeColor = isDark ? palette.primary[400] : palette.primary[600]
  const inactiveColor = colors.text.tertiary as string

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
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
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={22} color={color as string} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Settings size={22} color={color as string} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="leaves" options={{ href: null }} />
      <Tabs.Screen name="extra-performance" options={{ href: null }} />
    </Tabs>
  )
}
