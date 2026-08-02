import React, { useRef } from "react"
import { View, Pressable, Platform, StyleSheet } from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import moment from "moment"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"

function toDate(value: string): Date {
  const [h, m] = value.split(":").map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

export default function TimeInput({
  label, value, onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const { colors, isDark } = useTheme()
  const webInputRef = useRef<HTMLInputElement | null>(null)
  const dateValue = toDate(value)

  function open() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: "time",
        is24Hour: true,
        onChange: (_, d) => { if (d) onChange(moment(d).format("HH:mm")) },
      })
    } else if (Platform.OS === "web") {
      try {
        (webInputRef.current as any)?.showPicker?.()
      } catch {
        webInputRef.current?.click()
      }
    }
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[1] }}>{label}</AppText>
      {Platform.OS === "ios" ? (
        <View style={[styles.field, { borderColor: colors.border as string, paddingHorizontal: spacing[2] }]}>
          <DateTimePicker
            mode="time"
            value={dateValue}
            display="compact"
            onChange={(_, d) => { if (d) onChange(moment(d).format("HH:mm")) }}
          />
        </View>
      ) : (
        <Pressable onPress={open} style={[styles.field, { borderColor: colors.border as string }]}>
          <AppText variant="body">{value || "Not set"}</AppText>
        </Pressable>
      )}
      {Platform.OS === "web" &&
        React.createElement("input", {
          ref: webInputRef,
          type: "time",
          value,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.value) onChange(e.target.value)
          },
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            opacity: 0,
            colorScheme: isDark ? "dark" : "light",
          },
        })}
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
  },
})
