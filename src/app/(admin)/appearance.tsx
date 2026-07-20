import { useState, useEffect, useMemo } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable } from "react-native"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Check, X, AlertCircle, RefreshCw } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { appearanceService } from "../../services/appearanceService"
import { attendanceService } from "../../services/attendanceService"
import type { AppearanceItemKey, AppearanceRecord } from "../../types"

const APPEARANCE_ITEMS: { key: AppearanceItemKey; label: string }[] = [
  { key: "uniform", label: "Uniform" },
  { key: "socks_banyan", label: "Socks & Banyan" },
  { key: "hair_beard_moustache", label: "Hair & Beard" },
]

// ─── StaffAppearanceRow ───────────────────────────────────────────────────────

function StaffAppearanceRow({
  record,
  issues,
  isUpdating,
  onToggle,
}: {
  record: AppearanceRecord
  issues: AppearanceItemKey[]
  isUpdating: boolean
  onToggle: (key: AppearanceItemKey) => void
}) {
  const { colors } = useTheme()
  const isAllOk = issues.length === 0
  const initials = record.staffName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const statusColor = isAllOk ? palette.success.default : palette.error.default

  return (
    <AppCard elevation="sm" style={styles.staffCard}>
      {/* Name row */}
      <View style={styles.nameRow}>
        <View style={[styles.avatar, { backgroundColor: statusColor + "22" }]}>
          <AppText variant="bodyMedium" style={{ color: statusColor }}>
            {initials}
          </AppText>
        </View>
        <AppText variant="bodyMedium" style={styles.staffName} numberOfLines={1}>
          {record.staffName}
        </AppText>
        {isUpdating ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : isAllOk ? (
          <View style={[styles.badge, { backgroundColor: palette.success.default + "18" }]}>
            <Check size={11} color={palette.success.default} strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: palette.success.default }}>
              OK
            </AppText>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: palette.error.default + "18" }]}>
            <AlertCircle size={11} color={palette.error.default} strokeWidth={2} />
            <AppText variant="caption" style={{ color: palette.error.default }}>
              {issues.length} issue{issues.length > 1 ? "s" : ""}
            </AppText>
          </View>
        )}
      </View>

      {/* Appearance chips */}
      <View style={[styles.chipsRow, { borderTopColor: colors.border }]}>
        {APPEARANCE_ITEMS.map((item) => {
          const isBad = issues.includes(item.key)
          const chipColor = isBad ? palette.error.default : palette.success.default
          return (
            <Pressable
              key={item.key}
              onPress={() => !isUpdating && onToggle(item.key)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: chipColor + "18",
                  borderColor: chipColor,
                  opacity: pressed || isUpdating ? 0.6 : 1,
                },
              ]}
            >
              {isBad ? (
                <X size={11} color={chipColor} strokeWidth={2.5} />
              ) : (
                <Check size={11} color={chipColor} strokeWidth={2.5} />
              )}
              <AppText variant="caption" style={{ color: chipColor, fontSize: 11 }}>
                {item.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </AppCard>
  )
}

// ─── AppearanceScreen ─────────────────────────────────────────────────────────

export default function AppearanceScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()

  const [issues, setIssues] = useState<Record<number, AppearanceItemKey[]>>({})
  const [initialized, setInitialized] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())

  const { data: staffData, isLoading: isLoadingStaff, refetch: refetchStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const { data: appearanceData, isLoading: isLoadingAppearance, isRefetching, refetch: refetchAppearance } = useQuery({
    queryKey: ["appearance-today"],
    queryFn: () => appearanceService.getTodayAppearance(),
  })

  const isLoading = isLoadingStaff || isLoadingAppearance

  function refetch() {
    refetchStaff()
    refetchAppearance()
  }

  useEffect(() => {
    if (staffData?.data && !isLoadingAppearance && !initialized) {
      const issueMap: Record<number, AppearanceItemKey[]> = {}
      for (const r of appearanceData?.data?.staff ?? []) {
        issueMap[r.staffId] = (r.violations ?? r.issues ?? []) as AppearanceItemKey[]
      }
      const map: Record<number, AppearanceItemKey[]> = {}
      for (const s of staffData.data) {
        map[s.id] = issueMap[s.id] ?? []
      }
      setIssues(map)
      setInitialized(true)
    }
  }, [staffData, appearanceData, isLoadingAppearance, initialized])

  const updateMutation = useMutation({
    mutationFn: ({ staffId, updated }: { staffId: number; updated: AppearanceItemKey[] }) =>
      appearanceService.updateAppearance(staffId, updated),
    onSettled: (_, __, { staffId }) => {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(staffId)
        return next
      })
    },
  })

  function handleToggle(staffId: number, itemKey: AppearanceItemKey) {
    if (updatingIds.has(staffId)) return
    const current = issues[staffId] ?? []
    const isBad = current.includes(itemKey)
    const updated = isBad ? current.filter((k) => k !== itemKey) : [...current, itemKey]
    setIssues((prev) => ({ ...prev, [staffId]: updated }))
    setUpdatingIds((prev) => new Set([...prev, staffId]))
    updateMutation.mutate({ staffId, updated })
  }

  const records: AppearanceRecord[] = useMemo(
    () =>
      (staffData?.data ?? []).map((s) => ({
        staffId: s.id,
        staffName: s.name,
        issues: issues[s.id] ?? [],
      })),
    [staffData, issues]
  )
  const today = moment().format("ddd, D MMM YYYY")

  const issueCount = Object.values(issues).filter((v) => v.length > 0).length

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {!isTablet && <BackButton />}
          <View>
            <AppText variant="heading3">Staff Appearance</AppText>
            <AppText variant="caption" color="tertiary">
              {today}
            </AppText>
          </View>
        </View>
        {initialized && (
          <View style={styles.summary}>
            <View style={[styles.summaryPill, { backgroundColor: palette.success.default + "18" }]}>
              <Check size={12} color={palette.success.default} strokeWidth={2.5} />
              <AppText variant="caption" style={{ color: palette.success.default }}>
                {records.length - issueCount} OK
              </AppText>
            </View>
            {issueCount > 0 && (
              <View style={[styles.summaryPill, { backgroundColor: palette.error.default + "18" }]}>
                <AlertCircle size={12} color={palette.error.default} strokeWidth={2} />
                <AppText variant="caption" style={{ color: palette.error.default }}>
                  {issueCount} issues
                </AppText>
              </View>
            )}
          </View>
        )}
        <Pressable onPress={refetch} hitSlop={8} style={{ padding: spacing[2] }}>
          {isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.background.secondary, borderBottomColor: colors.border }]}>
        <AppText variant="caption" color="tertiary">
          Tap any item to toggle violation status
        </AppText>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <Check size={10} color={palette.success.default} strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: palette.success.default }}>
              OK
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <X size={10} color={palette.error.default} strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: palette.error.default }}>
              Violation
            </AppText>
          </View>
        </View>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.staffId)}
        renderItem={({ item }) => (
          <StaffAppearanceRow
            record={item}
            issues={issues[item.staffId] ?? []}
            isUpdating={updatingIds.has(item.staffId)}
            onToggle={(key) => handleToggle(item.staffId, key)}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No staff records found</AppText>
            </View>
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  summary: { flexDirection: "row", gap: spacing[2] },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  legendItems: { flexDirection: "row", gap: spacing[4] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  center: { alignItems: "center", justifyContent: "center", paddingTop: spacing[16] },
  staffCard: { padding: spacing[4] },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  staffName: { flex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[3],
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
  },
})
