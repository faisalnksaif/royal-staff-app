import { useState, useRef, useEffect } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Calendar, Clock, X, Trash2 } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import DatePickerField from "../../components/shared/DatePickerField"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { leaveService } from "../../services/leaveService"
import useAuthStore from "../../stores/useAuthStore"
import { useTablet } from "../../hooks/useTablet"
import type { LeaveRequest, LeaveStatus, LeaveType } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: palette.warning.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
}

const FILTERS: Array<{ label: string; value: LeaveStatus | "all" }> = [
  { label: "All",      value: "all" },
  { label: "Pending",  value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
]

// ─── BalanceCard ──────────────────────────────────────────────────────────────

function BalanceCard({ staffId }: { staffId?: number }) {
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
  const usedThisMonth = balance?.leaveUsedThisMonth ?? 0
  const fillRatio = total > 0 ? used / total : 0

  return (
    <AppCard elevation="md" style={styles.balanceCard}>
      <View style={styles.balanceTop}>
        <View>
          <AppText variant="caption" color="tertiary">Leave Balance</AppText>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: spacing[1] }} />
          ) : (
            <AppText variant="heading2" style={{ color: colors.accent }}>
              {remaining}
              <AppText variant="body" color="secondary"> / {total} days</AppText>
            </AppText>
          )}
        </View>
        <View style={styles.balanceMeta}>
          <AppText variant="caption" color="tertiary">Used this month</AppText>
          <AppText variant="bodyMedium" style={{ textAlign: "right" }}>{usedThisMonth}</AppText>
        </View>
      </View>

      {/* Usage bar */}
      <View style={[styles.balanceTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.balanceFill,
            {
              backgroundColor: fillRatio > 0.8 ? palette.error.default : fillRatio > 0.5 ? palette.warning.default : palette.success.default,
              width: `${Math.min(fillRatio * 100, 100)}%`,
            },
          ]}
        />
      </View>
      <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[2] }}>
        {used} days used of {total} this year
      </AppText>
    </AppCard>
  )
}

// ─── RequestModal ─────────────────────────────────────────────────────────────

function RequestModal({
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <AppText variant="heading3">Request Leave</AppText>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Leave type */}
            <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Leave Type</AppText>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setLeaveType(t)}
                  style={[
                    styles.typeChip,
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

            {/* Start date */}
            <View style={styles.fieldLabel}>
              <DatePickerField
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
              />
            </View>

            {/* End date */}
            <View style={styles.fieldLabel}>
              <DatePickerField
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
              />
            </View>

            {/* Reason */}
            <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Reason</AppText>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
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
            />
            <View style={{ height: spacing[6] }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// ─── LeaveCard ────────────────────────────────────────────────────────────────

function LeaveCard({ item }: { item: LeaveRequest }) {
  const { colors } = useTheme()
  const status = STATUS_CONFIG[item.status]

  return (
    <AppCard elevation="sm" style={styles.leaveCard}>
      <View style={styles.leaveCardTop}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <View style={{ flexDirection: "row", gap: spacing[2] }}>
            <View style={[styles.typeBadge, { backgroundColor: colors.accentSubtle }]}>
              <AppText variant="caption" style={{ color: colors.accent, fontSize: 11 }}>{item.leaveType}</AppText>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: status.color + "22" }]}>
              <AppText variant="caption" style={{ color: status.color, fontSize: 11 }}>{status.label}</AppText>
            </View>
          </View>
          <AppText variant="caption" color="tertiary" numberOfLines={1}>{item.reason}</AppText>
        </View>
        <AppText variant="bodyMedium" style={{ color: colors.text.secondary }}>
          {item.numberOfDays}d
        </AppText>
      </View>

      <View style={[styles.leaveCardMeta, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <Calendar size={13} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="secondary">
            {moment(item.startDate).format("D MMM")} – {moment(item.endDate).format("D MMM YYYY")}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <Clock size={13} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="tertiary">
            {moment(item.createdAt).fromNow()}
          </AppText>
        </View>
      </View>
    </AppCard>
  )
}

// ─── SwipeableLeaveCard ───────────────────────────────────────────────────────

const DELETE_WIDTH = 80

function SwipeableLeaveCard({
  item,
  onDelete,
  isDeleting,
}: {
  item: LeaveRequest
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const translateX = useRef(new Animated.Value(0)).current
  const isOpen = useRef(false)
  const [deleteActive, setDeleteActive] = useState(false)

  // Slide card fully off screen when deletion is in progress
  useEffect(() => {
    if (isDeleting) {
      Animated.timing(translateX, { toValue: -500, duration: 280, useNativeDriver: true }).start()
    }
  }, [isDeleting])

  const btnOpacity = translateX.interpolate({
    inputRange: [-DELETE_WIDTH, -DELETE_WIDTH * 0.3, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  })
  const btnScale = translateX.interpolate({
    inputRange: [-DELETE_WIDTH, 0],
    outputRange: [1, 0.6],
    extrapolate: "clamp",
  })

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        !isDeleting && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
      onPanResponderMove: (_, { dx }) => {
        const base = isOpen.current ? -DELETE_WIDTH : 0
        translateX.setValue(Math.max(Math.min(base + dx, 0), -DELETE_WIDTH))
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const offset = isOpen.current ? dx - DELETE_WIDTH : dx
        const shouldOpen = offset < -DELETE_WIDTH / 3 || vx < -0.5
        Animated.spring(translateX, {
          toValue: shouldOpen ? -DELETE_WIDTH : 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start()
        isOpen.current = shouldOpen
        setDeleteActive(shouldOpen)
      },
    })
  ).current

  function handleDelete() {
    isOpen.current = false
    onDelete(item.id)
  }

  return (
    <View style={styles.swipeRow} {...panResponder.panHandlers}>
      <Animated.View style={{ transform: [{ translateX }] }}>
        <LeaveCard item={item} />
      </Animated.View>
      <Animated.View
        pointerEvents={deleteActive || isDeleting ? "auto" : "none"}
        style={[
          styles.deleteAction,
          isDeleting
            ? { opacity: 1 }
            : { opacity: btnOpacity, transform: [{ scale: btnScale }] },
        ]}
      >
        <Pressable onPress={handleDelete} disabled={isDeleting} style={styles.deleteBtn}>
          {isDeleting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Trash2 size={18} color="#fff" strokeWidth={1.75} />
          }
        </Pressable>
      </Animated.View>
    </View>
  )
}

// ─── LeavesScreen ────────────────────────────────────────────────────────────

export default function LeavesScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [filter, setFilter] = useState<LeaveStatus | "all">("all")
  const [requestOpen, setRequestOpen] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-leaves", filter],
    queryFn: () => leaveService.getMyLeaves(filter === "all" ? undefined : filter),
  })

  const leaves = data?.data?.leaves ?? []

  // Enable LayoutAnimation on Android
  if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }

  const deleteMutation = useMutation({
    mutationFn: (leaveId: string) => leaveService.deleteLeave(leaveId),
    onSuccess: () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
    },
  })

  function onRequestSuccess() {
    queryClient.invalidateQueries({ queryKey: ["my-leaves"] })
    queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <AppText variant="heading2" style={{ flex: 1 }}>My Leaves</AppText>
        <Pressable
          onPress={() => setRequestOpen(true)}
          style={({ pressed }) => [styles.requestBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}
        >
          <Plus size={18} color="#fff" strokeWidth={2.5} />
          <AppText variant="caption" style={{ color: "#fff" }}>Request</AppText>
        </Pressable>
      </View>

      {/* Balance */}
      <View style={styles.balanceWrap}>
        <BalanceCard staffId={user?.user_id} />
      </View>

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
        data={leaves}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.status === "pending" ? (
            <SwipeableLeaveCard
              item={item}
              onDelete={deleteMutation.mutate}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
            />
          ) : (
            <LeaveCard item={item} />
          )
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
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

      <RequestModal
        visible={requestOpen}
        onClose={() => setRequestOpen(false)}
        onSuccess={onRequestSuccess}
      />
      </View>
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mobileContent: { flex: 1 },
  desktopContent: { flex: 1, maxWidth: 860, width: "100%", alignSelf: "center" },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
  },

  balanceWrap: { padding: spacing[4] },
  balanceCard: { gap: spacing[3] },
  balanceTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  balanceMeta: { alignItems: "flex-end", gap: spacing[1] },
  balanceTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: spacing[1] },
  balanceFill: { height: 6, borderRadius: 3 },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },
  filterTab: { paddingTop: spacing[3] },

  list: { padding: spacing[4], paddingBottom: spacing[16] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },

  swipeRow: { overflow: "hidden" },
  deleteAction: {
    position: "absolute",
    right: spacing[3],
    top: spacing[3],
    bottom: spacing[3],
    width: 52,
    backgroundColor: palette.error.default,
    borderRadius: radii.xl,
  },
  deleteBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  leaveCard: { padding: 0, overflow: "hidden" },
  leaveCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
  },
  typeBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.sm },
  leaveCardMeta: {
    flexDirection: "row",
    gap: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing[5],
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[5],
  },
  fieldLabel: { marginBottom: spacing[2], marginTop: spacing[4] },
  typeRow: { flexDirection: "row", gap: spacing[3] },
  typeChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    marginBottom: spacing[1],
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
})
