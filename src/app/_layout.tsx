import React, { useEffect } from "react"
import { Stack, router } from "expo-router"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import Toast from "react-native-toast-message"
import { ThemeProvider, useTheme } from "../providers/ThemeProvider"
import { QueryProvider } from "../providers/QueryProvider"
import { toastConfig } from "../components/shared/ToastConfig"
import { fontAssets } from "../constants/fonts"
import { setUnauthorizedHandler } from "../services/apiClient"
import useAuthStore from "../stores/useAuthStore"
import { usePushNotifications } from "../hooks/usePushNotifications"

SplashScreen.preventAutoHideAsync()

function RootStack() {
  const { isDark } = useTheme()
  const user = useAuthStore((s) => s.user)
  usePushNotifications(user != null)

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(manager)" />
        <Stack.Screen name="(super-admin)" />
        <Stack.Screen name="customer" />
        <Stack.Screen name="notifications" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().clearAuth()
      router.replace("/(auth)/login")
    })
  }, [])

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <QueryProvider>
      <ThemeProvider>
        <RootStack />
        <Toast config={toastConfig} position="top" />
      </ThemeProvider>
    </QueryProvider>
  )
}
