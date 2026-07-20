import { useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Calendar, X, Award, Clock, RefreshCw } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import DatePickerField from "../../components/shared/DatePickerField"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { extraPerformanceService } from "../../services/extraPerformanceService"
import useAuthStore from "../../stores/useAuthStore"
import { useTablet } from "../../hooks/useTablet"
import type { ExtraPerformance, ExtraPerformanceCategory, ExtraPerformanceStatus } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExtraPerformanceStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: palette.warning.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
}

const CATEGORIES: ExtraPerformanceCategory[] = [
  "Training",
  "Process Improvement",
  "Customer Excellence",
  "Team Leadership",
  "Other",
]

const FILTERS: Array<{ label: string; value: ExtraPerformanceStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

// ─── StatsCard ────────────────────────────────────────────────────────────────

function StatsCard({
  isLoading,
  approved,
  pending,
  points,
}: {
  isLoading: boolean
  approved: number
  pending: number
  points: number
}) {
  const { colors } = useTheme()

  return (
    <View style={[styles.statsCard, { borderBottomColor: colors.border }]}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <AppText variant="heading2" style={{ color: colors.accent }}>{points}</AppText>
            <AppText variant="caption" color="tertiary">Points (month)</AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <AppText variant="heading2" style={{ color: palette.success.default }}>{approved}</AppText>
            <AppText variant="caption" color="tertiary">Approved</AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <AppText variant="heading2" style={{ color: palette.warning.default }}>{pending}</AppText>
            <AppText variant="caption" color="tertiary">Pending</AppText>
          </View>
        </View>
      )}
    </View>
  )
}

// ─── SubmitModal ────────────────────────────────────────────────────────────

function SubmitModal({
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <AppText variant="heading3">Add Extra Performance</AppText>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </View>

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
        </View>
      </View>
    </Modal>
  )
}

// ─── PerformanceCard ────────────────────────────────────────────────────────

function PerformanceCard({ item }: { item: ExtraPerformance }) {
  const { colors } = useTheme()
  const status = STATUS_CONFIG[item.status]

  return (
    <AppCard elevation="sm" style={styles.perfCard}>
      <View style={styles.perfCardTop}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <View style={{ flexDirection: "row", gap: spacing[2] }}>
            <View style={[styles.typeBadge, { backgroundColor: colors.accentSubtle }]}>
              <AppText variant="caption" style={{ color: colors.accent, fontSize: 11 }}>{item.category}</AppText>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: status.color + "22" }]}>
              <AppText variant="caption" style={{ color: status.color, fontSize: 11 }}>{status.label}</AppText>
            </View>
          </View>
          <AppText variant="bodyMedium" numberOfLines={1}>{item.title}</AppText>
          <AppText variant="caption" color="tertiary" numberOfLines={2}>{item.description}</AppText>
        </View>
        {item.status === "approved" && (
          <AppText variant="bodyMedium" style={{ color: palette.success.default }}>
            +{item.points}
          </AppText>
        )}
      </View>

      <View style={[styles.perfCardMeta, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <Calendar size={13} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">{moment(item.date).format("D MMM YYYY")}</AppText>
        </View>
        <View style={styles.metaRow}>
          <Clock size={13} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="tertiary">{moment(item.createdAt).fromNow()}</AppText>
        </View>
      </View>

      {item.status === "rejected" && item.rejectionReason ? (
        <AppText variant="caption" style={{ color: palette.error.default, paddingHorizontal: spacing[4], paddingBottom: spacing[3] }}>
          {item.rejectionReason}
        </AppText>
      ) : null}
    </AppCard>
  )
}

// ─── ExtraPerformanceScreen ──────────────────────────────────────────────────

export default function ExtraPerformanceScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState<ExtraPerformanceStatus | "all">("all")
  const [submitOpen, setSubmitOpen] = useState(false)

  const currentMonth = moment().format("YYYY-MM")

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-performances", user?.user_id],
    queryFn: () => extraPerformanceService.getStaffPerformances(),
    enabled: user?.user_id != null,
  })

  const { data: approvedData, isLoading: pointsLoading } = useQuery({
    queryKey: ["my-performances-approved", user?.user_id, currentMonth],
    queryFn: () => extraPerformanceService.getApprovedPerformances(undefined, currentMonth),
    enabled: user?.user_id != null,
  })

  const performances = data?.data?.performances ?? []
  const stats = data?.data?.stats
  const monthlyPoints = approvedData?.data?.totalPoints ?? 0

  const filtered = filter === "all" ? performances : performances.filter((p) => p.status === filter)

  function onSubmitSuccess() {
    queryClient.invalidateQueries({ queryKey: ["my-performances"] })
    queryClient.invalidateQueries({ queryKey: ["my-performances-approved"] })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <AppText variant="heading2" style={{ flex: 1 }}>Extra Performance</AppText>
        <Pressable onPress={() => refetch()} hitSlop={8} style={{ padding: spacing[2] }}>
          {isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setSubmitOpen(true)}>
          <View style={[styles.addBtn, { backgroundColor: colors.accent }]}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: "#fff" }}>Add</AppText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <StatsCard
          isLoading={pointsLoading}
          approved={stats?.approved ?? 0}
          pending={stats?.pending ?? 0}
          points={monthlyPoints}
        />

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => {
          const isActive = f.value === filter
          return (
            <Pressable key={f.value} onPress={() => setFilter(f.value)} style={styles.filterTab}>
              <AppText
                variant={isActive ? "bodyMedium" : "body"}
                style={{
                  color: isActive ? colors.accent : colors.text.tertiary,
                  paddingBottom: spacing[2],
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: colors.accent,
                }}
              >
                {f.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PerformanceCard item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <Award size={40} color={colors.text.tertiary} strokeWidth={1.25} />
              <AppText color="tertiary" style={{ marginTop: spacing[3] }}>No extra performance logged yet</AppText>
            </View>
          )
        }
      />

      <SubmitModal
        visible={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSuccess={onSubmitSuccess}
      />
      </View>
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mobileContent: { flex: 1 },
  desktopContent: { flex: 1 },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
  },

  statsCard: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", gap: spacing[1] },
  statDivider: { width: StyleSheet.hairlineWidth, height: 40 },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },
  filterTab: { paddingTop: spacing[3] },

  list: { padding: spacing[4], paddingBottom: spacing[16] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },

  perfCard: { padding: 0, overflow: "hidden" },
  perfCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    padding: spacing[4],
  },
  typeBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.sm },
  perfCardMeta: {
    flexDirection: "row",
    gap: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "85%",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing[5],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[5],
  },
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
