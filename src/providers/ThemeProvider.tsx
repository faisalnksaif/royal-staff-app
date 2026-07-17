import React, { createContext, useContext, useEffect } from "react"
import { Appearance } from "react-native"
import useThemeStore from "../stores/useThemeStore"
import { lightTheme, darkTheme, type ThemeColors } from "../constants/theme"

interface ThemeContextValue {
  colors: ThemeColors
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightTheme,
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, setTheme } = useThemeStore()

  useEffect(() => {
    if (theme !== "system") return
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme("system")
    })
    return () => sub.remove()
  }, [theme, setTheme])

  const isDark = resolvedTheme === "dark"
  const colors = isDark ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
