import { useState } from "react"
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import AppInput from "../../components/ui/AppInput"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import useAuthStore from "../../stores/useAuthStore"
import useThemeStore from "../../stores/useThemeStore"
import { APP_CONFIG } from "../../constants/config"
import { spacing, colors as palette } from "../../constants/theme"

export default function LoginScreen() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const { login, isLoading, error, clearError } = useAuthStore()
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin() {
    clearError()
    await login(email, password)
    if (useAuthStore.getState().user) {
      router.replace("/(tabs)")
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Theme toggle */}
        <Pressable style={styles.themeToggle} onPress={toggleTheme}>
          <AppText variant="caption" color="tertiary">
            {isDark ? "☀ Light" : "☾ Dark"}
          </AppText>
        </Pressable>

        {/* Branding */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.branding}
        >
          <View
            style={[
              styles.logoBox,
              {
                backgroundColor: isDark
                  ? palette.primary[900]
                  : palette.primary[600],
              },
            ]}
          >
            <AppText variant="heading2" style={{ color: "#fff" }}>
              {APP_CONFIG.name.slice(0, 1)}
            </AppText>
          </View>
          <AppText variant="heading1">{APP_CONFIG.name}</AppText>
          <AppText variant="body" color="secondary">
            {APP_CONFIG.company} Staff Monitoring
          </AppText>
        </MotiView>

        {/* Form card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 100 }}
          style={styles.cardWrapper}
        >
          <AppCard elevation="md" padding={6}>
            <AppText variant="heading3" style={styles.cardTitle}>
              Sign in
            </AppText>

            {error && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: palette.error.light },
                ]}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: palette.error.dark }}
                >
                  {error}
                </AppText>
              </View>
            )}

            <View style={styles.fields}>
              <AppInput
                label="Email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t)
                  clearError()
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                returnKeyType="next"
              />
              <AppInput
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t)
                  clearError()
                }}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                rightIcon={
                  <Pressable
                    hitSlop={8}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <AppText variant="caption" color="accent">
                      {showPassword ? "Hide" : "Show"}
                    </AppText>
                  </Pressable>
                }
              />
            </View>

            <AppButton
              label="Sign In"
              isLoading={isLoading}
              onPress={handleLogin}
              style={styles.submitBtn}
              size="lg"
            />
          </AppCard>
        </MotiView>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
    gap: spacing[6],
  },
  themeToggle: {
    position: "absolute",
    top: spacing[6],
    right: spacing[6],
    padding: spacing[2],
  },
  branding: { alignItems: "center", gap: spacing[2] },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  cardWrapper: { width: "100%", maxWidth: 440 },
  cardTitle: { marginBottom: spacing[4] },
  errorBanner: {
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  fields: { gap: spacing[4], marginBottom: spacing[6] },
  submitBtn: { width: "100%" },
})
