import { useState } from "react"
import { View, TextInput, Pressable, StyleSheet } from "react-native"
import { useMutation } from "@tanstack/react-query"
import { Play, CheckCircle2 } from "lucide-react-native"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import Popup from "./Popup"
import { useTheme } from "../../providers/ThemeProvider"
import { workScheduleService } from "../../services/workScheduleService"
import { spacing, radii, colors as palette } from "../../constants/theme"
import type { WorkAssignment, WorkStatus } from "../../types"

/**
 * Assignee-facing status update. `intent` decides the copy and the button -
 * starting work needs no explanation, completing it asks what was done, since
 * that note is what the assigner actually reads.
 */
export default function WorkStatusModal({
  work,
  intent,
  onClose,
  onUpdated,
}: {
  work: WorkAssignment
  intent: Extract<WorkStatus, "in_progress" | "completed">
  onClose: () => void
  onUpdated: () => void
}) {
  const { colors } = useTheme()
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isCompleting = intent === "completed"

  const mutation = useMutation({
    mutationFn: () => workScheduleService.updateStatus(work._id, intent, note.trim() || undefined),
    onSuccess: () => {
      onUpdated()
      onClose()
    },
    onError: (e: any) => setError(e?.message ?? "Could not update this work"),
  })

  return (
    <Popup title={isCompleting ? "Complete work" : "Start work"} onClose={onClose}>
      <View style={[styles.workBox, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.workHeader}>
          {isCompleting ? (
            <CheckCircle2 size={16} color={palette.success.default} strokeWidth={2} />
          ) : (
            <Play size={16} color={palette.info.default} strokeWidth={2} />
          )}
          <AppText variant="bodyMedium" style={{ flex: 1 }} numberOfLines={2}>
            {work.title}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
        {isCompleting ? "What did you do? (optional)" : "Add a note (optional)"}
      </AppText>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any,
        ]}
        placeholder={isCompleting ? "e.g. Stock counted and reconciled" : "e.g. Started, waiting on delivery"}
        placeholderTextColor={colors.text.tertiary}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {error && (
        <View style={[styles.errorBox, { backgroundColor: palette.error.default + "1a" }]}>
          <AppText variant="caption" style={{ color: palette.error.default }}>{error}</AppText>
        </View>
      )}

      <AppButton
        label={mutation.isPending ? "Saving…" : isCompleting ? "Mark Completed" : "Start Work"}
        onPress={() => {
          setError(null)
          mutation.mutate()
        }}
        disabled={mutation.isPending}
        style={{ marginTop: spacing[4] }}
      />
    </Popup>
  )
}

const styles = StyleSheet.create({
  workBox: { padding: spacing[3], borderRadius: radii.md },
  workHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  input: { borderWidth: 1, borderRadius: radii.md, padding: spacing[3], fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  errorBox: { marginTop: spacing[4], padding: spacing[3], borderRadius: radii.md },
})
