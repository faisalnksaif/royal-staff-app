import { useState, useMemo } from "react"
import { View, ActivityIndicator, StyleSheet, Pressable, TextInput, ScrollView } from "react-native"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Search } from "lucide-react-native"
import Popup from "./Popup"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { testimonialService } from "../../services/testimonialService"
import { staffService } from "../../services/staffService"
import useAuthStore from "../../stores/useAuthStore"
import type { StaffOption } from "../../types"

/**
 * Write a testimonial about a colleague. Shared by the staff screen and the
 * admin review screen - the backend takes the reviewer from the authenticated
 * user and applies no role check, so the same form serves both.
 */
export default function TestimonialSubmitModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState("")
  const [reviewee, setReviewee] = useState<StaffOption | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-options"],
    queryFn: () => staffService.getStaffOptions(),
    enabled: visible,
  })

  const colleagues = useMemo(
    () => (staffData?.data ?? []).filter((s) => s.name.toLowerCase() !== (user?.name ?? "").toLowerCase()),
    [staffData, user]
  )

  const filteredColleagues = useMemo(() => {
    if (!search.trim()) return colleagues
    const q = search.trim().toLowerCase()
    return colleagues.filter((s) => s.name.toLowerCase().includes(q))
  }, [colleagues, search])

  const mutation = useMutation({
    mutationFn: () =>
      testimonialService.submitTestimonial({
        revieweeStaffId: reviewee!.id,
        message: message.trim(),
      }),
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (e) => setError((e as Error).message ?? "Submission failed"),
  })

  function reset() {
    setSearch(""); setReviewee(null); setMessage(""); setError("")
  }

  function handleClose() {
    reset()
    onClose()
  }

  function validate() {
    if (!reviewee) return "Please select a colleague"
    if (!message.trim()) return "Please write your testimonial"
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
    <Popup title="Write a Testimonial" onClose={handleClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Colleague picker */}
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Colleague</AppText>
        {reviewee ? (
          <Pressable
            onPress={() => setReviewee(null)}
            style={[styles.selectedChip, { borderColor: colors.accent, backgroundColor: colors.accentSubtle }]}
          >
            <AppText variant="bodyMedium" style={{ color: colors.accent }}>{reviewee.name}</AppText>
            <AppText variant="caption" style={{ color: colors.accent }}>Change</AppText>
          </Pressable>
        ) : (
          <>
            <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}>
              <Search size={15} color={colors.text.tertiary} strokeWidth={1.75} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary, outline: "none" } as any]}
                placeholder="Search colleagues..."
                placeholderTextColor={colors.text.tertiary}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <View style={[styles.colleagueList, { borderColor: colors.border }]}>
              {staffLoading ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ paddingVertical: spacing[4] }} />
              ) : filteredColleagues.length === 0 ? (
                <AppText variant="caption" color="tertiary" style={{ padding: spacing[3] }}>No colleagues found</AppText>
              ) : (
                filteredColleagues.slice(0, 20).map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setReviewee(s)}
                    style={[styles.colleagueRow, { borderBottomColor: colors.border }]}
                  >
                    <AppText variant="body">{s.name}</AppText>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}

        {/* Message */}
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Message</AppText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="Share what made this colleague stand out..."
          placeholderTextColor={colors.text.tertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
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
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing[1],
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
  },
  searchInput: { flex: 1, paddingVertical: spacing[3], fontSize: 14 },
  colleagueList: {
    borderWidth: 1,
    borderRadius: radii.md,
    maxHeight: 180,
    marginBottom: spacing[1],
    overflow: "hidden",
  },
  colleagueRow: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    marginBottom: spacing[1],
  },
  textArea: { minHeight: 100 },
})
