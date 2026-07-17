import React from "react"
import { View, StyleSheet } from "react-native"
import { useTablet } from "../../hooks/useTablet"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing } from "../../constants/theme"

interface TabletLayoutProps {
  sidebar: React.ReactNode
  main: React.ReactNode
}

export default function TabletLayout({ sidebar, main }: TabletLayoutProps) {
  const { isTablet } = useTablet()
  const { colors } = useTheme()

  if (!isTablet) {
    return (
      <View style={[styles.fullscreen, { backgroundColor: colors.background.primary }]}>
        {main}
      </View>
    )
  }

  return (
    <View style={[styles.row, { backgroundColor: colors.background.primary }]}>
      <View
        style={[
          styles.sidebar,
          { backgroundColor: colors.background.secondary, borderRightColor: colors.border },
        ]}
      >
        {sidebar}
      </View>
      <View style={styles.main}>{main}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1 },
  row: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 280,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing[4],
  },
  main: { flex: 1 },
})
