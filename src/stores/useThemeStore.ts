import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance } from "react-native"
import type { Theme } from "../types"

export type FontSize = "sm" | "md" | "lg"

export const FONT_SIZE_SCALE: Record<FontSize, number> = {
  sm: 0.9,
  md: 1.0,
  lg: 1.15,
}

interface ThemeState {
  theme: Theme
  resolvedTheme: "light" | "dark"
  fontSize: FontSize
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setFontSize: (size: FontSize) => void
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
      fontSize: "md" as FontSize,
      setTheme: (theme) =>
        set({ theme, resolvedTheme: resolveTheme(theme) }),
      toggleTheme: () => {
        const next = get().resolvedTheme === "light" ? "dark" : "light"
        set({ theme: next, resolvedTheme: next })
      },
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

export default useThemeStore
