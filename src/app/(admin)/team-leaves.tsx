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
  ScrollView,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, Calendar, RefreshCw, Plus, Trash2, Share2, UserCheck, ClipboardList, XCircle, Share } from "lucide-react-native"
import Toast from "react-native-toast-message"
import BackButton from "../../components/shared/BackButton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import DatePickerField from "../../components/shared/DatePickerField"
import Popup from "../../components/shared/Popup"
import ListRow, { ListRowPill } from "../../components/shared/ListRow"
import FollowUpTimeline, { TimelineEvent } from "../../components/shared/FollowUpTimeline"
import type { ActionMenuItem } from "../../components/shared/ActionMenu"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { leaveService } from "../../services/leaveService"
import { staffService } from "../../services/staffService"
import useAuthStore from "../../stores/useAuthStore"
import type { LeaveRequest, LeaveStatus, LeaveType } from "../../types"

function leaveErrorMessage(e: unknown, fallback: string): string {
  return (e as Error)?.message ?? fallback
}

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

// ─── DelegateModal ────────────────────────────────────────────────────────────

function DelegateModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
}: {
  visible: boolean
  onClose: () => void
  onConfirm: (userId: number) => void
  isLoading: boolean
}) {
  const { colors } = useTheme()
  const [selected, setSelected] = useState<number | null>(null)

  const { data, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getStaff(),
    enabled: visible,
  })

  const delegates = (data?.data ?? []).filter((s) => s.role === "manager" || s.role === "superAdmin")

  function handleConfirm() {
    if (selected == null) return
    onConfirm(selected)
  }

  if (!visible) return null

  return (
    <Popup title="Delegate Approval" onClose={onClose}>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
        Choose a manager or super admin to handle this request
      </AppText>
      {isLoadingStaff ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[6] }} />
      ) : (
        <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
          {delegates.map((d) => {
            const isSelected = selected === d.user_id
            return (
              <Pressable
                key={d.user_id}
                onPress={() => setSelected(d.user_id)}
                style={[
                  styles.delegateRow,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accent + "18" : "transparent",
                  },
                ]}
              >
                <StaffAvatar name={d.name} color={colors.accent} bgColor={colors.accentSubtle} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium">{toTitleCase(d.name)}</AppText>
                  <AppText variant="caption" color="tertiary">{toTitleCase(d.role ?? "")}</AppText>
                </View>
              </Pressable>
            )
          })}
          {delegates.length === 0 && (
            <AppText color="tertiary" style={{ textAlign: "center", paddingVertical: spacing[6] }}>
              No eligible managers or super admins found
            </AppText>
          )}
        </ScrollView>
      )}
      <View style={styles.modalActions}>
        <AppButton label="Cancel" variant="ghost" onPress={onClose} />
        <AppButton
          label={isLoading ? "Delegating…" : "Delegate"}
          onPress={handleConfirm}
          disabled={selected == null || isLoading}
        />
      </View>
    </Popup>
  )
}

// ─── leave timeline events ─────────────────────────────────────────────────────

function buildLeaveEvents(item: LeaveRequest): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      icon: <ClipboardList size={11} color={palette.neutral[400]} strokeWidth={1.75} />,
      text: `Requested ${moment(item.createdAt).format("D MMM, h:mm A")}`,
      color: palette.neutral[500],
    },
  ]

  if (item.delegatedTo != null) {
    events.push({
      icon: <Share size={11} color={palette.primary[500]} strokeWidth={1.75} />,
      text: `Delegated for approval${item.delegatedAt ? ` · ${moment(item.delegatedAt).format("D MMM, h:mm A")}` : ""}`,
      color: palette.primary[600],
    })
  }

  if (item.status === "approved") {
    events.push({
      icon: <UserCheck size={11} color={palette.success.default} strokeWidth={1.75} />,
      text: item.approvedByName
        ? `Approved by ${item.approvedByName}${item.approvedAt ? ` · ${moment(item.approvedAt).format("D MMM, h:mm A")}` : ""}`
        : `Approved${item.approvedAt ? ` · ${moment(item.approvedAt).format("D MMM, h:mm A")}` : ""}`,
      color: palette.success.default,
    })
  } else if (item.status === "rejected") {
    events.push({
      icon: <XCircle size={11} color={palette.error.default} strokeWidth={1.75} />,
      text: item.rejectionReason ? `Rejected · ${item.rejectionReason}` : "Rejected",
      color: palette.error.default,
    })
  }

  return events
}

// ─── LeaveCard ────────────────────────────────────────────────────────────────

function LeaveCard({
  item,
  index,
  onApprove,
  onReject,
  onDelegate,
  isApproving,
  isRejecting,
  canDelegate,
}: {
  item: LeaveRequest
  index?: number
  onApprove: () => void
  onReject: () => void
  onDelegate?: () => void
  isApproving: boolean
  isRejecting: boolean
  canDelegate?: boolean
}) {
  const { colors, isDark } = useTheme()
  const status = STATUS_CONFIG[item.status]
  const typeColor = TYPE_CONFIG[item.leaveType]?.color ?? colors.accent
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]
  const isBusy = isApproving || isRejecting

  const menuItems: ActionMenuItem[] = item.status === "pending"
    ? [
        ...(item.canApprove
          ? [
              { label: "Approve", icon: <Check size={16} color={palette.success.default} strokeWidth={2.5} />, color: palette.success.default, onPress: onApprove },
              { label: "Reject", icon: <X size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onReject },
            ]
          : []),
        ...(canDelegate && onDelegate
          ? [{ label: "Delegate", icon: <Share2 size={16} color={colors.accent} strokeWidth={1.75} />, color: colors.accent, onPress: onDelegate }]
          : []),
      ]
    : []

  const pills: ListRowPill[] = [
    { key: "type", label: item.leaveType, color: typeColor, bgColor: typeColor + "22" },
    { key: "status", label: status.label, color: status.color, bgColor: status.color + "22" },
    ...(item.delegatedTo != null
      ? [{ key: "delegated", label: "Delegated", color: colors.accent, bgColor: colors.accentSubtle }]
      : []),
  ]

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName)}
      pills={pills}
      trailing={
        <AppText variant="caption" style={{ color: colors.text.tertiary, fontSize: 12 }}>
          {item.numberOfDays}d
        </AppText>
      }
      menuItems={menuItems}
      isBusy={isBusy}
      metaLines={[
        <View key="dates" style={styles.metaItem}>
          <Calendar size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            {moment(item.startDate).format("D MMM")} – {moment(item.endDate).format("D MMM YYYY")}
          </AppText>
        </View>,
        ...(item.reason
          ? [
              <AppText key="reason" variant="bodySmall" numberOfLines={2} color="tertiary">
                {item.reason}
              </AppText>,
            ]
          : []),
        <View key="timeline" style={styles.timelineWrap}>
          <FollowUpTimeline events={buildLeaveEvents(item)} />
        </View>,
      ]}
    />
  )
}

// ─── MyBalanceCard ────────────────────────────────────────────────────────────

function MyBalanceCard({ staffId }: { staffId?: number }) {
  const { colors } = useTheme()
  const { data, isLoading } = useQuery({
    queryKey: ["leave-balance", staffId],
    queryFn: () => leaveService.getLeaveBalance(staffId!),
    enabled: staffId != null,
  })

  const balance = data?.data
  const used = balance?.leaveUsedThisYear ?? 0
  const total = balance?.totalLeavePerYear ?? 12
  const remaining = balance?.leaveBalance ?? 0
  const fillRatio = total > 0 ? Math.min(used / total, 1) : 0
  const pct = Math.round(fillRatio * 100)
  const barColor = fillRatio > 0.8 ? palette.error.default : fillRatio > 0.5 ? palette.warning.default : palette.success.default

  return (
    <View style={[styles.myBalanceCard, { borderBottomColor: colors.border }]}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <>
          <View style={styles.myBalanceStatsRow}>
            <View style={styles.myBalanceStat}>
              <AppText variant="heading2" style={{ color: colors.accent }}>{remaining}</AppText>
              <AppText variant="caption" color="tertiary">Remaining</AppText>
            </View>
            <View style={[styles.myBalanceStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.myBalanceStat}>
              <AppText variant="heading2" color="primary">{used}</AppText>
              <AppText variant="caption" color="tertiary">Used (year)</AppText>
            </View>
          </View>
          <View style={styles.myBalanceBarWrap}>
            <View style={[styles.myBalanceTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.myBalanceFill, { backgroundColor: barColor, width: `${pct}%` }]} />
            </View>
            <AppText variant="caption" style={{ color: barColor, fontSize: 11 }}>{pct}%</AppText>
          </View>
        </>
      )}
    </View>
  )
}

// ─── MyRequestModal ───────────────────────────────────────────────────────────

function MyRequestModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { colors } = useTheme()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [leaveType, setLeaveType] = useState<LeaveType>("Personal")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: () => leaveService.requestLeave({
      startDate: moment(startDate).format("YYYY-MM-DD"),
      endDate: moment(endDate).format("YYYY-MM-DD"),
      leaveType,
      reason,
    }),
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (e) => setError((e as Error).message ?? "Request failed"),
  })

  function reset() {
    setStartDate(null); setEndDate(null); setLeaveType("Personal"); setReason(""); setError("")
  }

  function validate() {
    if (!startDate) return "Please select a start date"
    if (!endDate) return "Please select an end date"
    if (moment(endDate).isBefore(moment(startDate), "day")) return "End date must be after start date"
    if (!reason.trim()) return "Please provide a reason"
    return null
  }

  function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    mutation.mutate()
  }

  const TYPES: LeaveType[] = ["Personal", "Medical"]

  if (!visible) return null

  return (
    <Popup title="Request Leave" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="caption" color="tertiary" style={styles.myFieldLabel}>Leave Type</AppText>
        <View style={styles.myTypeRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setLeaveType(t)}
              style={[
                styles.myTypeChip,
                {
                  borderColor: leaveType === t ? colors.accent : colors.border,
                  backgroundColor: leaveType === t ? colors.accent + "18" : "transparent",
                },
              ]}
            >
              <AppText
                variant={leaveType === t ? "bodyMedium" : "body"}
                style={{ color: leaveType === t ? colors.accent : colors.text.secondary }}
              >
                {t}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.myFieldLabel}>
          <DatePickerField label="Start Date" value={startDate} onChange={setStartDate} placeholder="Select start date" />
        </View>

        <View style={styles.myFieldLabel}>
          <DatePickerField label="End Date" value={endDate} onChange={setEndDate} placeholder="Select end date" />
        </View>

        {startDate && endDate && !moment(endDate).isBefore(moment(startDate), "day") && (
          <View style={[styles.myDayCount, { backgroundColor: colors.accentSubtle }]}>
            <AppText variant="bodyMedium" style={{ color: colors.accent }}>
              {moment(endDate).diff(moment(startDate), "days") + 1} day{moment(endDate).diff(moment(startDate), "days") + 1 !== 1 ? "s" : ""}
            </AppText>
            <AppText variant="caption" color="secondary">
              {moment(startDate).format("D MMM")} – {moment(endDate).format("D MMM YYYY")}
            </AppText>
          </View>
        )}

        <AppText variant="caption" color="tertiary" style={styles.myFieldLabel}>Reason</AppText>
        <TextInput
          style={[styles.myInput, styles.myTextArea, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="Briefly describe your reason..."
          placeholderTextColor={colors.text.tertiary}
          value={reason}
          onChangeText={setReason}
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
          label={mutation.isPending ? "Submitting…" : "Submit Request"}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          style={{ marginTop: spacing[4] }}
        />
        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── MyLeaveCard ──────────────────────────────────────────────────────────────

function MyLeaveCard({
  item,
  index,
  onDelete,
  isDeleting,
}: {
  item: LeaveRequest
  index?: number
  onDelete: () => void
  isDeleting: boolean
}) {
  const { colors, isDark } = useTheme()
  const status = STATUS_CONFIG[item.status]
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]

  const pills: ListRowPill[] = [
    { key: "status", label: status.label, color: status.color, bgColor: status.color + "22" },
  ]

  const menuItems: ActionMenuItem[] = item.status === "pending"
    ? [{ label: "Cancel", icon: <Trash2 size={16} color={palette.error.default} strokeWidth={1.75} />, color: palette.error.default, onPress: onDelete }]
    : []

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={item.leaveType}
      pills={pills}
      trailing={
        <AppText variant="caption" style={{ color: colors.text.tertiary, fontSize: 12 }}>
          {item.numberOfDays}d
        </AppText>
      }
      menuItems={menuItems}
      isBusy={isDeleting}
      metaLines={[
        <View key="dates" style={styles.metaItem}>
          <Calendar size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            {moment(item.startDate).format("D MMM")} – {moment(item.endDate).format("D MMM YYYY")}
          </AppText>
        </View>,
        ...(item.reason
          ? [
              <AppText key="reason" variant="bodySmall" numberOfLines={2} color="tertiary">
                {item.reason}
              </AppText>,
            ]
          : []),
        <View key="timeline" style={styles.timelineWrap}>
          <FollowUpTimeline events={buildLeaveEvents(item)} />
        </View>,
      ]}
    />
  )
}

// ─── MyLeavesTab ──────────────────────────────────────────────────────────────

function MyLeavesTab() {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState<LeaveStatus | "all">("all")
  const [requestOpen, setRequestOpen] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-leaves", filter],
    queryFn: () => leaveService.getMyLeaves(filter === "all" ? undefined : filter),
  })

  const leaves = data?.data?.leaves ?? []

  const deleteMutation = useMutation({
    mutationFn: (leaveId: string) => leaveService.deleteLeave(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
    },
  })

  function onRequestSuccess() {
    queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
    queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.myHeader, { borderBottomColor: colors.border }]}>
        <AppText variant="bodyMedium" color="secondary" style={{ flex: 1 }}>
          {data?.data?.count ?? 0} of your requests
        </AppText>
        <Pressable onPress={() => setRequestOpen(true)} style={[styles.myRequestBtn, { backgroundColor: colors.accent }]}>
          <Plus size={16} color="#fff" strokeWidth={2.5} />
          <AppText variant="caption" style={{ color: "#fff" }}>Request</AppText>
        </Pressable>
      </View>

      <MyBalanceCard staffId={user?.user_id ?? undefined} />

      <FilterTabs active={filter} onChange={setFilter} />

      <FlatList
        data={leaves}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <MyLeaveCard
              item={item}
              index={index}
              onDelete={() => deleteMutation.mutate(item.id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No leave requests yet</AppText>
            </View>
          )
        }
      />

      <MyRequestModal
        visible={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSuccess={onRequestSuccess}
      />
    </View>
  )
}

// ─── TeamLeavesTab ────────────────────────────────────────────────────────────

function TeamLeavesTab({ delegatedOnly }: { delegatedOnly?: boolean }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isHr = user?.role === "hr"
  const [filter, setFilter] = useState<LeaveStatus | "all">("all")
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [delegateTarget, setDelegateTarget] = useState<string | null>(null)
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
    onError: (e) => {
      Toast.show({ type: "error", text1: leaveErrorMessage(e, "Failed to approve leave") })
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
    onError: (e) => {
      Toast.show({ type: "error", text1: leaveErrorMessage(e, "Failed to reject leave") })
      setActionId(null)
    },
  })

  const delegateMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: number }) =>
      leaveService.delegateLeave(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      setDelegateTarget(null)
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: leaveErrorMessage(e, "Failed to delegate leave") })
    },
  })

  const stats = statsData?.data
  const allLeaves = leavesData?.data?.leaves ?? []
  const leaves = delegatedOnly
    ? allLeaves.filter((l) => l.delegatedTo != null && l.delegatedTo === user?.user_id)
    : allLeaves

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.teamActionsRow}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => refetch()}
          hitSlop={8}
          accessibilityLabel="Refresh leave requests"
          // @ts-expect-error web-only hover tooltip, ignored on native
          title="Refresh"
          style={{ padding: spacing[2] }}
        >
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
              index={index}
              onApprove={() => {
                setActionId(item.id)
                approveMutation.mutate(item.id)
              }}
              onReject={() => {
                setActionId(item.id)
                setRejectTarget(item.id)
              }}
              onDelegate={() => setDelegateTarget(item.id)}
              canDelegate={isHr}
              isApproving={approveMutation.isPending && actionId === item.id}
              isRejecting={rejectMutation.isPending && actionId === item.id}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          leavesLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">
                {delegatedOnly ? "No requests delegated to you" : "No leave requests found"}
              </AppText>
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

      {/* Delegate modal */}
      <DelegateModal
        visible={delegateTarget != null}
        onClose={() => setDelegateTarget(null)}
        onConfirm={(userId) => {
          if (delegateTarget) delegateMutation.mutate({ id: delegateTarget, userId })
        }}
        isLoading={delegateMutation.isPending}
      />
    </View>
  )
}

// ─── LeavesScreen ─────────────────────────────────────────────────────────────

type LeavesView = "team" | "delegated" | "mine"

export default function LeavesScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === "superAdmin"

  const [view, setView] = useState<LeavesView>(isSuperAdmin ? "delegated" : "team")

  const tabs: Array<{ label: string; value: LeavesView }> = isSuperAdmin
    ? [
        { label: "Delegated to Me", value: "delegated" },
        { label: "Team Requests", value: "team" },
        { label: "My Leave", value: "mine" },
      ]
    : [
        { label: "Team Requests", value: "team" },
        { label: "My Leave", value: "mine" },
      ]

  const headerSubtitle = view === "mine"
    ? "Your requests"
    : view === "delegated"
      ? "Requests delegated to you"
      : "Team requests"

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Leave Requests</AppText>
          <AppText variant="caption" color="tertiary">{headerSubtitle}</AppText>
        </View>
      </View>

      {/* View toggle */}
      <View style={[styles.viewToggleRow, { borderBottomColor: colors.border }]}>
        {tabs.map((t) => {
          const isActive = t.value === view
          return (
            <Pressable key={t.value} onPress={() => setView(t.value)} style={styles.filterTab}>
              <AppText
                variant={isActive ? "bodyMedium" : "body"}
                style={{
                  color: isActive ? colors.accent : colors.text.tertiary,
                  paddingBottom: spacing[2],
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: colors.accent,
                }}
              >
                {t.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {view === "mine" ? (
        <MyLeavesTab />
      ) : (
        <TeamLeavesTab delegatedOnly={view === "delegated"} />
      )}
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

  viewToggleRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[6],
  },

  myHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  myRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
  },
  myBalanceCard: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  myBalanceStatsRow: { flexDirection: "row", alignItems: "center" },
  myBalanceStat: { flex: 1, alignItems: "center", gap: spacing[1] },
  myBalanceStatDivider: { width: StyleSheet.hairlineWidth, height: 40 },
  myBalanceBarWrap: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  myBalanceTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  myBalanceFill: { height: 6, borderRadius: 3 },

  myFieldLabel: { marginBottom: spacing[2], marginTop: spacing[4] },
  myTypeRow: { flexDirection: "row", gap: spacing[3] },
  myTypeChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  myInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    marginBottom: spacing[1],
  },
  myTextArea: { minHeight: 80, textAlignVertical: "top" },
  myDayCount: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[3],
    borderRadius: radii.md,
    marginTop: spacing[3],
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
  rowList: { paddingBottom: spacing[16] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

  // Row meta
  metaItem: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  timelineWrap: { flex: 1, paddingTop: spacing[1] },

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
  teamActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
  },
  delegateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginBottom: spacing[2],
  },
})
