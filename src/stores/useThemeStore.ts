import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance } from "react-native"
import type { Theme } from "../types"

interface ThemeState {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light"
  }
  return theme
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: resolveTheme("system"),
      setTheme: (theme) =>
        set({ theme, resolvedTheme: resolveTheme(theme) }),
      toggleTheme: () => {
        const next = get().resolvedTheme === "light" ? "dark" : "light"
        set({ theme: next, resolvedTheme: next })
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export default useThemeStore
