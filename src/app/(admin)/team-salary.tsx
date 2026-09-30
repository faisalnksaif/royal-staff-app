import { formatAmount, toTitleCase } from "../../utils/helpers"
import { useState, useEffect, useRef } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, TextInput, ScrollView } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { Check, X, Plus, RefreshCw, Wallet, Clock, Banknote, History, TrendingUp, MinusCircle, Trash2, CalendarClock, ChevronLeft, ChevronRight, ChevronDown, Search, Users, LogOut, Download } from "lucide-react-native"
import Toast from "react-native-toast-message"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import PayBreakdown from "../../components/shared/PayBreakdown"
import DatePickerField from "../../components/shared/DatePickerField"
import Popup from "../../components/shared/Popup"
import ErrorRetry from "../../components/shared/ErrorRetry"
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
import { exportService } from "../../services/exportService"
import useAuthStore from "../../stores/useAuthStore"
import type { SalaryStructure, SalaryAdvance, SalaryAdvanceStatus, SalaryStructureStatus, GenerateAllPayrollResult, Payslip, SalaryIncentive, SalaryPenalty, PayrollPreview, MissedCheckoutsResult } from "../../types"

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

type SalaryView = "structures" | "advances" | "incentives" | "penalties" | "payroll" | "preview"

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

// ─── StaffPicker ──────────────────────────────────────────────────────────────
// Shared by the incentive and penalty modals - both are "pick a staff member,
// a month, an amount and a reason", so the picker and the month/year row live
// here rather than being written twice.

function StaffPicker({
  selectedStaffId,
  onSelect,
  enabled,
}: {
  selectedStaffId: number | null
  onSelect: (id: number) => void
  enabled: boolean
}) {
  const { colors } = useTheme()
  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getStaff(),
    enabled,
  })
  const staffList = staffData?.data ?? []

  if (isLoading) {
    return <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
  }

  return (
    <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
      {staffList.map((s) => {
        const isSelected = selectedStaffId === s.user_id
        return (
          <Pressable
            key={s.user_id}
            onPress={() => onSelect(s.user_id!)}
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
  )
}

function MonthYearRow({
  month, year, onMonth, onYear,
}: {
  month: string
  year: string
  onMonth: (v: string) => void
  onYear: (v: string) => void
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.monthYearRow}>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Month</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
          placeholder="1-12"
          placeholderTextColor={colors.text.tertiary}
          value={month}
          onChangeText={onMonth}
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
          onChangeText={onYear}
          keyboardType="numeric"
        />
      </View>
    </View>
  )
}

// ─── AddPayLineModal ──────────────────────────────────────────────────────────
// One modal for both incentives and penalties - the fields are identical and
// only the wording, colour and endpoint differ.

function AddPayLineModal({
  visible,
  kind,
  onClose,
  onSuccess,
}: {
  visible: boolean
  kind: "incentive" | "penalty"
  onClose: () => void
  onSuccess: () => void
}) {
  const { colors } = useTheme()
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [month, setMonth] = useState(String(moment().month() + 1))
  const [year, setYear] = useState(String(moment().year()))
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const isIncentive = kind === "incentive"

  const mutation = useMutation({
    mutationFn: async (): Promise<{ success: boolean }> => {
      const payload = {
        staffId: selectedStaffId!,
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        reason: reason.trim(),
      }
      // Both endpoints return differently-shaped payloads; the modal only
      // needs to know the write succeeded, so narrow to the common shape
      // rather than leaking a union the caller would have to discriminate.
      const res = isIncentive
        ? await salaryService.addIncentive(payload)
        : await salaryService.addPenalty(payload)
      return { success: res.success }
    },
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (e) => setError(salaryErrorMessage(e, `Failed to add ${kind}`)),
  })

  function reset() {
    setSelectedStaffId(null)
    setMonth(String(moment().month() + 1))
    setYear(String(moment().year()))
    setAmount("")
    setReason("")
    setError("")
  }

  function handleSubmit() {
    if (selectedStaffId == null) return setError("Please select a staff member")
    const m = Number(month)
    if (!m || m < 1 || m > 12) return setError("Please enter a valid month (1-12)")
    if (!year || Number(year) < 2000) return setError("Please enter a valid year")
    if (!amount || Number(amount) <= 0) return setError("Please enter an amount greater than 0")
    if (!reason.trim()) return setError("A reason is required")
    setError("")
    mutation.mutate()
  }

  if (!visible) return null

  return (
    <Popup title={isIncentive ? "Add Incentive" : "Impose Penalty"} onClose={onClose} maxWidth={520}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="body" color="secondary" style={{ marginBottom: spacing[3] }}>
          {isIncentive
            ? "Added to the staff member's pay for the month, on top of basic. Not reduced by absence."
            : "Deducted from net pay after incentives. Recorded against you, with the reason shown on the payslip."}
        </AppText>

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Staff Member</AppText>
        <StaffPicker selectedStaffId={selectedStaffId} onSelect={setSelectedStaffId} enabled={visible} />

        <MonthYearRow month={month} year={year} onMonth={setMonth} onYear={setYear} />

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Amount</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
          placeholder="e.g. 5000"
          placeholderTextColor={colors.text.tertiary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Reason</AppText>
        <TextInput
          style={[styles.reasonInput, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary }]}
          placeholder={isIncentive ? "e.g. Sales target achieved" : "e.g. Damage to stock"}
          placeholderTextColor={colors.text.tertiary}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[2] }}>
            {error}
          </AppText>
        ) : null}

        <View style={styles.modalActions}>
          <AppButton label="Cancel" variant="ghost" onPress={onClose} disabled={mutation.isPending} />
          <AppButton
            label={mutation.isPending ? "Saving…" : isIncentive ? "Add Incentive" : "Impose Penalty"}
            variant={isIncentive ? "primary" : "destructive"}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          />
        </View>
      </ScrollView>
    </Popup>
  )
}

// ─── IncentivesTab ────────────────────────────────────────────────────────────

function IncentiveCard({
  item, index, onDelete, isDeleting,
}: {
  item: SalaryIncentive
  index?: number
  onDelete: () => void
  isDeleting: boolean
}) {
  const { colors, isDark } = useTheme()
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]
  const monthLabel = moment(`${item.year}-${item.month}-01`, "YYYY-M-DD").format("MMM YYYY")

  const pills: ListRowPill[] = [
    item.source === "auto"
      ? { key: "src", label: "Auto", color: palette.info.default, bgColor: palette.info.default + "22" }
      : { key: "src", label: "Manual", color: palette.neutral[500], bgColor: palette.neutral[500] + "22", muted: true },
  ]

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName ?? `Staff #${item.staffId}`)}
      pills={pills}
      isBusy={isDeleting}
      trailing={
        <AppText variant="bodyMedium" style={{ color: palette.success.default }}>
          +₹{formatAmount(item.amount)}
        </AppText>
      }
      menuItems={[
        { label: "Remove", icon: <Trash2 size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onDelete },
      ]}
      metaLines={[
        <View key="detail" style={styles.metaItem}>
          <TrendingUp size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            {monthLabel} · {item.reason}
          </AppText>
        </View>,
      ]}
    />
  )
}

function IncentivesTab() {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const incentivesQuery = useQuery({
    queryKey: ["salary-incentives"],
    queryFn: () => salaryService.getIncentives(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salaryService.deleteIncentive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-incentives"] })
      setActionId(null)
      Toast.show({ type: "success", text1: "Incentive removed" })
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to remove incentive") })
      setActionId(null)
    },
  })

  const incentives = incentivesQuery.data?.data ?? []

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => incentivesQuery.refetch()} hitSlop={8} style={{ padding: spacing[2] }}>
          {incentivesQuery.isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
        </Pressable>
        <Pressable onPress={() => setAddOpen(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Plus size={16} color="#fff" strokeWidth={2.5} />
          <AppText variant="caption" style={{ color: "#fff" }}>Add</AppText>
        </Pressable>
      </View>

      <FlatList
        data={incentives}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <IncentiveCard
              item={item}
              index={index}
              onDelete={() => { setActionId(item.id); deleteMutation.mutate(item.id) }}
              isDeleting={deleteMutation.isPending && actionId === item.id}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        ListEmptyComponent={
          incentivesQuery.isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No incentives recorded yet</AppText>
            </View>
          )
        }
      />

      <AddPayLineModal
        visible={addOpen}
        kind="incentive"
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          incentivesQuery.refetch()
          Toast.show({ type: "success", text1: "Incentive added" })
        }}
      />
    </View>
  )
}

// ─── PenaltiesTab ─────────────────────────────────────────────────────────────

function PenaltyCard({
  item, index, onRevoke, isRevoking, canRevoke,
}: {
  item: SalaryPenalty
  index?: number
  onRevoke: () => void
  isRevoking: boolean
  canRevoke: boolean
}) {
  const { colors, isDark } = useTheme()
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]
  const monthLabel = moment(`${item.year}-${item.month}-01`, "YYYY-M-DD").format("MMM YYYY")

  const pills: ListRowPill[] = item.isRevoked
    ? [{ key: "revoked", label: "Revoked", color: palette.neutral[500], bgColor: palette.neutral[500] + "22", muted: true }]
    : []

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName ?? `Staff #${item.staffId}`)}
      pills={pills}
      isBusy={isRevoking}
      trailing={
        <AppText
          variant="bodyMedium"
          style={{
            color: item.isRevoked ? colors.text.tertiary : palette.error.default,
            textDecorationLine: item.isRevoked ? "line-through" : "none",
          }}
        >
          −₹{formatAmount(item.amount)}
        </AppText>
      }
      menuItems={!item.isRevoked && canRevoke
        ? [{ label: "Revoke", icon: <X size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onRevoke }]
        : []}
      metaLines={[
        <View key="detail" style={styles.metaItem}>
          <MinusCircle size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            {monthLabel} · {item.reason}
          </AppText>
        </View>,
        ...(item.isRevoked && item.revokeReason
          ? [<AppText key="rr" variant="bodySmall" color="tertiary">Revoked: {item.revokeReason}</AppText>]
          : []),
      ]}
    />
  )
}

function PenaltiesTab({ canImpose }: { canImpose: boolean }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const penaltiesQuery = useQuery({
    queryKey: ["salary-penalties"],
    queryFn: () => salaryService.getPenalties({ includeRevoked: true }),
  })

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => salaryService.revokePenalty(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-penalties"] })
      setRevokeTarget(null)
      setActionId(null)
      Toast.show({ type: "success", text1: "Penalty revoked" })
    },
    onError: (e) => {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to revoke penalty") })
      setActionId(null)
    },
  })

  const penalties = penaltiesQuery.data?.data ?? []

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => penaltiesQuery.refetch()} hitSlop={8} style={{ padding: spacing[2] }}>
          {penaltiesQuery.isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
        </Pressable>
        {canImpose && (
          <Pressable onPress={() => setAddOpen(true)} style={[styles.addBtn, { backgroundColor: palette.error.default }]}>
            <Plus size={16} color="#fff" strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: "#fff" }}>Penalty</AppText>
          </Pressable>
        )}
      </View>

      <FlatList
        data={penalties}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <PenaltyCard
              item={item}
              index={index}
              canRevoke={canImpose}
              onRevoke={() => { setActionId(item.id); setRevokeTarget(item.id) }}
              isRevoking={revokeMutation.isPending && actionId === item.id}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.rowList}
        ListEmptyComponent={
          penaltiesQuery.isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No penalties imposed</AppText>
            </View>
          )
        }
      />

      <AddPayLineModal
        visible={addOpen}
        kind="penalty"
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          penaltiesQuery.refetch()
          Toast.show({ type: "success", text1: "Penalty imposed" })
        }}
      />

      <ReasonModal
        visible={revokeTarget != null}
        onClose={() => { setRevokeTarget(null); setActionId(null) }}
        onConfirm={(reason) => { if (revokeTarget) revokeMutation.mutate({ id: revokeTarget, reason }) }}
        isLoading={revokeMutation.isPending}
        title="Revoke Penalty"
        description="The penalty stops counting toward payroll, but the record of it having been imposed is kept."
        placeholder="e.g. Imposed in error"
        confirmLabel="Revoke"
        confirmLabelLoading="Revoking…"
      />
    </View>
  )
}

// ─── GenerateAllPayrollModal ──────────────────────────────────────────────────

function GenerateAllPayrollModal({
  visible,
  onClose,
  onSuccess,
  initialPeriod,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: (result: GenerateAllPayrollResult) => void
  /** The month on screen - the modal opens on it rather than today's month. */
  initialPeriod?: moment.Moment
}) {
  const { colors } = useTheme()
  const openMonthlyAttendance = useOpenMonthlyAttendance()
  const [month, setMonth] = useState(String(moment().month() + 1))
  const [year, setYear] = useState(String(moment().year()))
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)
  // Set when the month has missed checkouts: the modal switches to asking
  // for them to be fixed first, with "generate anyway" as the way past.
  const [missed, setMissed] = useState<MissedCheckoutsResult | null>(null)

  useEffect(() => {
    if (!visible) return
    setMissed(null)
    if (!initialPeriod) return
    setMonth(String(initialPeriod.month() + 1))
    setYear(String(initialPeriod.year()))
  }, [visible])

  const mutation = useMutation({
    mutationFn: () => salaryService.generateAllPayroll(Number(month), Number(year)),
    onSuccess: (res) => { onSuccess(res.data); onClose(); reset() },
    onError: (e) => setError(salaryErrorMessage(e, "Failed to generate payroll")),
  })

  function reset() {
    setMonth(String(moment().month() + 1)); setYear(String(moment().year())); setError(""); setMissed(null)
  }

  function validate() {
    const m = Number(month)
    if (!m || m < 1 || m > 12) return "Please enter a valid month (1-12)"
    if (!year || Number(year) < 2000) return "Please enter a valid year"
    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    setChecking(true)
    try {
      const res = await salaryService.getMissedCheckouts(Number(month), Number(year))
      if (res.data.totalDays > 0) { setMissed(res.data); return }
    } catch (e) {
      setError(salaryErrorMessage(e, "Couldn't check for missed checkouts"))
      return
    } finally {
      setChecking(false)
    }
    mutation.mutate()
  }

  function fix(staffId: number) {
    openMonthlyAttendance(staffId, Number(month), Number(year), "missedCheckout")
    onClose()
    reset()
  }

  if (!visible) return null

  if (missed) {
    const period = moment({ year: Number(year), month: Number(month) - 1 }).format("MMMM YYYY")
    return (
      <Popup title="Fix missed checkouts first" onClose={onClose}>
        <AppText variant="body" color="secondary" style={{ marginBottom: spacing[3] }}>
          {missed.totalDays} day{missed.totalDays === 1 ? "" : "s"} in {period} {missed.totalDays === 1 ? "has" : "have"} no checkout, so those hours aren't counted. Fix them before generating - payroll for these staff can't be approved until you do.
        </AppText>
        <View style={{ marginBottom: spacing[3] }}>
          {missed.staff.map((m) => (
            <Pressable
              key={m.staffId}
              onPress={() => fix(m.staffId)}
              style={[styles.payrollFailRow, { borderBottomColor: colors.border }]}
            >
              <AppText variant="bodySmall">{toTitleCase(m.staffName)}</AppText>
              <AppText variant="caption" style={{ flex: 1, textAlign: "right", color: palette.error.default }} numberOfLines={1}>
                {formatDates(m.dates)}  Fix ›
              </AppText>
            </Pressable>
          ))}
        </View>
        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[2] }}>
            {error}
          </AppText>
        ) : null}
        <View style={styles.modalActions}>
          <AppButton label="Back" variant="ghost" onPress={() => setMissed(null)} />
          <AppButton
            label={mutation.isPending ? "Generating…" : "Generate drafts anyway"}
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
          />
        </View>
      </Popup>
    )
  }

  return (
    <Popup title="Generate Payroll for All Staff" onClose={onClose}>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
        Generates draft payroll for every staff member with an active salary structure for the given month. Existing drafts are regenerated with the latest figures; staff whose payroll is already approved, or without an active structure, are skipped.
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
        label={checking ? "Checking attendance…" : mutation.isPending ? "Generating…" : "Generate for All Staff"}
        onPress={handleSubmit}
        disabled={checking || mutation.isPending}
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

// ─── PayrollPreviewTab ────────────────────────────────────────────────────────
// Salary up to today: superAdmin picks a staff member and sees what they have
// earned so far this month, plus where the month lands if the rest is worked.
// Read-only - hitting this never creates a PayrollRecord.

/** Searchable staff list - a persistent side panel on tablet, a popup on phone. */
function PreviewStaffList({
  selectedStaffId,
  onSelect,
  autoFocus,
}: {
  selectedStaffId: number | null
  onSelect: (id: number) => void
  autoFocus?: boolean
}) {
  const { colors } = useTheme()
  const [q, setQ] = useState("")
  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getStaff(),
  })
  const staffList = data?.data ?? []
  const filtered = q.trim()
    ? staffList.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()))
    : staffList

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}>
        <Search size={14} color={colors.text.tertiary} strokeWidth={1.75} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search staff…"
          placeholderTextColor={colors.text.tertiary}
          value={q}
          onChangeText={setQ}
          autoFocus={autoFocus}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[6] }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing[4] }}>
          {filtered.map((s) => {
            const isSelected = selectedStaffId === s.user_id
            return (
              <Pressable
                key={s.user_id}
                onPress={() => onSelect(s.user_id!)}
                style={[styles.previewStaffRow, isSelected && { backgroundColor: colors.accent + "18" }]}
              >
                <StaffAvatar name={s.name} color={colors.accent} bgColor={colors.accentSubtle} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium" numberOfLines={1} style={isSelected ? { color: colors.accent } : undefined}>
                    {toTitleCase(s.name)}
                  </AppText>
                  <AppText variant="caption" color="tertiary" numberOfLines={1}>{toTitleCase(s.role ?? "")}</AppText>
                </View>
                {isSelected && <Check size={16} color={colors.accent} strokeWidth={2.5} />}
              </Pressable>
            )
          })}
          {filtered.length === 0 && (
            <AppText variant="caption" color="tertiary" style={{ padding: spacing[4], textAlign: "center" }}>
              No staff found
            </AppText>
          )}
        </ScrollView>
      )}
    </View>
  )
}

/** ‹ September 2026 › - can't step past the current month, there's nothing to preview there. */
function MonthStepper({ value, onChange }: { value: moment.Moment; onChange: (m: moment.Moment) => void }) {
  const { colors } = useTheme()
  const canGoNext = value.isBefore(moment(), "month")
  return (
    <View style={[styles.monthStepper, { borderColor: colors.border }]}>
      <Pressable onPress={() => onChange(value.clone().subtract(1, "month"))} hitSlop={8} style={styles.stepperBtn}>
        <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
      </Pressable>
      <AppText variant="bodyMedium" style={{ minWidth: 120, textAlign: "center" }}>{value.format("MMMM YYYY")}</AppText>
      <Pressable
        onPress={() => canGoNext && onChange(value.clone().add(1, "month"))}
        hitSlop={8}
        disabled={!canGoNext}
        style={[styles.stepperBtn, !canGoNext && { opacity: 0.3 }]}
      >
        <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

function PreviewStat({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<any>
  label: string
  value: string
  tone?: string
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.previewStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.metaItem}>
        <Icon size={14} color={tone ?? colors.text.tertiary} strokeWidth={1.75} />
        <AppText variant="caption" color="tertiary" numberOfLines={1}>{label}</AppText>
      </View>
      <AppText variant="heading3" style={tone ? { color: tone } : undefined}>{value}</AppText>
    </View>
  )
}

/**
 * Opens the monthly attendance page on the given staff member and month,
 * filtered to the days that need attention (overtime awaiting approval, or
 * missed checkouts). Salary keys staff by Users.user_id, so that's what's
 * passed - the attendance page maps it to its own Staff.id.
 */
function useOpenMonthlyAttendance() {
  const router = useRouter()
  return (userId: number, month: number, year: number, filter: "pendingOvertime" | "missedCheckout") =>
    router.push({
      pathname: "/(admin)/attendance-monthly",
      params: {
        userId: String(userId),
        month: moment({ year, month: month - 1 }).format("YYYY-MM"),
        filter,
      },
    })
}

/** "2026-09-29" list -> "29 Sep, 30 Sep". */
function formatDates(dates: string[]): string {
  return dates.map((d) => moment(d, "YYYY-MM-DD").format("D MMM")).join(", ")
}

/**
 * Missed checkouts block approval: those days' hours are unknown, so overtime
 * and early-checkout figures for them can't be trusted. Tapping jumps to the
 * monthly attendance page filtered to them, where the sessions are edited.
 */
function MissedCheckoutNotice({ dates, onFix }: { dates: string[]; onFix?: () => void }) {
  if (dates.length === 0) return null
  const content = (
    <>
      <LogOut size={14} color={palette.error.default} strokeWidth={1.75} />
      <AppText variant="caption" style={{ color: palette.error.default, flex: 1 }}>
        Missed checkout on {formatDates(dates)} - fix {dates.length > 1 ? "these days" : "this day"} before approving payroll.
        {onFix ? "  Fix ›" : ""}
      </AppText>
    </>
  )
  const style = [styles.previewNotice, { backgroundColor: palette.error.default + "18" }]
  return onFix ? (
    <Pressable onPress={onFix} style={style}>{content}</Pressable>
  ) : (
    <View style={style}>{content}</View>
  )
}

function PreviewResult({ preview }: { preview: PayrollPreview }) {
  const openMonthlyAttendance = useOpenMonthlyAttendance()
  const { colors } = useTheme()
  const monthStart = moment(`${preview.year}-${preview.month}-01`, "YYYY-M-DD")
  const asOf = moment(preview.asOf, "YYYY-MM-DD")
  const daysElapsed = preview.isPartial ? asOf.date() : preview.daysInMonth
  const progress = Math.min(1, daysElapsed / preview.daysInMonth)
  const overtimeHours = preview.overtimeMinutes / 60

  return (
    <View style={{ gap: spacing[4] }}>
      {/* Hero: earned so far, with the month's progress and where it lands */}
      <View style={[styles.previewHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.previewHeroTop}>
          <View style={{ flex: 1, minWidth: 180, gap: spacing[1] }}>
            <AppText variant="caption" color="tertiary">
              {preview.isPartial ? `Earned up to ${asOf.format("D MMM")}` : `Earned in ${monthStart.format("MMMM")}`}
            </AppText>
            <AppText variant="heading1" style={{ color: colors.accent }}>₹{formatAmount(preview.netPay)}</AppText>
            <AppText variant="caption" color="tertiary">
              Net pay · basic ₹{formatAmount(preview.basicPay)}/month
            </AppText>
          </View>
          {preview.isPartial && (
            <View style={[styles.previewProjection, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.metaItem}>
                <CalendarClock size={14} color={colors.text.tertiary} strokeWidth={1.5} />
                <AppText variant="caption" color="tertiary">Projected for {monthStart.format("MMMM")}</AppText>
              </View>
              <AppText variant="heading3">₹{formatAmount(preview.projected.netPay)}</AppText>
              <AppText variant="caption" color="tertiary">if the rest is worked in full</AppText>
            </View>
          )}
        </View>

        <View style={{ gap: spacing[2] }}>
          <View style={[styles.progressTrack, { backgroundColor: colors.background.tertiary }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
          </View>
          <View style={styles.progressLabels}>
            <AppText variant="caption" color="tertiary">Day {daysElapsed} of {preview.daysInMonth}</AppText>
            <AppText variant="caption" color="tertiary">
              {preview.isPartial ? `${preview.daysInMonth - daysElapsed} days left` : "Month complete"}
            </AppText>
          </View>
        </View>
      </View>

      {preview.payrollAlreadyGenerated && (
        <View style={[styles.previewNotice, { backgroundColor: palette.warning.default + "18" }]}>
          <Clock size={14} color={palette.warning.default} strokeWidth={1.75} />
          <AppText variant="caption" style={{ color: palette.warning.default, flex: 1 }}>
            Payroll for this month has already been approved - this preview is informational only.
          </AppText>
        </View>
      )}

      <MissedCheckoutNotice
        dates={preview.missedCheckoutDates ?? []}
        onFix={() => openMonthlyAttendance(preview.staffId, preview.month, preview.year, "missedCheckout")}
      />

      <View style={styles.previewStats}>
        <PreviewStat icon={Banknote} label="Per day" value={`₹${formatAmount(preview.perDayPay)}`} />
        <PreviewStat
          icon={X}
          label="Unpaid absences"
          value={String(preview.unpaidAbsenceDays)}
          tone={preview.unpaidAbsenceDays > 0 ? palette.error.default : undefined}
        />
        <PreviewStat
          icon={MinusCircle}
          label="Half-days"
          value={String(preview.halfDays)}
          tone={preview.halfDays > 0 ? palette.warning.default : undefined}
        />
        <PreviewStat
          icon={TrendingUp}
          label="Overtime"
          value={overtimeHours > 0 ? `${overtimeHours.toFixed(1)}h` : "—"}
          tone={overtimeHours > 0 ? palette.success.default : undefined}
        />
      </View>

      <View>
        <AppText variant="bodyMedium" style={{ marginBottom: spacing[2] }}>Breakdown</AppText>
        <PayBreakdown
          basicPay={preview.basicPay}
          basicPayEarned={preview.basicPayEarned}
          deductionAmount={preview.deductionAmount}
          deductionDetails={preview.deductionDetails}
          incentives={preview.incentives}
          incentiveDetails={preview.incentiveDetails}
          overtimePay={preview.overtimePay}
          overtimeMinutes={preview.overtimeMinutes}
          hourlyRate={preview.hourlyRate}
          overtimeDetails={preview.overtimeDetails}
          pendingOvertimeMinutes={preview.pendingOvertimeMinutes}
          breakExcessDeduction={preview.breakExcessDeduction}
          breakExcessMinutes={preview.breakExcessMinutes}
          breakExcessDetails={preview.breakExcessDetails}
          waivedBreakExcessMinutes={preview.waivedBreakExcessMinutes}
          earlyCheckoutDeduction={preview.earlyCheckoutDeduction}
          earlyCheckoutMinutes={preview.earlyCheckoutMinutes}
          earlyCheckoutDetails={preview.earlyCheckoutDetails}
          penaltyAmount={preview.penaltyAmount}
          penaltyDetails={preview.penaltyDetails}
          advanceDeducted={preview.advanceDeducted}
          grossPay={preview.grossPay}
          netPay={preview.netPay}
          expanded
          onPendingOvertimePress={() => openMonthlyAttendance(preview.staffId, preview.month, preview.year, "pendingOvertime")}
        />
      </View>
    </View>
  )
}

function PayrollPreviewTab() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [period, setPeriod] = useState(() => moment().startOf("month"))
  const [pickerOpen, setPickerOpen] = useState(false)

  const month = period.month() + 1
  const year = period.year()

  const { data: staffData } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getStaff(),
  })
  const selectedStaff = staffData?.data?.find((s) => s.user_id === selectedStaffId)

  const previewQuery = useQuery({
    queryKey: ["salary-preview", selectedStaffId, month, year],
    queryFn: () => salaryService.previewPayroll(selectedStaffId!, month, year),
    enabled: selectedStaffId != null,
  })
  const preview: PayrollPreview | undefined = previewQuery.data?.data

  const toolbar = (
    <View style={styles.previewToolbar}>
      {!isTablet && (
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.staffSelectBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          {selectedStaff ? (
            <StaffAvatar name={selectedStaff.name} color={colors.accent} bgColor={colors.accentSubtle} />
          ) : (
            <Users size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          )}
          <AppText
            variant="bodyMedium"
            numberOfLines={1}
            style={{ flex: 1, color: selectedStaff ? colors.text.primary : colors.text.tertiary }}
          >
            {selectedStaff ? toTitleCase(selectedStaff.name) : "Choose staff member"}
          </AppText>
          <ChevronDown size={16} color={colors.text.tertiary} strokeWidth={2} />
        </Pressable>
      )}
      {isTablet && selectedStaff && (
        <View style={{ flex: 1 }}>
          <AppText variant="heading3" numberOfLines={1}>{toTitleCase(selectedStaff.name)}</AppText>
          <AppText variant="caption" color="tertiary">{toTitleCase(selectedStaff.role ?? "")}</AppText>
        </View>
      )}
      {isTablet && !selectedStaff && <View style={{ flex: 1 }} />}
      <MonthStepper value={period} onChange={setPeriod} />
      {selectedStaffId != null && (
        <Pressable onPress={() => previewQuery.refetch()} hitSlop={8} style={{ padding: spacing[2] }}>
          {previewQuery.isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
        </Pressable>
      )}
    </View>
  )

  const body =
    selectedStaffId == null ? (
      <View style={styles.center}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.accentSubtle }]}>
          <Wallet size={28} color={colors.accent} strokeWidth={1.75} />
        </View>
        <AppText variant="bodyMedium" style={{ marginTop: spacing[3] }}>See pay earned so far</AppText>
        <AppText variant="caption" color="tertiary" style={{ textAlign: "center", marginTop: spacing[1] }}>
          {isTablet ? "Pick a staff member from the list" : "Choose a staff member"} to preview what they've earned this month.
        </AppText>
        {!isTablet && (
          <AppButton label="Choose staff" onPress={() => setPickerOpen(true)} style={{ marginTop: spacing[4] }} />
        )}
      </View>
    ) : previewQuery.isLoading ? (
      <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
    ) : previewQuery.isError ? (
      <ErrorRetry
        message={salaryErrorMessage(previewQuery.error, "Could not load the preview")}
        onRetry={() => previewQuery.refetch()}
      />
    ) : preview ? (
      <PreviewResult preview={preview} />
    ) : null

  const content = (
    <ScrollView contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
      {toolbar}
      {body}
    </ScrollView>
  )

  return (
    <View style={{ flex: 1, flexDirection: isTablet ? "row" : "column" }}>
      {isTablet && (
        <View style={[styles.previewSidebar, { borderRightColor: colors.border }]}>
          <PreviewStaffList selectedStaffId={selectedStaffId} onSelect={setSelectedStaffId} />
        </View>
      )}
      <View style={{ flex: 1 }}>{content}</View>

      {pickerOpen && (
        <Popup title="Choose Staff Member" onClose={() => setPickerOpen(false)} contentStyle={{ maxHeight: "80%" }}>
          <View style={{ height: 420 }}>
            <PreviewStaffList
              selectedStaffId={selectedStaffId}
              onSelect={(id) => { setSelectedStaffId(id); setPickerOpen(false) }}
              autoFocus
            />
          </View>
        </Popup>
      )}
    </View>
  )
}

// ─── PayrollTab ───────────────────────────────────────────────────────────────
// Same shape as "Up to Today": pick a month, see the month's totals, drill into
// one payslip for its full breakdown. Staff list is a side panel on tablet and
// sits under the month overview on phone.

function isApproved(p: Payslip): boolean {
  return p.status === "finalized" || p.status === "paid"
}

function sumBy(items: Payslip[], pick: (p: Payslip) => number | undefined): number {
  return items.reduce((acc, p) => acc + (pick(p) ?? 0), 0)
}

function PayslipListRow({
  item,
  selected,
  missedDates = [],
  onPress,
}: {
  item: Payslip
  selected: boolean
  /** Current missed checkouts for this staff member's month - blocks approval. */
  missedDates?: string[]
  onPress: () => void
}) {
  const { colors } = useTheme()
  const name = toTitleCase(item.staffName ?? `Staff #${item.staffId}`)
  return (
    <Pressable
      onPress={onPress}
      style={[styles.previewStaffRow, selected && { backgroundColor: colors.accent + "18" }]}
    >
      <StaffAvatar name={name} color={colors.accent} bgColor={colors.accentSubtle} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" numberOfLines={1} style={selected ? { color: colors.accent } : undefined}>
          {name}
        </AppText>
        <AppText
          variant="caption"
          numberOfLines={1}
          style={{
            color: isApproved(item)
              ? palette.success.default
              : missedDates.length > 0
                ? palette.error.default
                : item.isPartial
                ? palette.warning.default
                : (colors.text.tertiary as string),
          }}
        >
          {isApproved(item)
            ? `Approved${item.approvedAt ? ` ${moment(item.approvedAt).format("D MMM")}` : ""}`
            : missedDates.length > 0
              ? `Draft · ${missedDates.length} missed checkout${missedDates.length > 1 ? "s" : ""}`
              : item.isPartial
              ? `Draft · up to ${moment(item.periodEnd, "YYYY-MM-DD").format("D MMM")}`
              : `Draft · generated ${moment(item.generatedAt).format("D MMM")}`}
        </AppText>
      </View>
      <AppText variant="bodyMedium" style={[styles.tabularAmount, { color: selected ? colors.accent : colors.text.primary }]}>
        ₹{formatAmount(item.netPay)}
      </AppText>
    </Pressable>
  )
}

function PayrollMonthOverview({
  period,
  payslips,
  missedCheckouts,
  onGenerate,
}: {
  period: moment.Moment
  payslips: Payslip[]
  missedCheckouts?: MissedCheckoutsResult
  onGenerate: () => void
}) {
  const { colors } = useTheme()
  const partialCount = payslips.filter((p) => p.isPartial).length
  const draftCount = payslips.filter((p) => !isApproved(p)).length

  if (payslips.length === 0) {
    return (
      <View style={styles.center}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.accentSubtle }]}>
          <Wallet size={28} color={colors.accent} strokeWidth={1.75} />
        </View>
        <AppText variant="bodyMedium" style={{ marginTop: spacing[3] }}>
          No payroll for {period.format("MMMM YYYY")} yet
        </AppText>
        <AppText variant="caption" color="tertiary" style={{ textAlign: "center", marginTop: spacing[1] }}>
          Generate payslips for every staff member with an active salary structure.
        </AppText>
        <AppButton label="Generate payroll" onPress={onGenerate} style={{ marginTop: spacing[4] }} />
      </View>
    )
  }

  const totalNet = sumBy(payslips, (p) => p.netPay)
  const totalGross = sumBy(payslips, (p) => p.grossPay)
  const totalDeductions = sumBy(payslips, (p) => (p.deductionAmount ?? 0) + (p.breakExcessDeduction ?? 0) + (p.earlyCheckoutDeduction ?? 0) + (p.penaltyAmount ?? 0))
  const totalOvertime = sumBy(payslips, (p) => p.overtimePay)
  const totalAdvances = sumBy(payslips, (p) => p.advanceDeducted)

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={[styles.previewHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ gap: spacing[1] }}>
          <AppText variant="caption" color="tertiary">Total payout · {period.format("MMMM YYYY")}</AppText>
          <AppText variant="heading1" style={{ color: colors.accent }}>₹{formatAmount(totalNet)}</AppText>
          <AppText variant="caption" color="tertiary">
            {payslips.length} payslip{payslips.length === 1 ? "" : "s"}
            {draftCount > 0 ? ` · ${draftCount} awaiting approval` : " · all approved"}
          </AppText>
        </View>
      </View>

      {(missedCheckouts?.totalDays ?? 0) > 0 && (
        <View style={[styles.previewNotice, { backgroundColor: palette.error.default + "18" }]}>
          <LogOut size={14} color={palette.error.default} strokeWidth={1.75} />
          <AppText variant="caption" style={{ color: palette.error.default, flex: 1 }}>
            {missedCheckouts!.totalDays} missed checkout{missedCheckouts!.totalDays === 1 ? "" : "s"} across {missedCheckouts!.staff.length} staff - their payroll can't be approved until fixed. Open a payslip to fix it.
          </AppText>
        </View>
      )}

      {partialCount > 0 && (
        <View style={[styles.previewNotice, { backgroundColor: palette.warning.default + "18" }]}>
          <Clock size={14} color={palette.warning.default} strokeWidth={1.75} />
          <AppText variant="caption" style={{ color: palette.warning.default, flex: 1 }}>
            {partialCount} payslip{partialCount === 1 ? " was" : "s were"} generated before the month ended and only cover part of it.
          </AppText>
        </View>
      )}

      <View style={styles.previewStats}>
        <PreviewStat icon={Banknote} label="Gross" value={`₹${formatAmount(totalGross)}`} />
        <PreviewStat
          icon={MinusCircle}
          label="Deductions"
          value={`₹${formatAmount(totalDeductions)}`}
          tone={totalDeductions > 0 ? palette.error.default : undefined}
        />
        <PreviewStat
          icon={TrendingUp}
          label="Overtime paid"
          value={`₹${formatAmount(totalOvertime)}`}
          tone={totalOvertime > 0 ? palette.success.default : undefined}
        />
        <PreviewStat icon={Clock} label="Advances recovered" value={`₹${formatAmount(totalAdvances)}`} />
      </View>
    </View>
  )
}

function PayslipDetail({ item, missedDates = [], onBack }: { item: Payslip; missedDates?: string[]; onBack: () => void }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()
  const openMonthlyAttendance = useOpenMonthlyAttendance()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState("")
  const [downloading, setDownloading] = useState(false)
  const monthLabel = moment(`${item.year}-${item.month}-01`, "YYYY-M-DD").format("MMMM YYYY")
  const overtimeHours = (item.overtimeMinutes ?? 0) / 60
  const absenceDays = item.deductionDetails?.length ?? 0
  const approved = isApproved(item)
  const staffName = toTitleCase(item.staffName ?? `Staff #${item.staffId}`)

  async function handleDownload() {
    setDownloading(true)
    try {
      await exportService.exportPayslipPdf(item.staffId, item.month, item.year)
    } catch (e) {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to download payslip") })
    } finally {
      setDownloading(false)
    }
  }

  // Regeneration updates the same record in place, so the selection survives the refetch.
  const regenerateMutation = useMutation({
    mutationFn: () => salaryService.generatePayroll(item.staffId, item.month, item.year),
    onSuccess: () => {
      setActionError("")
      queryClient.invalidateQueries({ queryKey: ["salary-payslips-all"] })
      Toast.show({ type: "success", text1: `Payroll regenerated for ${staffName}` })
    },
    onError: (e) => setActionError(salaryErrorMessage(e, "Failed to regenerate payroll")),
  })

  const approveMutation = useMutation({
    mutationFn: () => salaryService.approvePayroll(item.id),
    onSuccess: () => {
      setConfirmOpen(false)
      setActionError("")
      queryClient.invalidateQueries({ queryKey: ["salary-payslips-all"] })
      Toast.show({ type: "success", text1: `Payroll approved for ${staffName}` })
    },
    onError: (e) => {
      setConfirmOpen(false)
      setActionError(salaryErrorMessage(e, "Failed to approve payroll"))
    },
  })

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={[styles.metaItem, { justifyContent: "space-between" }]}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.metaItem}>
          <ChevronLeft size={16} color={colors.accent} strokeWidth={2} />
          <AppText variant="bodyMedium" style={{ color: colors.accent }}>{monthLabel} overview</AppText>
        </Pressable>
        <Pressable
          onPress={handleDownload}
          disabled={downloading}
          style={[styles.addBtn, { borderWidth: 1, borderColor: colors.border, marginLeft: 0 }]}
        >
          {downloading
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Download size={16} color={colors.text.secondary} strokeWidth={2} />}
          <AppText variant="caption" color="secondary">Payslip PDF</AppText>
        </Pressable>
      </View>

      <View style={[styles.previewHero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ gap: spacing[1] }}>
          <AppText variant="caption" color="tertiary">
            {toTitleCase(item.staffName ?? `Staff #${item.staffId}`)} · net pay for {monthLabel}
          </AppText>
          <AppText variant="heading1" style={{ color: colors.accent }}>₹{formatAmount(item.netPay)}</AppText>
          <AppText variant="caption" color="tertiary">
            Generated {moment(item.generatedAt).format("D MMM YYYY, h:mm A")} · basic ₹{formatAmount(item.basicPay)}/month
          </AppText>
        </View>
      </View>

      {approved ? (
        <View style={[styles.previewNotice, { backgroundColor: palette.success.default + "18" }]}>
          <Check size={14} color={palette.success.default} strokeWidth={2} />
          <AppText variant="caption" style={{ color: palette.success.default, flex: 1 }}>
            Approved{item.approvedAt ? ` ${moment(item.approvedAt).format("D MMM YYYY, h:mm A")}` : ""} - this month is locked for {staffName}.
          </AppText>
        </View>
      ) : (
        <View style={{ gap: spacing[2] }}>
          <MissedCheckoutNotice
            dates={missedDates}
            onFix={() => openMonthlyAttendance(item.staffId, item.month, item.year, "missedCheckout")}
          />
          <View style={[styles.previewNotice, { backgroundColor: palette.warning.default + "18" }]}>
            <Clock size={14} color={palette.warning.default} strokeWidth={1.75} />
            <AppText variant="caption" style={{ color: palette.warning.default, flex: 1 }}>
              {item.isPartial
                ? `Draft - covers only up to ${moment(item.periodEnd, "YYYY-MM-DD").format("D MMM")}. Regenerate after the month ends to approve it.`
                : "Draft - review the breakdown, then approve to lock this month. Regenerate first if anything changed."}
            </AppText>
          </View>
          <View style={styles.modalActions}>
            <AppButton
              label={regenerateMutation.isPending ? "Regenerating…" : "Regenerate"}
              variant="ghost"
              onPress={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending || approveMutation.isPending}
            />
            {!item.isPartial && missedDates.length === 0 && (
              <AppButton
                label="Approve"
                onPress={() => setConfirmOpen(true)}
                disabled={regenerateMutation.isPending || approveMutation.isPending}
              />
            )}
          </View>
          {actionError ? (
            <AppText variant="caption" style={{ color: palette.error.default }}>{actionError}</AppText>
          ) : null}
        </View>
      )}

      {confirmOpen && (
        <Popup title="Approve payroll" onClose={() => setConfirmOpen(false)}>
          <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
            Approve ₹{formatAmount(item.netPay)} for {staffName} for {monthLabel}? After approval this payroll can't be regenerated, and no incentives, penalties, advances or attendance changes can be made for the month.
          </AppText>
          <View style={styles.modalActions}>
            <AppButton label="Cancel" variant="ghost" onPress={() => setConfirmOpen(false)} />
            <AppButton
              label={approveMutation.isPending ? "Approving…" : "Approve"}
              onPress={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            />
          </View>
        </Popup>
      )}

      <View style={styles.previewStats}>
        <PreviewStat
          icon={X}
          label="Deduction days"
          value={String(absenceDays)}
          tone={absenceDays > 0 ? palette.error.default : undefined}
        />
        <PreviewStat
          icon={TrendingUp}
          label="Overtime"
          value={overtimeHours > 0 ? `${overtimeHours.toFixed(1)}h` : "—"}
          tone={overtimeHours > 0 ? palette.success.default : undefined}
        />
        <PreviewStat icon={Plus} label="Incentives" value={`₹${formatAmount(item.incentives)}`} />
        <PreviewStat
          icon={MinusCircle}
          label="Penalties"
          value={`₹${formatAmount(item.penaltyAmount ?? 0)}`}
          tone={(item.penaltyAmount ?? 0) > 0 ? palette.error.default : undefined}
        />
      </View>

      <View>
        <AppText variant="bodyMedium" style={{ marginBottom: spacing[2] }}>Breakdown</AppText>
        <PayBreakdown
          basicPay={item.basicPay}
          basicPayEarned={item.basicPayEarned ?? item.basicPay}
          deductionAmount={item.deductionAmount ?? 0}
          deductionDetails={item.deductionDetails}
          incentives={item.incentives}
          incentiveDetails={item.incentiveDetails}
          overtimePay={item.overtimePay}
          overtimeMinutes={item.overtimeMinutes}
          hourlyRate={item.hourlyRate}
          overtimeDetails={item.overtimeDetails}
          pendingOvertimeMinutes={item.pendingOvertimeMinutes}
          breakExcessDeduction={item.breakExcessDeduction}
          breakExcessMinutes={item.breakExcessMinutes}
          breakExcessDetails={item.breakExcessDetails}
          waivedBreakExcessMinutes={item.waivedBreakExcessMinutes}
          earlyCheckoutDeduction={item.earlyCheckoutDeduction}
          earlyCheckoutMinutes={item.earlyCheckoutMinutes}
          earlyCheckoutDetails={item.earlyCheckoutDetails}
          penaltyAmount={item.penaltyAmount ?? 0}
          penaltyDetails={item.penaltyDetails}
          advanceDeducted={item.advanceDeducted ?? 0}
          grossPay={item.grossPay ?? item.basicPay + item.incentives}
          netPay={item.netPay}
          expanded
          // Pending overtime can't be approved once payroll is approved, so there's nothing to go do.
          onPendingOvertimePress={approved ? undefined : () => openMonthlyAttendance(item.staffId, item.month, item.year, "pendingOvertime")}
        />
      </View>
    </View>
  )
}

/** Outcome of the last "Generate for all" run - who was skipped and why. */
function GenerateResultCard({ result, onDismiss }: { result: GenerateAllPayrollResult; onDismiss: () => void }) {
  const { colors } = useTheme()
  const failedResults = result.results.filter((r) => !r.success)
  const pendingOvertime = result.pendingOvertime ?? []

  return (
    <View style={[styles.previewSectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.metaItem, { justifyContent: "space-between" }]}>
        <AppText variant="bodyMedium">Last generation run</AppText>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <X size={16} color={colors.text.tertiary} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={styles.previewStats}>
        <PreviewStat icon={Users} label="Total staff" value={String(result.totalStaff)} />
        <PreviewStat icon={Check} label="Generated" value={String(result.generated)} tone={palette.success.default} />
        <PreviewStat
          icon={X}
          label="Skipped"
          value={String(result.failed)}
          tone={result.failed > 0 ? palette.error.default : undefined}
        />
      </View>

      {failedResults.length > 0 && (
        <View>
          <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[1] }}>Skipped staff</AppText>
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

      {pendingOvertime.length > 0 && (
        <View>
          <AppText variant="caption" style={{ color: palette.warning.default, marginBottom: spacing[1] }}>
            Unpaid overtime - still pending approval when payroll was generated
          </AppText>
          {pendingOvertime.map((p) => (
            <View key={p.staffId} style={[styles.payrollFailRow, { borderBottomColor: colors.border }]}>
              <AppText variant="bodySmall">{toTitleCase(p.staffName)}</AppText>
              <AppText variant="caption" color="tertiary" style={{ flex: 1, textAlign: "right" }}>
                {Math.floor(p.pendingOvertimeMinutes / 60)}h {p.pendingOvertimeMinutes % 60}m
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function PayrollTab() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState(() => moment().startOf("month"))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [generateOpen, setGenerateOpen] = useState(false)
  const [lastResult, setLastResult] = useState<GenerateAllPayrollResult | null>(null)
  const [downloading, setDownloading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const month = period.month() + 1
  const year = period.year()

  // On phone the list sits below the overview, so opening a payslip from far
  // down would otherwise leave you looking at the middle of its breakdown.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [selectedId])

  const payslipsQuery = useQuery({
    queryKey: ["salary-payslips-all", month, year],
    queryFn: () => salaryService.getAllPayslips(month, year),
  })
  const payslips = [...(payslipsQuery.data?.data ?? [])].sort((a, b) =>
    (a.staffName ?? "").localeCompare(b.staffName ?? ""),
  )
  const filtered = q.trim()
    ? payslips.filter((p) => (p.staffName ?? "").toLowerCase().includes(q.trim().toLowerCase()))
    : payslips
  const selected = payslips.find((p) => p.id === selectedId) ?? null

  // Live, not the snapshot on each payslip - a fixed day should clear its
  // warning without regenerating first.
  const missedQuery = useQuery({
    queryKey: ["salary-missed-checkouts", month, year],
    queryFn: () => salaryService.getMissedCheckouts(month, year),
  })
  const missedByStaff = new Map((missedQuery.data?.data.staff ?? []).map((m) => [m.staffId, m.dates]))

  function changePeriod(next: moment.Moment) {
    setPeriod(next)
    setSelectedId(null)
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      await exportService.exportPayroll(month, year)
    } catch (e) {
      Toast.show({ type: "error", text1: salaryErrorMessage(e, "Failed to download payroll") })
    } finally {
      setDownloading(false)
    }
  }

  function handleSuccess(result: GenerateAllPayrollResult) {
    setLastResult(result)
    queryClient.invalidateQueries({ queryKey: ["salary-payslips-all"] })
    Toast.show({
      type: result.failed > 0 ? "info" : "success",
      text1: `Payroll generated for ${result.generated} of ${result.totalStaff} staff`,
      text2: result.failed > 0 ? `${result.failed} skipped` : undefined,
    })
  }

  const staffList = (
    <View style={{ flex: isTablet ? 1 : undefined }}>
      {payslips.length > 0 && (
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}>
          <Search size={14} color={colors.text.tertiary} strokeWidth={1.75} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search payslips…"
            placeholderTextColor={colors.text.tertiary}
            value={q}
            onChangeText={setQ}
          />
        </View>
      )}
      {isTablet ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing[4] }}>
          {filtered.map((p) => (
            <PayslipListRow key={p.id} item={p} selected={p.id === selectedId} missedDates={missedByStaff.get(p.staffId)} onPress={() => setSelectedId(p.id)} />
          ))}
          {payslipsQuery.isLoading && <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[6] }} />}
          {!payslipsQuery.isLoading && filtered.length === 0 && (
            <AppText variant="caption" color="tertiary" style={{ padding: spacing[4], textAlign: "center" }}>
              {payslips.length === 0 ? `No payslips for ${period.format("MMM YYYY")}` : "No staff found"}
            </AppText>
          )}
        </ScrollView>
      ) : (
        filtered.map((p) => (
          <PayslipListRow key={p.id} item={p} selected={false} missedDates={missedByStaff.get(p.staffId)} onPress={() => setSelectedId(p.id)} />
        ))
      )}
    </View>
  )

  const toolbar = (
    <View style={styles.previewToolbar}>
      <View style={{ flex: 1 }}>
        <AppText variant="heading3">Payroll</AppText>
        <AppText variant="caption" color="tertiary">Generated payslips by month</AppText>
      </View>
      <MonthStepper value={period} onChange={changePeriod} />
      <Pressable onPress={() => { payslipsQuery.refetch(); missedQuery.refetch() }} hitSlop={8} style={{ padding: spacing[2] }}>
        {payslipsQuery.isRefetching
          ? <ActivityIndicator size="small" color={colors.accent} />
          : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />}
      </Pressable>
      {payslips.length > 0 && (
        <Pressable
          onPress={handleDownload}
          disabled={downloading}
          style={[styles.addBtn, { borderWidth: 1, borderColor: colors.border, marginLeft: 0 }]}
        >
          {downloading
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Download size={16} color={colors.text.secondary} strokeWidth={2} />}
          <AppText variant="caption" color="secondary">Download</AppText>
        </Pressable>
      )}
      <Pressable onPress={() => setGenerateOpen(true)} style={[styles.addBtn, { backgroundColor: colors.accent, marginLeft: 0 }]}>
        <Wallet size={16} color="#fff" strokeWidth={2.5} />
        <AppText variant="caption" style={{ color: "#fff" }}>Generate</AppText>
      </Pressable>
    </View>
  )

  const body = selected ? (
    <PayslipDetail item={selected} missedDates={missedByStaff.get(selected.staffId)} onBack={() => setSelectedId(null)} />
  ) : payslipsQuery.isLoading ? (
    <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
  ) : payslipsQuery.isError ? (
    <ErrorRetry
      message={salaryErrorMessage(payslipsQuery.error, "Could not load payslips")}
      onRetry={() => payslipsQuery.refetch()}
    />
  ) : (
    <View style={{ gap: spacing[4] }}>
      {lastResult && <GenerateResultCard result={lastResult} onDismiss={() => setLastResult(null)} />}
      <PayrollMonthOverview period={period} payslips={payslips} missedCheckouts={missedQuery.data?.data} onGenerate={() => setGenerateOpen(true)} />
      {!isTablet && payslips.length > 0 && (
        <View>
          <AppText variant="bodyMedium" style={{ marginBottom: spacing[2] }}>Payslips</AppText>
          {staffList}
        </View>
      )}
    </View>
  )

  return (
    <View style={{ flex: 1, flexDirection: isTablet ? "row" : "column" }}>
      {isTablet && (
        <View style={[styles.previewSidebar, { borderRightColor: colors.border }]}>{staffList}</View>
      )}
      <View style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
          {toolbar}
          {body}
        </ScrollView>
      </View>

      <GenerateAllPayrollModal
        visible={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onSuccess={handleSuccess}
        initialPeriod={period}
      />
    </View>
  )
}

// ─── SalaryScreen ─────────────────────────────────────────────────────────────

export default function SalaryScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const { isSuperAdmin, isManager } = useRole()
  const router = useRouter()
  const [view, setView] = useState<SalaryView>("structures")

  // Salary is superAdmin/manager only - HR is bounced out even if they reach
  // this route directly, since hiding the nav entry alone wouldn't stop them.
  const canViewSalary = isSuperAdmin || isManager

  useEffect(() => {
    if (!canViewSalary) router.replace("/(admin)")
  }, [canViewSalary])

  if (!canViewSalary) return null

  const tabs: Array<{ label: string; value: SalaryView; icon: React.ComponentType<any> }> = [
    { label: "Structures", value: "structures", icon: Banknote },
    { label: "Incentives", value: "incentives", icon: TrendingUp },
    { label: "Penalties", value: "penalties", icon: MinusCircle },
    { label: "Advances", value: "advances", icon: Clock },
    { label: "Payroll", value: "payroll", icon: History },
    { label: "Up to Today", value: "preview", icon: CalendarClock },
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
      {view === "incentives" && <IncentivesTab />}
      {view === "penalties" && <PenaltiesTab canImpose={isSuperAdmin} />}
      {view === "advances" && <AdvancesTab />}
      {view === "payroll" && <PayrollTab />}
      {view === "preview" && <PayrollPreviewTab />}
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
    flexWrap: "wrap",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },

  previewScroll: { padding: spacing[4], paddingBottom: spacing[16], width: "100%", maxWidth: 880, alignSelf: "center" },
  previewSidebar: {
    width: 300,
    paddingTop: spacing[4],
    paddingHorizontal: spacing[3],
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  previewToolbar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  staffSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flexGrow: 1,
    flexBasis: 220,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  monthStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
  },
  stepperBtn: { padding: spacing[2] },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[2],
    fontSize: 14,
    // The surrounding box already draws the border - drop the browser focus ring.
    ...({ outlineStyle: "none" } as object),
  },
  previewStaffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  previewHero: {
    gap: spacing[4],
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewHeroTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: spacing[4],
  },
  previewProjection: {
    gap: spacing[1],
    padding: spacing[3],
    borderRadius: radii.lg,
    flexGrow: 1,
    flexBasis: 180,
    maxWidth: 280,
  },
  progressTrack: { height: 6, borderRadius: radii.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radii.full },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  previewStats: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  previewStat: {
    flexGrow: 1,
    flexBasis: 140,
    gap: spacing[1],
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.md,
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
  previewSectionCard: {
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabularAmount: { fontVariant: ["tabular-nums"] },
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
