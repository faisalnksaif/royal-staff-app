import React from "react"
import { Text, TextProps, StyleSheet, useWindowDimensions } from "react-native"
import { fontScale, type FontVariant } from "../../constants/fonts"
import useThemeStore, { FONT_SIZE_SCALE } from "../../stores/useThemeStore"
import { lightTheme, darkTheme } from "../../constants/theme"

const LARGE_SCREEN_BREAKPOINT = 1200
const LARGE_SCREEN_SCALE = 1

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
  const fontSize = useThemeStore((s) => s.fontSize)
  const { width } = useWindowDimensions()
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT
  const palette = resolvedTheme === "dark" ? darkTheme : lightTheme
  const textColor = color === "accent" ? palette.accent : palette.text[color]
  const scale = FONT_SIZE_SCALE[fontSize] * (isLargeScreen ? LARGE_SCREEN_SCALE : 1)
  const base = fontScale[variant]
  const flatStyle = StyleSheet.flatten(style) ?? {}
  const { fontSize: overrideFontSize, lineHeight: overrideLineHeight, ...restStyle } = flatStyle

  return (
    <Text
      style={[
        base,
        {
          fontSize: (overrideFontSize ?? base.fontSize) * scale,
          lineHeight: (overrideLineHeight ?? base.lineHeight) * scale,
          color: textColor,
        },
        restStyle,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}
