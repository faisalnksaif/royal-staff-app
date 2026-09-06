import { formatAmount } from "../../utils/helpers"
import { useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, TouchableOpacity } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Wallet, Banknote, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import ListRow, { ListRowPill } from "../../components/shared/ListRow"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { salaryService } from "../../services/salaryService"
import useAuthStore from "../../stores/useAuthStore"
import type { Payslip, SalaryAdvance, SalaryAdvanceStatus } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

const ADVANCE_STATUS_CONFIG: Record<SalaryAdvanceStatus, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: palette.warning.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
  paid:     { label: "Paid",     color: palette.success.default },
}

type SalaryView = "payslips" | "advances"

// ─── StructureCard ────────────────────────────────────────────────────────────

function StructureCard({ staffId }: { staffId?: number }) {
  const { colors } = useTheme()
  const { data, isLoading } = useQuery({
    queryKey: ["salary-structure", staffId],
    queryFn: () => salaryService.getStructure(staffId!),
    enabled: staffId != null,
  })

  const structure = data?.data?.active
  const pending = data?.data?.pending ?? []

  return (
    <View style={[styles.structureCard, { borderBottomColor: colors.border }]}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : structure ? (
        <>
          <View style={styles.structureStatsRow}>
            <View style={styles.structureStat}>
              <AppText variant="heading2" style={{ color: colors.accent }}>₹{formatAmount(structure.basicPay)}</AppText>
              <AppText variant="caption" color="tertiary">Basic Pay</AppText>
            </View>
            <View style={[styles.structureStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.structureStat}>
              <AppText variant="heading2" color="primary">₹{formatAmount(structure.incentives)}</AppText>
              <AppText variant="caption" color="tertiary">Incentives</AppText>
            </View>
          </View>
          <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[1] }}>
            Effective from {moment(structure.effectiveFrom).format("D MMM YYYY")}
          </AppText>
        </>
      ) : (
        <AppText color="tertiary">No active salary structure yet</AppText>
      )}
      {pending.length > 0 && (
        <View style={[styles.pendingBanner, { backgroundColor: palette.warning.default + "18" }]}>
          <Clock size={14} color={palette.warning.default} strokeWidth={1.75} />
          <AppText variant="caption" style={{ color: palette.warning.default, flex: 1 }}>
            A revised structure is pending approval
          </AppText>
        </View>
      )}
    </View>
  )
}

// ─── PayslipCard ──────────────────────────────────────────────────────────────

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
      title={monthLabel}
      trailing={
        <AppText variant="bodyMedium" style={{ color: colors.accent }}>
          ₹{formatAmount(item.netPay)}
        </AppText>
      }
      metaLines={[
        <View key="breakdown" style={styles.metaItem}>
          <Banknote size={14} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="body" style={{ color: colors.text.secondary as string }}>
            Basic ₹{formatAmount(item.basicPay)} + Incentives ₹{formatAmount(item.incentives)}
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

// ─── AdvanceCard ──────────────────────────────────────────────────────────────

function AdvanceCard({ item, index }: { item: SalaryAdvance; index?: number }) {
  const { colors, isDark } = useTheme()
  const status = ADVANCE_STATUS_CONFIG[item.status] ?? { label: item.status ?? "Unknown", color: palette.neutral[500] }
  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]

  const pills: ListRowPill[] = [
    { key: "status", label: status.label, color: status.color, bgColor: status.color + "22" },
  ]

  return (
    <ListRow
      number={(index ?? 0) + 1}
      avatarColor={avatarColor}
      avatarBgColor={avatarBgColor}
      title={`₹${formatAmount(item.amount)}`}
      pills={pills}
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

// ─── SalaryScreen ─────────────────────────────────────────────────────────────

export default function SalaryScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [view, setView] = useState<SalaryView>("payslips")
  const [error, setError] = useState("")

  const { data: payslipsData, isLoading: payslipsLoading, refetch: refetchPayslips, isRefetching: isRefetchingPayslips } = useQuery({
    queryKey: ["my-payslips"],
    queryFn: () => salaryService.getMyPayslips(),
    enabled: view === "payslips",
  })

  const { data: advancesData, isLoading: advancesLoading, refetch: refetchAdvances, isRefetching: isRefetchingAdvances } = useQuery({
    queryKey: ["my-advances"],
    queryFn: () => salaryService.getMyAdvances(),
    enabled: view === "advances",
  })

  const requestAdvanceMutation = useMutation({
    mutationFn: () => salaryService.requestAdvance(),
    onSuccess: () => {
      setError("")
      queryClient.invalidateQueries({ queryKey: ["my-advances"] })
    },
    onError: (e) => setError((e as Error)?.message ?? "Failed to request advance"),
  })

  const payslips = payslipsData?.data ?? []
  const advances = advancesData?.data ?? []

  const tabs: Array<{ label: string; value: SalaryView }> = [
    { label: "Payslips", value: "payslips" },
    { label: "Advances", value: "advances" },
  ]

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <BackButton />
          <AppText variant="heading2" style={{ flex: 1 }}>My Salary</AppText>
        </View>

        <StructureCard staffId={user?.user_id ?? undefined} />

        {/* View toggle */}
        <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
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

        {view === "advances" && (
          <View style={[styles.advanceActions, { borderBottomColor: colors.border }]}>
            {error ? (
              <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[2] }}>
                {error}
              </AppText>
            ) : null}
            <AppButton
              label={requestAdvanceMutation.isPending ? "Requesting…" : "Request Advance"}
              onPress={() => requestAdvanceMutation.mutate()}
              disabled={requestAdvanceMutation.isPending}
            />
          </View>
        )}

        {view === "payslips" ? (
          <FlatList
            data={payslips}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedListItem index={index}>
                <PayslipCard item={item} index={index} />
              </AnimatedListItem>
            )}
            contentContainerStyle={styles.rowList}
            refreshing={isRefetchingPayslips}
            onRefresh={refetchPayslips}
            ListEmptyComponent={
              payslipsLoading ? (
                <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
              ) : (
                <View style={styles.center}>
                  <AppText color="tertiary">No payslips yet</AppText>
                </View>
              )
            }
          />
        ) : (
          <FlatList
            data={advances}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedListItem index={index}>
                <AdvanceCard item={item} index={index} />
              </AnimatedListItem>
            )}
            contentContainerStyle={styles.rowList}
            refreshing={isRefetchingAdvances}
            onRefresh={refetchAdvances}
            ListEmptyComponent={
              advancesLoading ? (
                <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
              ) : (
                <View style={styles.center}>
                  <AppText color="tertiary">No advance requests yet</AppText>
                </View>
              )
            }
          />
        )}
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

  structureCard: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  structureStatsRow: { flexDirection: "row", alignItems: "center" },
  structureStat: { flex: 1, alignItems: "center", gap: spacing[1] },
  structureStatDivider: { width: StyleSheet.hairlineWidth, height: 40 },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.md,
    marginTop: spacing[2],
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },
  filterTab: { paddingTop: spacing[3] },

  advanceActions: {
    padding: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  rowList: { paddingBottom: spacing[16] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },

  metaItem: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
})
