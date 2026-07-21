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
import { Check, X, Calendar, Clock, RefreshCw } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { leaveService } from "../../services/leaveService"
import type { LeaveRequest, LeaveStatus } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────


const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: palette.warning.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
}

const TYPE_CONFIG = {
  Personal: { color: palette.primary[500] },
  Medical:  { color: palette.error.default },
}

const FILTERS: Array<{ label: string; value: LeaveStatus | "all" }> = [
  { label: "All",      value: "all" },
  { label: "Pending",  value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({ isLoading, pending, approved, rejected, currentMonth }: {
  isLoading: boolean
  pending: number
  approved: number
  rejected: number
  currentMonth: number
}) {
  const { colors } = useTheme()

  const items = [
    { label: "Pending",       count: pending,      color: palette.warning.default },
    { label: "Approved",      count: approved,     color: palette.success.default },
    { label: "Rejected",      count: rejected,     color: palette.error.default },
    { label: "This Month",    count: currentMonth, color: colors.accent },
  ]

  return (
    <View style={[styles.statsBar, { borderBottomColor: colors.border }]}>
      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        items.map((item, i, arr) => (
          <View key={item.label} style={styles.statsRow}>
            <View style={styles.statsItem}>
              <AppText variant="heading3" style={{ color: item.color }}>{item.count}</AppText>
              <AppText variant="caption" color="tertiary">{item.label}</AppText>
            </View>
            {i < arr.length - 1 && (
              <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))
      )}
    </View>
  )
}

// ─── FilterTabs ───────────────────────────────────────────────────────────────

function FilterTabs({
  active,
  onChange,
}: {
  active: LeaveStatus | "all"
  onChange: (v: LeaveStatus | "all") => void
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
      {FILTERS.map((f) => {
        const isActive = f.value === active
        return (
          <Pressable key={f.value} onPress={() => onChange(f.value)} style={styles.filterTab}>
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
  )
}

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
          <AppText variant="heading3" style={{ marginBottom: spacing[2] }}>Reject Leave</AppText>
          <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
            Provide a reason for rejection (required)
          </AppText>
          <TextInput
            style={[styles.reasonInput, {
              borderColor: colors.border,
              color: colors.text.primary,
              backgroundColor: colors.background.secondary,
            }]}
            placeholder="e.g. Insufficient notice period"
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

// ─── LeaveCard ────────────────────────────────────────────────────────────────

function LeaveCard({
  item,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  item: LeaveRequest
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const { colors } = useTheme()
  const status = STATUS_CONFIG[item.status]
  const typeColor = TYPE_CONFIG[item.leaveType]?.color ?? colors.accent
  return (
    <AppCard elevation="sm" style={styles.card}>
      {/* Top row: avatar + name + type + status */}
      <View style={styles.cardTop}>
        <StaffAvatar name={item.staffName} color={colors.accent} bgColor={colors.accentSubtle} />

        <View style={{ flex: 1, gap: spacing[1] }}>
          <AppText variant="bodyMedium">{toTitleCase(item.staffName)}</AppText>
          <View style={{ flexDirection: "row", gap: spacing[2], alignItems: "center" }}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + "22" }]}>
              <AppText variant="caption" style={{ color: typeColor, fontSize: 11 }}>
                {item.leaveType}
              </AppText>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: status.color + "22" }]}>
              <AppText variant="caption" style={{ color: status.color, fontSize: 11 }}>
                {status.label}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      {/* Date range + days */}
      <View style={[styles.cardMeta, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <Calendar size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">
            {moment(item.startDate).format("D MMM")} – {moment(item.endDate).format("D MMM YYYY")}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <Clock size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">
            {item.numberOfDays} day{item.numberOfDays !== 1 ? "s" : ""}
          </AppText>
        </View>
      </View>

      {/* Reason */}
      {item.reason ? (
        <AppText
          variant="caption"
          color="tertiary"
          style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[3] }}
          numberOfLines={2}
        >
          {item.reason}
        </AppText>
      ) : null}

      {/* Approve / Reject actions — only for pending */}
      {item.status === "pending" && (
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
      )}
    </AppCard>
  )
}

// ─── LeavesScreen ─────────────────────────────────────────────────────────────

export default function LeavesScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<LeaveStatus | "all">("all")
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const { data: leavesData, isLoading: leavesLoading, refetch, isRefetching } = useQuery({
    queryKey: ["leaves", filter],
    queryFn: () => leaveService.getLeaves(filter === "all" ? undefined : filter),
  })

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["leave-stats"],
    queryFn: () => leaveService.getLeaveStats(),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => leaveService.approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      queryClient.invalidateQueries({ queryKey: ["leave-stats"] })
      setActionId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      leaveService.rejectLeave(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      queryClient.invalidateQueries({ queryKey: ["leave-stats"] })
      setRejectTarget(null)
      setActionId(null)
    },
  })

  const stats = statsData?.data
  const leaves = leavesData?.data?.leaves ?? []

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Leave Requests</AppText>
          <AppText variant="caption" color="tertiary">
            {leavesData?.data?.count ?? 0} total
          </AppText>
        </View>
        <Pressable onPress={() => refetch()} hitSlop={8} style={{ padding: spacing[2] }}>
          {isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
      </View>

      {/* Stats */}
      <StatsBar
        isLoading={statsLoading}
        pending={stats?.byStatus.pending ?? 0}
        approved={stats?.byStatus.approved ?? 0}
        rejected={stats?.byStatus.rejected ?? 0}
        currentMonth={stats?.currentMonth ?? 0}
      />

      {/* Filter tabs */}
      <FilterTabs active={filter} onChange={setFilter} />

      {/* List */}
      <FlatList
        data={leaves}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <LeaveCard
              item={item}
              onApprove={() => {
                setActionId(item.id)
                approveMutation.mutate(item.id)
              }}
              onReject={() => {
                setActionId(item.id)
                setRejectTarget(item.id)
              }}
              isApproving={approveMutation.isPending && actionId === item.id}
              isRejecting={rejectMutation.isPending && actionId === item.id}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          leavesLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No leave requests found</AppText>
            </View>
          )
        }
      />

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

  statsBar: {
    flexDirection: "row",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-around",
    minHeight: 64,
    alignItems: "center",
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statsItem: { alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[3] },
  statsDivider: { width: StyleSheet.hairlineWidth, height: 32 },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[6],
  },
  filterTab: { paddingTop: spacing[3] },

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
