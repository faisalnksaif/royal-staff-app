import React, { useState } from "react"
import {
  TextInput,
  TextInputProps,
  View,
  Pressable,
  StyleSheet,
} from "react-native"
import AppText from "./AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { radii, spacing } from "../../constants/theme"
import { fontFamilies } from "../../constants/fonts"

interface AppInputProps extends TextInputProps {
  label?: string
  error?: string
  rightIcon?: React.ReactNode
}

export default function AppInput({
  label,
  error,
  rightIcon,
  style,
  ...props
}: AppInputProps) {
  const { colors } = useTheme()
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? "#EF4444"
    : focused
    ? colors.accent
    : colors.border

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText variant="label" color="secondary" style={styles.label}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: colors.background.secondary,
          },
          // A multiline field can't live in the fixed-height, vertically
          // centred row a single-line one uses: the text grows downward from
          // the top, so the row grows with it and the caret starts at the top
          // edge. Without this the content overflows the 48px row and spills
          // over the label above it.
          props.multiline && styles.inputRowMultiline,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            props.multiline && styles.inputMultiline,
            { color: colors.text.primary },
            style,
          ]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical={props.multiline ? "top" : undefined}
          {...props}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {error && (
        <AppText variant="caption" style={[styles.error, { color: "#EF4444" }]}>
          {error}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1] },
  label: { marginBottom: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    height: 48,
  },
  inputRowMultiline: {
    alignItems: "flex-start",
    height: undefined,
    minHeight: 96,
    paddingVertical: spacing[3],
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontFamily: fontFamilies.sans.regular,
    ...({ outlineStyle: "none" } as object),
  },
  inputMultiline: {
    height: undefined,
    alignSelf: "stretch",
    paddingTop: 0,
    ...({ resize: "none" } as object),
  },
  icon: { marginLeft: spacing[2] },
  error: { marginTop: 2 },
})
