import { toTitleCase } from "../../utils/helpers"
import { useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, Calendar, ChevronLeft, ChevronRight, Award, Clock } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { extraPerformanceService } from "../../services/extraPerformanceService"
import type { ExtraPerformance } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

type TabFilter = "pending" | "approved"


// ─── RejectModal ──────────────────────────────────────────────────────────────

function RejectModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
}: {
  visible: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
}) {
  const { colors } = useTheme()
  const [reason, setReason] = useState("")

  function handleConfirm() {
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalBox, { backgroundColor: colors.background.primary }]}>
          <AppText variant="heading3" style={{ marginBottom: spacing[2] }}>Reject Performance</AppText>
          <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
            Provide a reason for rejection (required)
          </AppText>
          <TextInput
            style={[styles.reasonInput, {
              borderColor: colors.border,
              color: colors.text.primary,
              backgroundColor: colors.background.secondary,
            }]}
            placeholder="e.g. Insufficient detail provided"
            placeholderTextColor={colors.text.tertiary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.modalActions}>
            <AppButton label="Cancel" variant="ghost" onPress={onClose} />
            <AppButton
              label={isLoading ? "Rejecting…" : "Reject"}
              onPress={handleConfirm}
              disabled={!reason.trim() || isLoading}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── PendingCard ─────────────────────────────────────────────────────────────

function PendingCard({
  item,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  item: ExtraPerformance
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const { colors } = useTheme()
  return (
    <AppCard elevation="sm" style={styles.card}>
      <View style={styles.cardTop}>
        <StaffAvatar name={item.staffName} color={colors.accent} bgColor={colors.accentSubtle} />
        <View style={{ flex: 1, gap: spacing[1] }}>
          <AppText variant="bodyMedium">{toTitleCase(item.staffName)}</AppText>
          <View style={[styles.typeBadge, { backgroundColor: colors.accentSubtle, alignSelf: "flex-start" }]}>
            <AppText variant="caption" style={{ color: colors.accent, fontSize: 11 }}>{item.category}</AppText>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: spacing[1] }}>
        <AppText variant="bodyMedium">{item.title}</AppText>
        <AppText variant="caption" color="tertiary">{item.description}</AppText>
      </View>

      <View style={[styles.cardMeta, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <Calendar size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">{moment(item.date).format("D MMM YYYY")}</AppText>
        </View>
        <View style={styles.metaRow}>
          <Clock size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="tertiary">{moment(item.createdAt).fromNow()}</AppText>
        </View>
      </View>

      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={onReject}
          disabled={isRejecting || isApproving}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: palette.error.default + "15", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {isRejecting ? (
            <ActivityIndicator size="small" color={palette.error.default} />
          ) : (
            <>
              <X size={16} color={palette.error.default} strokeWidth={2} />
              <AppText variant="caption" style={{ color: palette.error.default }}>Reject</AppText>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={onApprove}
          disabled={isApproving || isRejecting}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: palette.success.default + "15", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {isApproving ? (
            <ActivityIndicator size="small" color={palette.success.default} />
          ) : (
            <>
              <Check size={16} color={palette.success.default} strokeWidth={2.5} />
              <AppText variant="caption" style={{ color: palette.success.default }}>Approve</AppText>
            </>
          )}
        </Pressable>
      </View>
    </AppCard>
  )
}

// ─── ApprovedCard ─────────────────────────────────────────────────────────────

function ApprovedCard({ item }: { item: ExtraPerformance }) {
  const { colors } = useTheme()
  return (
    <AppCard elevation="sm" style={styles.card}>
      <View style={styles.cardTop}>
        <StaffAvatar name={item.staffName} color={palette.success.default} bgColor={palette.success.default + "18"} />
        <View style={{ flex: 1, gap: spacing[1] }}>
          <AppText variant="bodyMedium">{toTitleCase(item.staffName)}</AppText>
          <View style={[styles.typeBadge, { backgroundColor: colors.accentSubtle, alignSelf: "flex-start" }]}>
            <AppText variant="caption" style={{ color: colors.accent, fontSize: 11 }}>{item.category}</AppText>
          </View>
        </View>
        <AppText variant="bodyMedium" style={{ color: palette.success.default }}>+{item.points}</AppText>
      </View>

      <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: spacing[1] }}>
        <AppText variant="bodyMedium">{item.title}</AppText>
        <AppText variant="caption" color="tertiary">{item.description}</AppText>
      </View>

      <View style={[styles.cardMeta, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <Calendar size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">{moment(item.date).format("D MMM YYYY")}</AppText>
        </View>
        {item.approvedAt && (
          <View style={styles.metaRow}>
            <Check size={13} color={palette.success.default} strokeWidth={2} />
            <AppText variant="caption" color="tertiary">
              Approved {moment(item.approvedAt).fromNow()}
            </AppText>
          </View>
        )}
      </View>
    </AppCard>
  )
}

// ─── ExtraPerformanceScreen ──────────────────────────────────────────────────

export default function ExtraPerformanceScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<TabFilter>("pending")
  const [month, setMonth] = useState(() => moment().startOf("month"))
  const monthParam = month.format("YYYY-MM")
  const isCurrentMonth = month.isSame(moment(), "month")
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending, isRefetching: refetchingPending } = useQuery({
    queryKey: ["extra-performance-pending", monthParam],
    queryFn: () => extraPerformanceService.getPendingPerformances(monthParam),
  })

  const { data: approvedData, isLoading: approvedLoading, refetch: refetchApproved, isRefetching: refetchingApproved } = useQuery({
    queryKey: ["extra-performance-approved", monthParam],
    queryFn: () => extraPerformanceService.getApprovedPerformances(undefined, monthParam),
    retry: false,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => extraPerformanceService.approvePerformance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-performance-pending", monthParam] })
      queryClient.invalidateQueries({ queryKey: ["extra-performance-approved", monthParam] })
      setActionId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      extraPerformanceService.rejectPerformance(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-performance-pending", monthParam] })
      setRejectTarget(null)
      setActionId(null)
    },
  })

  const pendingList = pendingData?.data?.performances ?? []
  const approvedList = approvedData?.data?.performances ?? []
  const pendingCount = pendingData?.data?.count ?? 0
  const approvedCount = approvedData?.data?.count ?? 0

  const isLoading = tab === "pending" ? pendingLoading : approvedLoading
  const isRefetching = tab === "pending" ? refetchingPending : refetchingApproved
  const onRefresh = tab === "pending" ? refetchPending : refetchApproved

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Extra Performance</AppText>
          <AppText variant="caption" color="tertiary">
            {tab === "pending" ? `${pendingCount} pending` : `${approvedCount} approved`}
          </AppText>
        </View>

        {/* Month navigator */}
        <View style={[styles.monthNav, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setMonth((m) => m.clone().subtract(1, "month"))}
            style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
          <AppText variant="bodyMedium" style={{ minWidth: 88, textAlign: "center" }}>
            {month.format("MMM YYYY")}
          </AppText>
          <Pressable
            onPress={() => !isCurrentMonth && setMonth((m) => m.clone().add(1, "month"))}
            style={({ pressed }) => [styles.navBtn, { opacity: isCurrentMonth || pressed ? 0.3 : 1 }]}
            hitSlop={8}
            disabled={isCurrentMonth}
          >
            <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(["pending", "approved"] as TabFilter[]).map((t) => {
          const isActive = t === tab
          const count = t === "pending" ? pendingCount : approvedCount
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.filterTab}>
              <View style={styles.filterTabInner}>
                <AppText
                  variant={isActive ? "bodyMedium" : "body"}
                  style={{
                    color: isActive ? colors.accent : colors.text.tertiary,
                    paddingBottom: spacing[2],
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: colors.accent,
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </AppText>
                {count > 0 && (
                  <View style={[
                    styles.countBadge,
                    { backgroundColor: isActive ? colors.accent : colors.border },
                  ]}>
                    <AppText variant="caption" style={{ color: isActive ? "#fff" : colors.text.secondary, fontSize: 10, lineHeight: 14 }}>
                      {count}
                    </AppText>
                  </View>
                )}
              </View>
            </Pressable>
          )
        })}
      </View>

      {/* List */}
      {tab === "pending" ? (
        <FlatList
          key="pending"
          data={pendingList}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PendingCard
              item={item}
              onApprove={() => {
                setActionId(item._id)
                approveMutation.mutate(item._id)
              }}
              onReject={() => {
                setActionId(item._id)
                setRejectTarget(item._id)
              }}
              isApproving={approveMutation.isPending && actionId === item._id}
              isRejecting={rejectMutation.isPending && actionId === item._id}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          refreshing={refetchingPending}
          onRefresh={refetchPending}
          ListEmptyComponent={
            pendingLoading ? (
              <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
            ) : (
              <View style={styles.center}>
                <Award size={40} color={colors.text.tertiary} strokeWidth={1.25} />
                <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                  No pending performances for {month.format("MMMM YYYY")}
                </AppText>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          key="approved"
          data={approvedList}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <ApprovedCard item={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          refreshing={refetchingApproved}
          onRefresh={refetchApproved}
          ListEmptyComponent={
            approvedLoading ? (
              <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
            ) : (
              <View style={styles.center}>
                <Check size={40} color={colors.text.tertiary} strokeWidth={1.25} />
                <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                  No approved performances for {month.format("MMMM YYYY")}
                </AppText>
              </View>
            )
          }
        />
      )}

      {/* Reject modal */}
      <RejectModal
        visible={rejectTarget != null}
        onClose={() => { setRejectTarget(null); setActionId(null) }}
        onConfirm={(reason) => {
          if (rejectTarget) rejectMutation.mutate({ id: rejectTarget, reason })
        }}
        isLoading={rejectMutation.isPending}
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
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  navBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[6],
  },
  filterTab: { paddingTop: spacing[3] },
  filterTabInner: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },

  list: { padding: spacing[4], paddingBottom: spacing[16] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

  // Card
  card: { padding: 0, overflow: "hidden" },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
  },
  typeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  cardMeta: {
    flexDirection: "row",
    gap: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
  },

  // Modal
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
  reasonInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    minHeight: 80,
    marginBottom: spacing[4],
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing[3],
  },
})
