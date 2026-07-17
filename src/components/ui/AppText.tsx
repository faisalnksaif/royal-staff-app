import React from "react"
import { Text, TextProps, StyleSheet } from "react-native"
import { fontScale, type FontVariant } from "../../constants/fonts"
import useThemeStore from "../../stores/useThemeStore"
import { lightTheme, darkTheme } from "../../constants/theme"

interface AppTextProps extends TextProps {
  variant?: FontVariant
  color?: "primary" | "secondary" | "tertiary" | "inverse" | "accent"
}

export default function AppText({
  variant = "body",
  color = "primary",
  style,
  children,
  ...props
}: AppTextProps) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  const palette = resolvedTheme === "dark" ? darkTheme : lightTheme
  const textColor =
    color === "accent" ? palette.accent : palette.text[color]

  return (
    <Text
      style={[fontScale[variant], { color: textColor }, style]}
      {...props}
    >
      {children}
    </Text>
  )
}
