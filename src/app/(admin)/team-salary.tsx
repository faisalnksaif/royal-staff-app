import { formatAmount, toTitleCase } from "../../utils/helpers"
import { useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, TextInput, ScrollView } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, Plus, RefreshCw, Wallet, Clock, Banknote, History } from "lucide-react-native"
import Toast from "react-native-toast-message"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import DatePickerField from "../../components/shared/DatePickerField"
import Popup from "../../components/shared/Popup"
import ListRow, { ListRowPill } from "../../components/shared/ListRow"
import type { ActionMenuItem } from "../../components/shared/ActionMenu"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { useRole } from "../../hooks/useRole"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { salaryService } from "../../services/salaryService"
import { staffService } from "../../services/staffService"
import useAuthStore from "../../stores/useAuthStore"
import type { SalaryStructure, SalaryAdvance, SalaryAdvanceStatus, SalaryStructureStatus, GenerateAllPayrollResult, Payslip } from "../../types"

function salaryErrorMessage(e: unknown, fallback: string): string {
  return (e as Error)?.message ?? fallback
}

// ─── config ──────────────────────────────────────────────────────────────────

const STRUCTURE_STATUS_CONFIG: Record<SalaryStructureStatus, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: palette.warning.default },
  active:   { label: "Active",   color: palette.success.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
}

const ADVANCE_STATUS_CONFIG: Record<SalaryAdvanceStatus, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: palette.warning.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
  paid:     { label: "Paid",     color: palette.success.default },
}

type SalaryView = "structures" | "advances" | "payroll"

// ─── ReasonModal ──────────────────────────────────────────────────────────────

function ReasonModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
  title,
  description,
  placeholder,
  confirmLabel,
  confirmLabelLoading,
}: {
  visible: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isLoading: boolean
  title: string
  description: string
  placeholder: string
  confirmLabel: string
  confirmLabelLoading: string
}) {
  const { colors } = useTheme()
  const [reason, setReason] = useState("")

  function handleConfirm() {
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  if (!visible) return null

  return (
    <Popup title={title} onClose={onClose}>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
        {description}
      </AppText>
      <TextInput
        style={[styles.reasonInput, {
          borderColor: colors.border,
          color: colors.text.primary,
          backgroundColor: colors.background.secondary,
        }]}
        placeholder={placeholder}
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
          label={isLoading ? confirmLabelLoading : confirmLabel}
          onPress={handleConfirm}
          disabled={!reason.trim() || isLoading}
        />
      </View>
    </Popup>
  )
}

// ─── ProposeStructureModal ────────────────────────────────────────────────────

function ProposeStructureModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { colors } = useTheme()
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [basicPay, setBasicPay] = useState("")
  const [incentives, setIncentives] = useState("")
  const [effectiveFrom, setEffectiveFrom] = useState<Date | null>(null)
  const [error, setError] = useState("")

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getStaff(),
    enabled: visible,
  })
  const staffList = staffData?.data ?? []

  const mutation = useMutation({
    mutationFn: () => salaryService.proposeStructure({
      staffId: selectedStaffId!,
      basicPay: Number(basicPay),
      incentives: incentives ? Number(incentives) : 0,
      effectiveFrom: moment(effectiveFrom).format("YYYY-MM-DD"),
    }),
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (e) => setError(salaryErrorMessage(e, "Failed to propose structure")),
  })

  function reset() {
    setSelectedStaffId(null); setBasicPay(""); setIncentives(""); setEffectiveFrom(null); setError("")
  }

  function validate() {
    if (selectedStaffId == null) return "Please select a staff member"
    if (!basicPay || Number(basicPay) <= 0) return "Please enter a valid basic pay"
    if (!effectiveFrom) return "Please select an effective from date"
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
    <Popup title="Propose Salary Structure" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Staff Member</AppText>
        {isLoadingStaff ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
        ) : (
          <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
            {staffList.map((s) => {
              const isSelected = selectedStaffId === s.user_id
              return (
                <Pressable
                  key={s.user_id}
                  onPress={() => setSelectedStaffId(s.user_id!)}
                  style={[
                    styles.staffRow,
                    {
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent + "18" : "transparent",
                    },
                  ]}
                >
                  <StaffAvatar name={s.name} color={colors.accent} bgColor={colors.accentSubtle} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium">{toTitleCase(s.name)}</AppText>
                    <AppText variant="caption" color="tertiary">{toTitleCase(s.role ?? "")}</AppText>
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>
        )}

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Basic Pay</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
          placeholder="e.g. 25000"
          placeholderTextColor={colors.text.tertiary}
          value={basicPay}
          onChangeText={setBasicPay}
          keyboardType="numeric"
        />

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Incentives (optional)</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
          placeholder="e.g. 0"
          placeholderTextColor={colors.text.tertiary}
          value={incentives}
          onChangeText={setIncentives}
          keyboardType="numeric"
        />

        <View style={styles.fieldLabel}>
          <DatePickerField label="Effective From" value={effectiveFrom} onChange={setEffectiveFrom} placeholder="Select date" />
        </View>

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[2] }}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          label={mutation.isPending ? "Proposing…" : "Propose Structure"}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          style={{ marginTop: spacing[4] }}
        />
        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── GenerateAllPayrollModal ──────────────────────────────────────────────────

function GenerateAllPayrollModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: (result: GenerateAllPayrollResult) => void
}) {
  const { colors } = useTheme()
  const [month, setMonth] = useState(String(moment().month() + 1))
  const [year, setYear] = useState(String(moment().year()))
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: () => salaryService.generateAllPayroll(Number(month), Number(year)),
    onSuccess: (res) => { onSuccess(res.data); onClose(); reset() },
    onError: (e) => setError(salaryErrorMessage(e, "Failed to generate payroll")),
  })

  function reset() {
    setMonth(String(moment().month() + 1)); setYear(String(moment().year())); setError("")
  }

  function validate() {
    const m = Number(month)
    if (!m || m < 1 || m > 12) return "Please enter a valid month (1-12)"
    if (!year || Number(year) < 2000) return "Please enter a valid year"
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
    <Popup title="Generate Payroll for All Staff" onClose={onClose}>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
        Runs payroll for every staff member with an active salary structure for the given month. Staff without an active structure, or with payroll already generated, are skipped individually.
      </AppText>

      <View style={styles.monthYearRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Month</AppText>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
            placeholder="1-12"
            placeholderTextColor={colors.text.tertiary}
            value={month}
            onChangeText={setMonth}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Year</AppText>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
            placeholder="2026"
            placeholderTextColor={colors.text.tertiary}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
          />
        </View>
      </View>

      {error ? (
        <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[2] }}>
          {error}
        </AppText>
      ) : null}

      <AppButton
        label={mutation.isPending ? "Generating…" : "Generate for All Staff"}
        onPress={handleSubmit}
        disabled={mutation.isPending}
        style={{ marginTop: spacing[4] }}
      />
    </Popup>
  )
}

// ─── StructureCard ────────────────────────────────────────────────────────────

function StructureCard({
  item,
  index,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  canApprove,
}: {
  item: SalaryStructure
  index?: number
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
  canApprove: boolean
}) {
  const { colors, isDark } = useTheme()
  const status = STRUCTURE_STATUS_CONFIG[item.status] ?? { label: item.status ?? "Unknown", color: palette.neutral[500] }
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]
  const isBusy = isApproving || isRejecting

  const menuItems: ActionMenuItem[] = item.status === "pending" && canApprove
    ? [
        { label: "Approve", icon: <Check size={16} color={palette.success.default} strokeWidth={2.5} />, color: palette.success.default, onPress: onApprove },
        { label: "Reject", icon: <X size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onReject },
      ]
    : []

  const pills: ListRowPill[] = [
    { key: "status", label: status.label, color: status.color, bgColor: status.color + "22" },
  ]

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName ?? `Staff #${item.staffId}`)}
      pills={pills}
      trailing={
        <AppText variant="bodyMedium" style={{ color: colors.accent }}>
          ₹{formatAmount(item.basicPay)}
        </AppText>
      }
      menuItems={menuItems}
      isBusy={isBusy}
      metaLines={[
        <View key="details" style={styles.metaItem}>
          <Banknote size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            Incentives ₹{formatAmount(item.incentives)} · Effective {moment(item.effectiveFrom).format("D MMM YYYY")}
          </AppText>
        </View>,
        ...(item.status === "rejected" && item.rejectionReason
          ? [
              <AppText key="reason" variant="bodySmall" color="tertiary">
                {item.rejectionReason}
              </AppText>,
            ]
          : []),
      ]}
    />
  )
}

// ─── AdvanceCard ──────────────────────────────────────────────────────────────

function AdvanceCard({
  item,
  index,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  item: SalaryAdvance
  index?: number
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const { colors, isDark } = useTheme()
  const status = ADVANCE_STATUS_CONFIG[item.status] ?? { label: item.status ?? "Unknown", color: palette.neutral[500] }
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]
  const isBusy = isApproving || isRejecting

  const menuItems: ActionMenuItem[] = item.status === "pending"
    ? [
        { label: "Approve", icon: <Check size={16} color={palette.success.default} strokeWidth={2.5} />, color: palette.success.default, onPress: onApprove },
        { label: "Reject", icon: <X size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onReject },
      ]
    : []

  const pills: ListRowPill[] = [
    { key: "status", label: status.label, color: status.color, bgColor: status.color + "22" },
  ]

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName ?? `Staff #${item.staffId}`)}
      pills={pills}
      trailing={
        <AppText variant="bodyMedium" style={{ color: colors.accent }}>
          ₹{formatAmount(item.amount)}
        </AppText>
      }
      menuItems={menuItems}
      isBusy={isBusy}
      metaLines={[
        <View key="requested" style={styles.metaItem}>
          <Clock size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            Requested {moment(item.requestedAt).format("D MMM, h:mm A")} · {item.daysWorkedAtRequest} days worked
          </AppText>
        </View>,
        ...(item.status === "rejected" && item.rejectionReason
          ? [
              <AppText key="reason" variant="bodySmall" color="tertiary">
                {item.rejectionReason}
              </AppText>,
            ]
          : []),
      ]}
    />
  )
}

// ─── StructuresTab ────────────────────────────────────────────────────────────

function StructuresTab({ canApprove }: { canApprove: boolean }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [proposeOpen, setProposeOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const historyQueries = useQuery({
    queryKey: ["salary-structures-all"],
    queryFn: () => salaryService.getAllStructures(),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => salaryService.approveStructure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures-all"] })
      setActionId(null)
      Toast.show({ type: "success", text1: "Salary structure approved" })
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to approve structure") })
      setActionId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => salaryService.rejectStructure(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-structures-all"] })
      setRejectTarget(null)
      setActionId(null)
      Toast.show({ type: "success", text1: "Salary structure rejected" })
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to reject structure") })
      setActionId(null)
    },
  })

  const structures = historyQueries.data?.data ?? []

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => historyQueries.refetch()}
          hitSlop={8}
          style={{ padding: spacing[2] }}
        >
          {historyQueries.isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
        <Pressable onPress={() => setProposeOpen(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Plus size={16} color="#fff" strokeWidth={2.5} />
          <AppText variant="caption" style={{ color: "#fff" }}>Propose</AppText>
        </Pressable>
      </View>

      <FlatList
        data={structures}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <StructureCard
              item={item}
              index={index}
              onApprove={() => { setActionId(item.id); approveMutation.mutate(item.id) }}
              onReject={() => { setActionId(item.id); setRejectTarget(item.id) }}
              isApproving={approveMutation.isPending && actionId === item.id}
              isRejecting={rejectMutation.isPending && actionId === item.id}
              canApprove={canApprove}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        ListEmptyComponent={
          historyQueries.isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No salary structures found</AppText>
            </View>
          )
        }
      />

      <ProposeStructureModal
        visible={proposeOpen}
        onClose={() => setProposeOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["salary-structures-all"] })}
      />

      <ReasonModal
        visible={rejectTarget != null}
        onClose={() => { setRejectTarget(null); setActionId(null) }}
        onConfirm={(reason) => { if (rejectTarget) rejectMutation.mutate({ id: rejectTarget, reason }) }}
        isLoading={rejectMutation.isPending}
        title="Reject Salary Structure"
        description="Provide a reason for rejection (required)"
        placeholder="e.g. Basic pay exceeds department budget"
        confirmLabel="Reject"
        confirmLabelLoading="Rejecting…"
      />
    </View>
  )
}

// ─── AdvancesTab ──────────────────────────────────────────────────────────────

function AdvancesTab() {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const advancesQuery = useQuery({
    queryKey: ["salary-advances-all"],
    queryFn: () => salaryService.getAllAdvances(),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => salaryService.approveAdvance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-advances-all"] })
      setActionId(null)
      Toast.show({ type: "success", text1: "Advance approved" })
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to approve advance") })
      setActionId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => salaryService.rejectAdvance(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-advances-all"] })
      setRejectTarget(null)
      setActionId(null)
      Toast.show({ type: "success", text1: "Advance rejected" })
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to reject advance") })
      setActionId(null)
    },
  })

  const advances = advancesQuery.data?.data ?? []

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => advancesQuery.refetch()}
          hitSlop={8}
          style={{ padding: spacing[2] }}
        >
          {advancesQuery.isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
      </View>

      <FlatList
        data={advances}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <AdvanceCard
              item={item}
              index={index}
              onApprove={() => { setActionId(item.id); approveMutation.mutate(item.id) }}
              onReject={() => { setActionId(item.id); setRejectTarget(item.id) }}
              isApproving={approveMutation.isPending && actionId === item.id}
              isRejecting={rejectMutation.isPending && actionId === item.id}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        ListEmptyComponent={
          advancesQuery.isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No advance requests found</AppText>
            </View>
          )
        }
      />

      <ReasonModal
        visible={rejectTarget != null}
        onClose={() => { setRejectTarget(null); setActionId(null) }}
        onConfirm={(reason) => { if (rejectTarget) rejectMutation.mutate({ id: rejectTarget, reason }) }}
        isLoading={rejectMutation.isPending}
        title="Reject Advance Request"
        description="Provide a reason for rejection (required)"
        placeholder="e.g. Payroll already generated this month"
        confirmLabel="Reject"
        confirmLabelLoading="Rejecting…"
      />
    </View>
  )
}

// ─── PayrollTab ───────────────────────────────────────────────────────────────

function PayslipCard({ item, index }: { item: Payslip; index?: number }) {
  const { colors, isDark } = useTheme()
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]
  const monthLabel = moment(`${item.year}-${item.month}-01`, "YYYY-M-DD").format("MMMM YYYY")

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName ?? `Staff #${item.staffId}`)}
      trailing={
        <AppText variant="bodyMedium" style={{ color: colors.accent }}>
          ₹{formatAmount(item.netPay)}
        </AppText>
      }
      metaLines={[
        <View key="month" style={styles.metaItem}>
          <Banknote size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            {monthLabel} · Basic ₹{formatAmount(item.basicPay)} + Incentives ₹{formatAmount(item.incentives)}
          </AppText>
        </View>,
        ...(item.deductions > 0 || item.advancesDeducted > 0
          ? [
              <AppText key="deductions" variant="bodySmall" color="tertiary">
                Deductions ₹{formatAmount(item.deductions)}{item.advancesDeducted > 0 ? ` · Advances ₹${formatAmount(item.advancesDeducted)}` : ""}
              </AppText>,
            ]
          : []),
      ]}
    />
  )
}

function PayrollTab() {
  const { colors } = useTheme()
  const [generateOpen, setGenerateOpen] = useState(false)
  const [lastResult, setLastResult] = useState<GenerateAllPayrollResult | null>(null)

  const payslipsQuery = useQuery({
    queryKey: ["salary-payslips-all"],
    queryFn: () => salaryService.getAllPayslips(),
  })

  function handleSuccess(result: GenerateAllPayrollResult) {
    setLastResult(result)
    payslipsQuery.refetch()
    Toast.show({
      type: result.failed > 0 ? "info" : "success",
      text1: `Payroll generated for ${result.generated} of ${result.totalStaff} staff`,
      text2: result.failed > 0 ? `${result.failed} skipped` : undefined,
    })
  }

  const failedResults = lastResult?.results.filter((r) => !r.success) ?? []
  const payslips = payslipsQuery.data?.data ?? []

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => payslipsQuery.refetch()}
          hitSlop={8}
          style={{ padding: spacing[2] }}
        >
          {payslipsQuery.isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
        <Pressable onPress={() => setGenerateOpen(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Wallet size={16} color="#fff" strokeWidth={2.5} />
          <AppText variant="caption" style={{ color: "#fff" }}>Generate</AppText>
        </Pressable>
      </View>

      {lastResult && (
        <View style={[styles.payrollSummary, { borderColor: colors.border, marginHorizontal: spacing[4] }]}>
          <View style={styles.payrollSummaryRow}>
            <View style={styles.payrollSummaryStat}>
              <AppText variant="heading3" color="primary">{lastResult.totalStaff}</AppText>
              <AppText variant="caption" color="tertiary">Total Staff</AppText>
            </View>
            <View style={styles.payrollSummaryStat}>
              <AppText variant="heading3" style={{ color: palette.success.default }}>{lastResult.generated}</AppText>
              <AppText variant="caption" color="tertiary">Generated</AppText>
            </View>
            <View style={styles.payrollSummaryStat}>
              <AppText variant="heading3" style={{ color: palette.error.default }}>{lastResult.failed}</AppText>
              <AppText variant="caption" color="tertiary">Skipped</AppText>
            </View>
          </View>

          {failedResults.length > 0 && (
            <View style={{ width: "100%", marginTop: spacing[4] }}>
              <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>Skipped staff</AppText>
              {failedResults.map((r) => (
                <View key={r.staffId} style={[styles.payrollFailRow, { borderBottomColor: colors.border }]}>
                  <AppText variant="bodySmall">Staff #{r.staffId}</AppText>
                  <AppText variant="caption" color="tertiary" numberOfLines={1} style={{ flex: 1, textAlign: "right" }}>
                    {r.error ?? "Failed"}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <FlatList
        data={payslips}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <PayslipCard item={item} index={index} />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        ListEmptyComponent={
          payslipsQuery.isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No payslips generated yet</AppText>
            </View>
          )
        }
      />

      <GenerateAllPayrollModal
        visible={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onSuccess={handleSuccess}
      />
    </View>
  )
}

// ─── SalaryScreen ─────────────────────────────────────────────────────────────

export default function SalaryScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const { isSuperAdmin } = useRole()
  const [view, setView] = useState<SalaryView>("structures")

  const tabs: Array<{ label: string; value: SalaryView; icon: React.ComponentType<any> }> = [
    { label: "Structures", value: "structures", icon: Banknote },
    { label: "Advances", value: "advances", icon: Clock },
    { label: "Payroll", value: "payroll", icon: History },
  ]

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Salary Management</AppText>
          <AppText variant="caption" color="tertiary">Structures, payroll and advances</AppText>
        </View>
      </View>

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

      {view === "structures" && <StructuresTab canApprove={isSuperAdmin} />}
      {view === "advances" && <AdvancesTab />}
      {view === "payroll" && <PayrollTab />}
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
  filterTab: { paddingTop: spacing[3] },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    marginLeft: spacing[2],
  },

  rowList: { paddingBottom: spacing[16] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[8],
  },

  metaItem: { flexDirection: "row", alignItems: "center", gap: spacing[2] },

  fieldLabel: { marginBottom: spacing[2], marginTop: spacing[4] },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
  },
  monthYearRow: { flexDirection: "row", gap: spacing[3] },
  payrollSummary: {
    width: "100%",
    maxWidth: 420,
    marginTop: spacing[6],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  payrollSummaryRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  payrollSummaryStat: { alignItems: "center", gap: spacing[1] },
  payrollFailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1.5,
    marginBottom: spacing[2],
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
