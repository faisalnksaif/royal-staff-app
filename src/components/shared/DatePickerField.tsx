import React, { useState } from "react"
import { View, Pressable, TouchableOpacity, StyleSheet, Modal, Platform } from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { CalendarDays } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"
import { fontFamilies } from "../../constants/fonts"
import { toAPIDate, formatDisplayDate } from "../../utils/helpers"

interface DatePickerFieldProps {
  label?: string
  value: Date | null
  onChange: (d: Date) => void
  placeholder?: string
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select date",
}: DatePickerFieldProps) {
  const { colors, isDark } = useTheme()
  const [iosVisible, setIosVisible] = useState(false)
  const [iosTempDate, setIosTempDate] = useState<Date>(value ?? new Date())
  const webInputRef = React.useRef<HTMLInputElement | null>(null)
  const webFieldRef = React.useRef<View>(null)

  const displayText = value ? formatDisplayDate(value) : ""

  function handleOpen() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: "date",
        onChange: (_, d) => { if (d) onChange(d) },
      })
    } else if (Platform.OS === "ios") {
      setIosTempDate(value ?? new Date())
      setIosVisible(true)
    }
  }

  if (Platform.OS === "web") {
    const isoValue = value ? toAPIDate(value) : ""

    function openWebPicker() {
      const el = webInputRef.current
      if (!el) return
      // Read the field's screen position synchronously and move the input there
      // so Chrome anchors the date picker popup at the correct location.
      const domNode = webFieldRef.current as unknown as HTMLElement
      if (domNode?.getBoundingClientRect) {
        const rect = domNode.getBoundingClientRect()
        el.style.position = "fixed"
        el.style.top = `${rect.top}px`
        el.style.left = `${rect.left}px`
        el.style.width = `${rect.width}px`
        el.style.height = `${rect.height}px`
      }
      try {
        ;(el as any).showPicker()
      } catch {
        el.click()
      }
    }

    return (
      <View style={styles.wrapper}>
        {label && (
          <AppText variant="label" color="secondary" style={{ marginBottom: 2 }}>
            {label}
          </AppText>
        )}
        <Pressable
          ref={webFieldRef}
          onPress={openWebPicker}
          style={({ pressed }) => [
            styles.row,
            {
              borderColor: pressed ? colors.accent : colors.border,
              backgroundColor: colors.background.secondary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <CalendarDays size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          <AppText
            variant="body"
            style={{ flex: 1, color: displayText ? colors.text.primary : colors.text.tertiary }}
          >
            {displayText || placeholder}
          </AppText>
        </Pressable>

        {/* Hidden input — repositioned to field coords before showPicker() */}
        {React.createElement("input", {
          ref: webInputRef,
          type: "date",
          value: isoValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.value) onChange(new Date(e.target.value + "T12:00:00"))
          },
          style: {
            position: "fixed",
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

  return (
    <>
      <View style={styles.wrapper}>
        {label && (
          <AppText variant="label" color="secondary" style={{ marginBottom: 2 }}>
            {label}
          </AppText>
        )}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpen}
          style={[
            styles.row,
            {
              borderColor: iosVisible ? colors.accent : colors.border,
              backgroundColor: colors.background.secondary,
            },
          ]}
        >
          <CalendarDays size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          <AppText
            variant="body"
            style={{ flex: 1, color: displayText ? colors.text.primary : colors.text.tertiary }}
          >
            {displayText || placeholder}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* iOS bottom-sheet spinner */}
      {Platform.OS === "ios" && (
        <Modal
          transparent
          visible={iosVisible}
          animationType="slide"
          onRequestClose={() => setIosVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setIosVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background.secondary, borderTopColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <DateTimePicker
              mode="date"
              value={iosTempDate}
              display="spinner"
              onChange={(_, d) => { if (d) setIosTempDate(d) }}
              themeVariant={isDark ? "dark" : "light"}
              style={{ width: "100%", height: 200 }}
            />
            <Pressable
              onPress={() => { onChange(iosTempDate); setIosVisible(false) }}
              style={[styles.doneBtn, { backgroundColor: colors.accent }]}
            >
              <AppText variant="bodyMedium" style={{ color: "#FFFFFF" }}>Done</AppText>
            </Pressable>
          </View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[1] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    height: 48,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    alignItems: "center",
  },
  handle: { width: 40, height: 4, borderRadius: 2, marginBottom: spacing[4] },
  doneBtn: {
    width: "100%",
    height: 52,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
  },
  // Referenced in followup.tsx for the text input (kept for compat)
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontFamily: fontFamilies.sans.regular,
    ...({ outlineStyle: "none" } as object),
  },
})
