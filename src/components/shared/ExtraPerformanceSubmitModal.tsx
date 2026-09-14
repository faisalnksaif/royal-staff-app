import { useState } from "react"
import { View, StyleSheet, Pressable, TextInput, ScrollView } from "react-native"
import { useMutation } from "@tanstack/react-query"
import moment from "moment"
import Popup from "./Popup"
import DatePickerField from "./DatePickerField"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { extraPerformanceService } from "../../services/extraPerformanceService"
import type { ExtraPerformanceCategory } from "../../types"

const CATEGORIES: ExtraPerformanceCategory[] = [
  "Training",
  "Process Improvement",
  "Customer Excellence",
  "Team Leadership",
  "Other",
]

/**
 * Log an extra-performance entry for yourself. Shared by the staff screen and
 * the admin review screen - the backend records it against the authenticated
 * user, so an admin using this logs their own entry, not a staff member's.
 */
export default function ExtraPerformanceSubmitModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { colors } = useTheme()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [category, setCategory] = useState<ExtraPerformanceCategory>("Training")
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: () => extraPerformanceService.submitPerformance({
      title: title.trim(),
      description: description.trim(),
      date: moment(date).format("YYYY-MM-DD"),
      category,
    }),
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (e) => setError((e as Error).message ?? "Submission failed"),
  })

  function reset() {
    setTitle(""); setDescription(""); setDate(null); setCategory("Training"); setError("")
  }

  function validate() {
    if (!title.trim()) return "Please provide a title"
    if (!description.trim()) return "Please describe what you accomplished"
    if (!date) return "Please select the date it occurred"
    return null
  }

  function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    mutation.mutate()
  }

  if (!visible) return null

  return (
    <Popup title="Add Extra Performance" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category */}
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Category</AppText>
        <View style={styles.typeRow}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[
                styles.typeChip,
                {
                  borderColor: category === c ? colors.accent : colors.border,
                  backgroundColor: category === c ? colors.accent + "18" : "transparent",
                },
              ]}
            >
              <AppText
                variant={category === c ? "bodyMedium" : "body"}
                style={{ color: category === c ? colors.accent : colors.text.secondary }}
              >
                {c}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Title */}
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Title</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="e.g. Led customer training session"
          placeholderTextColor={colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        {/* Date */}
        <View style={styles.fieldLabel}>
          <DatePickerField
            label="Date"
            value={date}
            onChange={setDate}
            placeholder="Select date"
          />
        </View>

        {/* Description */}
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Description</AppText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="Describe what you accomplished..."
          placeholderTextColor={colors.text.tertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[3] }}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          label={mutation.isPending ? "Submitting…" : "Submit for Approval"}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          style={{ marginTop: spacing[4] }}
        />
        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </Popup>
  )
}

const styles = StyleSheet.create({
  fieldLabel: { marginTop: spacing[1], marginBottom: spacing[2] },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginBottom: spacing[1] },
  typeChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    marginBottom: spacing[1],
  },
  textArea: { minHeight: 80 },
})
