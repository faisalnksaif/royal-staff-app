// Staff see their advance requests only - pay figures (basic pay, incentives,
// payslips and their breakdowns) are deliberately not shown here. The amount
// on an advance is the sum they asked for, which they already know.
import { formatAmount } from "../../utils/helpers"
import { View, FlatList, ActivityIndicator, StyleSheet } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Clock } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import ListRow, { ListRowPill } from "../../components/shared/ListRow"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette } from "../../constants/theme"
import { salaryService } from "../../services/salaryService"
import type { SalaryAdvance, SalaryAdvanceStatus } from "../../types"
import { useState } from "react"

// ─── helpers ─────────────────────────────────────────────────────────────────

const ADVANCE_STATUS_CONFIG: Record<SalaryAdvanceStatus, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: palette.warning.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
  paid:     { label: "Paid",     color: palette.success.default },
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
  const [error, setError] = useState("")

  const { data: advancesData, isLoading: advancesLoading, refetch: refetchAdvances, isRefetching: isRefetchingAdvances } = useQuery({
    queryKey: ["my-advances"],
    queryFn: () => salaryService.getMyAdvances(),
  })

  const requestAdvanceMutation = useMutation({
    mutationFn: () => salaryService.requestAdvance(),
    onSuccess: () => {
      setError("")
      queryClient.invalidateQueries({ queryKey: ["my-advances"] })
    },
    onError: (e) => setError((e as Error)?.message ?? "Failed to request advance"),
  })

  const advances = advancesData?.data ?? []

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <BackButton />
          <AppText variant="heading2" style={{ flex: 1 }}>Salary Advances</AppText>
        </View>

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

  advanceActions: {
    padding: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  rowList: { paddingBottom: spacing[16] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },

  metaItem: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
})
