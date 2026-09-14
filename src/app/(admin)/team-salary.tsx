import { formatAmount, toTitleCase } from "../../utils/helpers"
import { useState, useEffect } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, TextInput, ScrollView } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { Check, X, Plus, RefreshCw, Wallet, Clock, Banknote, History, TrendingUp, MinusCircle, Trash2, CalendarClock } from "lucide-react-native"
import Toast from "react-native-toast-message"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import PayBreakdown from "../../components/shared/PayBreakdown"
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
import type { SalaryStructure, SalaryAdvance, SalaryAdvanceStatus, SalaryStructureStatus, GenerateAllPayrollResult, Payslip, SalaryIncentive, SalaryPenalty, PayrollPreview } from "../../types"

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

// ─── PayrollPreviewTab ────────────────────────────────────────────────────────
// Salary up to today: superAdmin picks a staff member and sees what they have
// earned so far this month, plus where the month lands if the rest is worked.
// Read-only - hitting this never creates a PayrollRecord.

function PayrollPreviewTab() {
  const { colors } = useTheme()
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [month, setMonth] = useState(String(moment().month() + 1))
  const [year, setYear] = useState(String(moment().year()))

  const previewQuery = useQuery({
    queryKey: ["salary-preview", selectedStaffId, month, year],
    queryFn: () => salaryService.previewPayroll(selectedStaffId!, Number(month), Number(year)),
    enabled: selectedStaffId != null,
  })

  const preview: PayrollPreview | undefined = previewQuery.data?.data

  return (
    <ScrollView contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
      <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Staff Member</AppText>
      <StaffPicker selectedStaffId={selectedStaffId} onSelect={setSelectedStaffId} enabled />

      <MonthYearRow month={month} year={year} onMonth={setMonth} onYear={setYear} />

      {selectedStaffId == null ? (
        <View style={styles.center}>
          <AppText color="tertiary">Select a staff member to see their pay so far</AppText>
        </View>
      ) : previewQuery.isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : previewQuery.isError ? (
        <View style={styles.center}>
          <AppText color="tertiary" style={{ textAlign: "center" }}>
            {salaryErrorMessage(previewQuery.error, "Could not load the preview")}
          </AppText>
        </View>
      ) : preview ? (
        <View style={{ gap: spacing[4], marginTop: spacing[4] }}>
          <View style={[styles.previewHeadline, { borderColor: colors.border as string }]}>
            <AppText variant="caption" color="tertiary">
              {toTitleCase(preview.staffName)} · earned as of {moment(preview.asOf, "YYYY-MM-DD").format("D MMM YYYY")}
            </AppText>
            <AppText variant="heading1" style={{ color: colors.accent }}>
              ₹{formatAmount(preview.netPay)}
            </AppText>
            <AppText variant="caption" color="tertiary">
              {preview.unpaidAbsenceDays} unpaid absence{preview.unpaidAbsenceDays === 1 ? "" : "s"}
              {preview.halfDays > 0 ? ` · ${preview.halfDays} half-day${preview.halfDays === 1 ? "" : "s"}` : ""}
              {" · "}₹{formatAmount(preview.perDayPay)}/day
            </AppText>
          </View>

          <PayBreakdown
            basicPay={preview.basicPay}
            basicPayEarned={preview.basicPayEarned}
            deductionAmount={preview.deductionAmount}
            deductionDetails={preview.deductionDetails}
            incentives={preview.incentives}
            incentiveDetails={preview.incentiveDetails}
            penaltyAmount={preview.penaltyAmount}
            penaltyDetails={preview.penaltyDetails}
            advanceDeducted={preview.advanceDeducted}
            grossPay={preview.grossPay}
            netPay={preview.netPay}
            expanded
          />

          {/* Projection: only meaningful while the month is still running. */}
          {preview.isPartial && (
            <View style={[styles.previewProjection, { borderColor: colors.border as string }]}>
              <View style={styles.metaItem}>
                <CalendarClock size={14} color={colors.text.tertiary} strokeWidth={1.5} />
                <AppText variant="caption" color="tertiary" style={{ flex: 1 }}>
                  If the rest of {moment(`${preview.year}-${preview.month}-01`, "YYYY-M-DD").format("MMMM")} is worked in full
                </AppText>
              </View>
              <AppText variant="heading3" color="primary">
                ₹{formatAmount(preview.projected.netPay)}
              </AppText>
            </View>
          )}

          {preview.payrollAlreadyGenerated && (
            <View style={[styles.previewNotice, { backgroundColor: palette.warning.default + "18" }]}>
              <Clock size={14} color={palette.warning.default} strokeWidth={1.75} />
              <AppText variant="caption" style={{ color: palette.warning.default, flex: 1 }}>
                Payroll for this month has already been generated - this preview is informational only.
              </AppText>
            </View>
          )}
        </View>
      ) : null}
    </ScrollView>
  )
}

// ─── PayrollTab ───────────────────────────────────────────────────────────────

function PayslipCard({ item, index }: { item: Payslip; index?: number }) {
  const { colors, isDark } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]
  const monthLabel = moment(`${item.year}-${item.month}-01`, "YYYY-M-DD").format("MMMM YYYY")

  // A payslip generated mid-month covers only part of it - say so, otherwise a
  // smaller-than-expected net pay reads as an error rather than a period.
  const pills: ListRowPill[] = item.isPartial
    ? [{
        key: "partial",
        label: `Up to ${moment(item.periodEnd, "YYYY-MM-DD").format("D MMM")}`,
        color: palette.warning.default,
        bgColor: palette.warning.default + "22",
      }]
    : []

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={toTitleCase(item.staffName ?? `Staff #${item.staffId}`)}
      pills={pills}
      trailing={
        <AppText variant="bodyMedium" style={{ color: colors.accent }}>
          ₹{formatAmount(item.netPay)}
        </AppText>
      }
      metaLines={[
        <Pressable key="toggle" onPress={() => setExpanded((v) => !v)} style={styles.metaItem}>
          <Banknote size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.accent }}>
            {monthLabel} · {expanded ? "Hide breakdown" : "Show breakdown"}
          </AppText>
        </Pressable>,
        <PayBreakdown
          key="breakdown"
          basicPay={item.basicPay}
          basicPayEarned={item.basicPayEarned ?? item.basicPay}
          deductionAmount={item.deductions ?? 0}
          deductionDetails={item.deductionDetails}
          incentives={item.incentives}
          incentiveDetails={item.incentiveDetails}
          penaltyAmount={item.penaltyAmount ?? 0}
          penaltyDetails={item.penaltyDetails}
          advanceDeducted={item.advancesDeducted ?? 0}
          grossPay={item.grossPay ?? item.basicPay + item.incentives}
          netPay={item.netPay}
          expanded={expanded}
        />,
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
    // "Up to today" is a superAdmin-only read of in-progress pay.
    ...(isSuperAdmin
      ? [{ label: "Up to Today", value: "preview" as SalaryView, icon: CalendarClock }]
      : []),
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
      {view === "preview" && isSuperAdmin && <PayrollPreviewTab />}
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

  previewScroll: { padding: spacing[4], paddingBottom: spacing[16] },
  previewHeadline: {
    alignItems: "center",
    gap: spacing[1],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewProjection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
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
