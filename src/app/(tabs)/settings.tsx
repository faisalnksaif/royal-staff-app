import React from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useTablet } from "../../hooks/useTablet"
import AppToggle from "../../components/ui/AppToggle"
import { useRouter } from "expo-router"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import useThemeStore from "../../stores/useThemeStore"
import useAuthStore from "../../stores/useAuthStore"
import { APP_CONFIG } from "../../constants/config"
import { spacing } from "../../constants/theme"

// Renders children with a separator between each pair — last item gets no border
function RowList({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  const items = React.Children.toArray(children)
  return (
    <>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {child}
          {i < items.length - 1 && (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
        </React.Fragment>
      ))}
    </>
  )
}

function SettingRow({
  label,
  value,
  onPress,
  right,
}: {
  label: string
  value?: string
  onPress?: () => void
  right?: React.ReactNode
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={styles.row}
    >
      <AppText variant="body">{label}</AppText>
      <View style={styles.rowRight}>
        {value && (
          <AppText variant="body" color="secondary">
            {value}
          </AppText>
        )}
        {right}
      </View>
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const { isTablet } = useTablet()
  const { theme, setTheme } = useThemeStore()
  const { user, logout, isLoading } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppText variant="heading2">Settings</AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account */}
        <AppText variant="label" color="tertiary" style={styles.sectionLabel}>
          ACCOUNT
        </AppText>
        <AppCard elevation="sm" padding={0} style={styles.card}>
          <RowList>
            <SettingRow label="Name" value={user?.name ?? "—"} />
            <SettingRow label="Email" value={user?.email ?? "—"} />
            <SettingRow
              label="Role"
              value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"}
            />
          </RowList>
        </AppCard>

        {/* Appearance */}
        <AppText variant="label" color="tertiary" style={styles.sectionLabel}>
          APPEARANCE
        </AppText>
        <AppCard elevation="sm" padding={0} style={styles.card}>
          <RowList>
            <SettingRow
              label="Dark Mode"
              right={
                <AppToggle
                  value={isDark}
                  onValueChange={(v: boolean) => setTheme(v ? "dark" : "light")}
                />
              }
            />
            <SettingRow
              label="Follow System Theme"
              right={
                <AppToggle
                  value={theme === "system"}
                  onValueChange={(v: boolean) => setTheme(v ? "system" : isDark ? "dark" : "light")}
                />
              }
            />
          </RowList>
        </AppCard>

        {/* App info */}
        <AppText variant="label" color="tertiary" style={styles.sectionLabel}>
          ABOUT
        </AppText>
        <AppCard elevation="sm" padding={0} style={styles.card}>
          <RowList>
            <SettingRow label="App" value={APP_CONFIG.name} />
            <SettingRow label="Company" value={APP_CONFIG.company} />
          </RowList>
        </AppCard>

        {/* Logout */}
        <AppButton
          label="Log Out"
          variant="destructive"
          isLoading={isLoading}
          onPress={handleLogout}
          style={styles.logoutBtn}
          size="lg"
        />
      </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mobileContent: { flex: 1 },
  desktopContent: { flex: 1 },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[2],
  },
  sectionLabel: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  card: { overflow: "hidden", padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  separator: { height: StyleSheet.hairlineWidth },
  rowRight: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  logoutBtn: { marginTop: spacing[6] },
})
