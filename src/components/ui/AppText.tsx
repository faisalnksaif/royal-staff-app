import React from "react"
import { Text, TextProps } from "react-native"
import { fontScale, type FontVariant } from "../../constants/fonts"
import useThemeStore, { FONT_SIZE_SCALE } from "../../stores/useThemeStore"
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
  const fontSize = useThemeStore((s) => s.fontSize)
  const palette = resolvedTheme === "dark" ? darkTheme : lightTheme
  const textColor = color === "accent" ? palette.accent : palette.text[color]
  const scale = FONT_SIZE_SCALE[fontSize]
  const base = fontScale[variant]

  return (
    <Text
      style={[
        base,
        { fontSize: base.fontSize * scale, lineHeight: base.lineHeight * scale, color: textColor },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}
