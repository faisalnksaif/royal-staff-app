import React from "react"
import { View, ViewProps, StyleSheet } from "react-native"
import { useTheme } from "../../providers/ThemeProvider"
import { radii, shadows, spacing } from "../../constants/theme"

interface AppCardProps extends ViewProps {
  elevation?: "sm" | "md" | "lg" | "none"
  padding?: keyof typeof spacing
}

export default function AppCard({
  elevation = "sm",
  padding = 4,
  style,
  children,
  ...props
}: AppCardProps) {
  const { colors } = useTheme()
  const shadow = elevation === "none" ? {} : shadows[elevation]

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: spacing[padding],
        },
        shadow,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
})
