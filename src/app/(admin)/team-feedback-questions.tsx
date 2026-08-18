import { useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, Modal, TextInput } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, EyeOff, Eye, MessageSquareQuote } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { feedbackService } from "../../services/feedbackService"
import type { FeedbackQuestion } from "../../types"

// ─── QuestionModal ────────────────────────────────────────────────────────────

function QuestionModal({
  visible,
  initial,
  onClose,
  onSave,
  isLoading,
}: {
  visible: boolean
  initial: FeedbackQuestion | null
  onClose: () => void
  onSave: (text: string, order: number) => void
  isLoading: boolean
}) {
  const { colors } = useTheme()
  const [text, setText] = useState(initial?.text ?? "")
  const [order, setOrder] = useState(String(initial?.order ?? 0))

  function handleOpen() {
    setText(initial?.text ?? "")
    setOrder(String(initial?.order ?? 0))
  }

  function handleSave() {
    if (!text.trim()) return
    onSave(text.trim(), Number(order) || 0)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={handleOpen}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalBox, { backgroundColor: colors.background.primary }]}>
          <AppText variant="heading3" style={{ marginBottom: spacing[4] }}>
            {initial ? "Edit Question" : "New Question"}
          </AppText>
          <TextInput
            style={[styles.textInput, {
              borderColor: colors.border,
              color: colors.text.primary,
              backgroundColor: colors.background.secondary,
            }]}
            placeholder="e.g. Was the staff member polite and helpful?"
            placeholderTextColor={colors.text.tertiary}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          <AppText variant="label" color="secondary" style={{ marginTop: spacing[3], marginBottom: spacing[1] }}>
            Order (lower shows first)
          </AppText>
          <TextInput
            style={[styles.orderInput, {
              borderColor: colors.border,
              color: colors.text.primary,
              backgroundColor: colors.background.secondary,
            }]}
            keyboardType="number-pad"
            value={order}
            onChangeText={setOrder}
          />
          <View style={styles.modalActions}>
            <AppButton label="Cancel" variant="ghost" onPress={onClose} />
            <AppButton
              label={isLoading ? "Saving…" : "Save"}
              onPress={handleSave}
              disabled={!text.trim() || isLoading}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

function QuestionCard({
  item,
  onEdit,
  onToggleActive,
  isToggling,
}: {
  item: FeedbackQuestion
  onEdit: () => void
  onToggleActive: () => void
  isToggling: boolean
}) {
  const { colors } = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" style={!item.isActive ? { color: colors.text.tertiary as string } : undefined}>
          {item.text}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="caption" color="tertiary">Order {item.order}</AppText>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.isActive ? palette.success.default + "18" : colors.border },
          ]}>
            <AppText variant="caption" style={{ color: item.isActive ? palette.success.default : colors.text.tertiary }}>
              {item.isActive ? "Active" : "Inactive"}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn}>
          <Pencil size={16} color={colors.text.secondary} strokeWidth={1.75} />
        </Pressable>
        {isToggling ? (
          <ActivityIndicator size="small" color={colors.accent} style={styles.iconBtn} />
        ) : (
          <Pressable onPress={onToggleActive} hitSlop={8} style={styles.iconBtn}>
            {item.isActive ? (
              <EyeOff size={16} color={colors.text.secondary} strokeWidth={1.75} />
            ) : (
              <Eye size={16} color={colors.text.secondary} strokeWidth={1.75} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  )
}

// ─── TeamFeedbackQuestionsScreen ──────────────────────────────────────────────

export default function TeamFeedbackQuestionsScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()

  const [modalTarget, setModalTarget] = useState<FeedbackQuestion | null | "new">(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["feedback-questions"],
    queryFn: () => feedbackService.getQuestions(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { text: string; order: number }) => feedbackService.createQuestion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-questions"] })
      setModalTarget(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { text?: string; isActive?: boolean; order?: number } }) =>
      feedbackService.updateQuestion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-questions"] })
      setModalTarget(null)
      setTogglingId(null)
    },
  })

  const questions = [...(data?.data ?? [])].sort((a, b) => a.order - b.order)

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Feedback Questions</AppText>
          <AppText variant="caption" color="tertiary">{questions.length} question{questions.length === 1 ? "" : "s"}</AppText>
        </View>
        <Pressable
          onPress={() => setModalTarget("new")}
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
        >
          <Plus size={16} color="#fff" strokeWidth={2.5} />
          <AppText variant="bodyMedium" style={{ color: "#fff" }}>Add</AppText>
        </Pressable>
      </View>

      <FlatList
        data={questions}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <QuestionCard
              item={item}
              onEdit={() => setModalTarget(item)}
              onToggleActive={() => {
                setTogglingId(item._id)
                updateMutation.mutate({ id: item._id, payload: { isActive: !item.isActive } })
              }}
              isToggling={updateMutation.isPending && togglingId === item._id}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <MessageSquareQuote size={40} color={colors.text.tertiary} strokeWidth={1.25} />
              <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                No feedback questions yet. Add one to get started.
              </AppText>
            </View>
          )
        }
      />

      <QuestionModal
        visible={modalTarget !== null}
        initial={modalTarget === "new" ? null : modalTarget}
        onClose={() => setModalTarget(null)}
        onSave={(text, order) => {
          if (modalTarget === "new") {
            createMutation.mutate({ text, order })
          } else if (modalTarget) {
            updateMutation.mutate({ id: modalTarget._id, payload: { text, order } })
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  list: { padding: spacing[4], paddingBottom: spacing[16], gap: spacing[3] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], marginTop: spacing[2] },
  statusBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.full },
  cardActions: { flexDirection: "row", gap: spacing[2] },
  iconBtn: { padding: spacing[2] },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radii.xl,
    padding: spacing[5],
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    minHeight: 64,
  },
  orderInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing[3],
    marginTop: spacing[5],
  },
})
