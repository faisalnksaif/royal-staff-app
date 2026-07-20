import React from "react"
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import AppToggle from "../../components/ui/AppToggle"
import { useTheme } from "../../providers/ThemeProvider"
import useThemeStore, { type FontSize } from "../../stores/useThemeStore"
import useAuthStore from "../../stores/useAuthStore"
import { APP_CONFIG } from "../../constants/config"
import { spacing } from "../../constants/theme"

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
        {value && <AppText variant="body" color="secondary">{value}</AppText>}
        {right}
      </View>
    </TouchableOpacity>
  )
}

export default function SuperAdminSettingsScreen() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const { theme, setTheme, fontSize, setFontSize } = useThemeStore()
  const { user, logout, isLoading } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppText variant="heading2">Settings</AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="label" color="tertiary" style={styles.sectionLabel}>ACCOUNT</AppText>
        <AppCard elevation="sm" padding={0} style={styles.card}>
          <RowList>
            <SettingRow label="Name" value={user?.fullName ?? "—"} />
            <SettingRow label="Email" value={user?.email ?? "—"} />
            <SettingRow
              label="Role"
              value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"}
            />
          </RowList>
        </AppCard>

        <AppText variant="label" color="tertiary" style={styles.sectionLabel}>APPEARANCE</AppText>
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
            <SettingRow
              label="Font Size"
              right={
                <View style={styles.fontSizePicker}>
                  {(["sm", "md", "lg"] as FontSize[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      activeOpacity={0.7}
                      onPress={() => setFontSize(s)}
                      style={[
                        styles.fontSizeBtn,
                        { borderColor: colors.border, backgroundColor: fontSize === s ? colors.accent : "transparent" },
                      ]}
                    >
                      <AppText variant="caption" style={{ color: fontSize === s ? "#fff" : colors.text.secondary, fontSize: s === "sm" ? 10 : s === "md" ? 12 : 14 }}>
                        A
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              }
            />
          </RowList>
        </AppCard>

        <AppText variant="label" color="tertiary" style={styles.sectionLabel}>ABOUT</AppText>
        <AppCard elevation="sm" padding={0} style={styles.card}>
          <RowList>
            <SettingRow label="App" value={APP_CONFIG.name} />
            <SettingRow label="Company" value={APP_CONFIG.company} />
          </RowList>
        </AppCard>

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
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
    width: "100%",
    alignSelf: "center",
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
  fontSizePicker: { flexDirection: "row", gap: spacing[1] },
  fontSizeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
