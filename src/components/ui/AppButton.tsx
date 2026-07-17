import React from "react"
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
} from "react-native"
import AppText from "./AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { colors, radii, spacing } from "../../constants/theme"

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive"

interface AppButtonProps extends TouchableOpacityProps {
  label: string
  variant?: ButtonVariant
  isLoading?: boolean
  size?: "sm" | "md" | "lg"
}

export default function AppButton({
  label,
  variant = "primary",
  isLoading = false,
  size = "md",
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const { colors: themeColors, isDark } = useTheme()

  const bg = {
    primary: isDark ? colors.primary[400] : colors.primary[600],
    secondary: themeColors.background.secondary,
    ghost: "transparent",
    destructive: colors.error.default,
  }[variant]

  const isGhost = variant === "ghost"
  const labelColor: "inverse" | "primary" =
    variant === "primary" || variant === "destructive" ? "inverse" : "primary"

  const height = { sm: 36, md: 44, lg: 52 }[size]

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          height,
        },
        variant === "secondary" && {
          borderWidth: 1,
          borderColor: themeColors.border,
        },
        disabled && styles.disabled,
        style as object,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={themeColors.text[labelColor]} size="small" />
      ) : (
        <AppText variant="bodyMedium" color={isGhost ? "accent" : labelColor}>
          {label}
        </AppText>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing[6],
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },
  disabled: {
    opacity: 0.5,
  },
})
