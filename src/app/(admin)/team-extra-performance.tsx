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
import { Check, X, Calendar, ChevronLeft, ChevronRight, Award } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import ListRow from "../../components/shared/ListRow"
import type { ActionMenuItem } from "../../components/shared/ActionMenu"
import moment from "moment"
import AppText from "../../components/ui/AppText"
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
  index,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  item: ExtraPerformance
  index?: number
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const { colors, isDark } = useTheme()
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]

  const menuItems: ActionMenuItem[] = [
    { label: "Approve", icon: <Check size={16} color={palette.success.default} strokeWidth={2.5} />, color: palette.success.default, onPress: onApprove },
    { label: "Reject", icon: <X size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onReject },
  ]

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName)}
      pills={[{ key: "category", label: item.category, color: colors.accent, bgColor: colors.accentSubtle }]}
      menuItems={menuItems}
      isBusy={isApproving || isRejecting}
      metaLines={[
        <AppText key="title" variant="body" style={{ color: colors.text.secondary as string }}>{item.title}</AppText>,
        <AppText key="desc" variant="bodySmall" numberOfLines={2} style={{ color: colors.text.tertiary as string }}>{item.description}</AppText>,
        <View key="date" style={styles.metaRow}>
          <Calendar size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">{moment(item.date).format("D MMM YYYY")}</AppText>
          <AppText variant="caption" color="tertiary">· {moment(item.createdAt).fromNow()}</AppText>
        </View>,
      ]}
    />
  )
}

// ─── ApprovedCard ─────────────────────────────────────────────────────────────

function ApprovedCard({ item, index }: { item: ExtraPerformance; index?: number }) {
  const { colors } = useTheme()

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={palette.success.default}
      avatarBgColor={palette.success.default + "18"}
      title={toTitleCase(item.staffName)}
      pills={[{ key: "category", label: item.category, color: colors.accent, bgColor: colors.accentSubtle }]}
      trailing={
        <AppText variant="bodyMedium" style={{ color: palette.success.default }}>+{item.points}</AppText>
      }
      metaLines={[
        <AppText key="title" variant="body" style={{ color: colors.text.secondary as string }}>{item.title}</AppText>,
        <AppText key="desc" variant="bodySmall" numberOfLines={2} style={{ color: colors.text.tertiary as string }}>{item.description}</AppText>,
        <View key="date" style={styles.metaRow}>
          <Calendar size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">{moment(item.date).format("D MMM YYYY")}</AppText>
          {item.approvedAt && (
            <AppText variant="caption" color="tertiary">· Approved {moment(item.approvedAt).fromNow()}</AppText>
          )}
        </View>,
      ]}
    />
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
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <PendingCard
                item={item}
                index={index}
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
            </AnimatedListItem>
          )}
          contentContainerStyle={styles.rowList}
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
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <ApprovedCard item={item} index={index} />
            </AnimatedListItem>
          )}
          contentContainerStyle={styles.rowList}
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

  rowList: { paddingBottom: spacing[16] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },

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
