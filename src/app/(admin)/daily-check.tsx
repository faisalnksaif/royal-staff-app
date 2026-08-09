import { useState, useEffect, useMemo } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, useWindowDimensions } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, AlertCircle, Search, XCircle } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { appearanceService } from "../../services/appearanceService"
import { cleaningService } from "../../services/cleaningService"
import { attendanceService } from "../../services/attendanceService"
import { useDepartments } from "../../hooks/useDepartments"
import type { AppearanceItemKey, AppearanceRecord, CleaningItemKey, CleaningRecord } from "../../types"

const UNASSIGNED_DEPARTMENT = "Other"
const PINNED_DEPARTMENT = "Store"

const APPEARANCE_ITEMS: { key: AppearanceItemKey; label: string }[] = [
  { key: "uniform", label: "Uniform" },
  { key: "hair_beard_moustache", label: "Hair & Beard" },
]

type DailyCheckTab = "appearance" | "cleaning"

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
    <AppCard elevation="sm" style={[styles.staffCard]}>
      <View style={styles.nameRow}>
        <View style={[styles.avatar, { backgroundColor: statusColor + "1f" }]}>
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

      <View style={[styles.chipsRow, { borderTopColor: colors.border }]}>
        {APPEARANCE_ITEMS.map((item) => {
          const isBad = issues.includes(item.key)
          const chipColor = isBad ? palette.error.default : palette.success.default
          return (
            <Pressable
              key={item.key}
              onPress={() => !isUpdating && onToggle(item.key)}
              disabled={isUpdating}
              style={({ pressed, hovered }: any) => [
                styles.chip,
                {
                  backgroundColor: chipColor + "14",
                  borderColor: chipColor + (pressed || hovered ? "" : "80"),
                  opacity: isUpdating ? 0.5 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              {isBad ? (
                <X size={12} color={chipColor} strokeWidth={2.5} />
              ) : (
                <Check size={12} color={chipColor} strokeWidth={2.5} />
              )}
              <AppText variant="caption" style={{ color: chipColor }}>
                {item.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </AppCard>
  )
}

// ─── StaffCleaningRow ─────────────────────────────────────────────────────────

function StaffCleaningRow({
  record,
  isBad,
  isUpdating,
  onToggle,
}: {
  record: CleaningRecord
  isBad: boolean
  isUpdating: boolean
  onToggle: () => void
}) {
  const { colors } = useTheme()
  const initials = record.staffName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const statusColor = isBad ? palette.error.default : palette.success.default

  return (
    <AppCard elevation="sm" style={[styles.staffCard]}>
      <View style={styles.nameRow}>
        <View style={[styles.avatar, { backgroundColor: statusColor + "1f" }]}>
          <AppText variant="bodyMedium" style={{ color: statusColor }}>
            {initials}
          </AppText>
        </View>
        <AppText variant="bodyMedium" style={styles.staffName} numberOfLines={1}>
          {record.staffName}
        </AppText>
        {isUpdating ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : isBad ? (
          <View style={[styles.badge, { backgroundColor: palette.error.default + "18" }]}>
            <AlertCircle size={11} color={palette.error.default} strokeWidth={2} />
            <AppText variant="caption" style={{ color: palette.error.default }}>
              Not clean
            </AppText>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: palette.success.default + "18" }]}>
            <Check size={11} color={palette.success.default} strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: palette.success.default }}>
              OK
            </AppText>
          </View>
        )}
      </View>

      <View style={[styles.chipsRow, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => !isUpdating && onToggle()}
          disabled={isUpdating}
          style={({ pressed, hovered }: any) => [
            styles.chip,
            {
              backgroundColor: statusColor + "14",
              borderColor: statusColor + (pressed || hovered ? "" : "80"),
              opacity: isUpdating ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          {isBad ? (
            <X size={12} color={statusColor} strokeWidth={2.5} />
          ) : (
            <Check size={12} color={statusColor} strokeWidth={2.5} />
          )}
          <AppText variant="caption" style={{ color: statusColor }}>
            Cleanliness
          </AppText>
        </Pressable>
      </View>
    </AppCard>
  )
}

// ─── AppearanceTab ────────────────────────────────────────────────────────────

function AppearanceTab({ search }: { search: string }) {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()

  const [issues, setIssues] = useState<Record<number, AppearanceItemKey[]>>({})
  const [initialized, setInitialized] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const { data: departmentsData } = useDepartments()

  const { data: appearanceData, isLoading: isLoadingAppearance } = useQuery({
    queryKey: ["appearance-today"],
    queryFn: () => appearanceService.getTodayAppearance(),
  })

  const isLoading = isLoadingStaff || isLoadingAppearance

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
    onSuccess: (_, { staffId, updated }) => {
      queryClient.setQueryData(["appearance-today"], (old: typeof appearanceData) => {
        if (!old?.data) return old
        const staff = old.data.staff.some((r) => r.staffId === staffId)
          ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, violations: updated, issues: updated } : r))
          : [...old.data.staff, { staffId, staffName: "", violations: updated, issues: updated }]
        return { ...old, data: { ...old.data, staff } }
      })
    },
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

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return records
    return records.filter((r) => r.staffName.toLowerCase().includes(query))
  }, [records, search])

  const { width: winWidth } = useWindowDimensions()
  const numColumns = winWidth >= 1400 ? 3 : winWidth >= 1024 ? 3 : winWidth >= 768 ? 2 : 1

  type GridRow =
    | { type: "header"; key: string; label: string; count: number }
    | { type: "records"; key: string; items: AppearanceRecord[] }

  const gridRows = useMemo<GridRow[]>(() => {
    const departmentNameById = new Map<string, string>()
    departmentsData?.data.forEach((d) => {
      departmentNameById.set(d._id, d.name)
    })

    const departmentById = new Map<number, string>()
    staffData?.data.forEach((s) => {
      const deptName = s.departmentId ? departmentNameById.get(s.departmentId) : undefined
      departmentById.set(s.id, deptName ?? UNASSIGNED_DEPARTMENT)
    })

    const departmentGroups = new Map<string, AppearanceRecord[]>()
    filteredRecords.forEach((r) => {
      const dept = departmentById.get(r.staffId) ?? UNASSIGNED_DEPARTMENT
      if (!departmentGroups.has(dept)) departmentGroups.set(dept, [])
      departmentGroups.get(dept)!.push(r)
    })

    const departmentNames = [
      ...(departmentGroups.has(PINNED_DEPARTMENT) ? [PINNED_DEPARTMENT] : []),
      ...[...departmentGroups.keys()]
        .filter((d) => d !== UNASSIGNED_DEPARTMENT && d !== PINNED_DEPARTMENT)
        .sort(),
      ...(departmentGroups.has(UNASSIGNED_DEPARTMENT) ? [UNASSIGNED_DEPARTMENT] : []),
    ]

    const rows: GridRow[] = []
    departmentNames.forEach((dept) => {
      const items = departmentGroups.get(dept) ?? []
      rows.push({ type: "header", key: `header-${dept}`, label: dept, count: items.length })
      for (let i = 0; i < items.length; i += numColumns) {
        rows.push({ type: "records", key: `${dept}-${i}`, items: items.slice(i, i + numColumns) })
      }
    })
    return rows
  }, [filteredRecords, staffData, departmentsData, numColumns])

  return (
    <FlatList
      data={gridRows}
      keyExtractor={(row) => row.key}
      renderItem={({ item: row }) =>
        row.type === "header" ? (
          <View style={[styles.deptHeader, numColumns === 1 && styles.deptHeaderPadded]}>
            <AppText variant="bodyMedium" color="secondary">{row.label}</AppText>
            <AppText variant="caption" color="tertiary">{"  "}{row.count}</AppText>
          </View>
        ) : (
          <View style={numColumns > 1 ? styles.gridRow : undefined}>
            {row.items.map((item) => (
              <View key={item.staffId} style={numColumns > 1 ? styles.gridCell : { marginBottom: spacing[3] }}>
                <StaffAppearanceRow
                  record={item}
                  issues={issues[item.staffId] ?? []}
                  isUpdating={updatingIds.has(item.staffId)}
                  onToggle={(key) => handleToggle(item.staffId, key)}
                />
              </View>
            ))}
          </View>
        )
      }
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : (
          <View style={styles.center}>
            <AppText color="tertiary">
              {search ? "No staff match your search" : "No staff records found"}
            </AppText>
          </View>
        )
      }
    />
  )
}

// ─── CleaningTab ──────────────────────────────────────────────────────────────

function CleaningTab({ search }: { search: string }) {
  const { colors } = useTheme()
  const queryClient = useQueryClient()

  const [badIds, setBadIds] = useState<Record<number, boolean>>({})
  const [initialized, setInitialized] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const { data: departmentsData } = useDepartments()

  const { data: cleaningData, isLoading: isLoadingCleaning } = useQuery({
    queryKey: ["cleaning-today"],
    queryFn: () => cleaningService.getTodayCleaning(),
  })

  const isLoading = isLoadingStaff || isLoadingCleaning

  useEffect(() => {
    if (staffData?.data && !isLoadingCleaning && !initialized) {
      const badMap: Record<number, boolean> = {}
      for (const r of cleaningData?.data?.staff ?? []) {
        const violations = (r.violations ?? r.issues ?? []) as CleaningItemKey[]
        badMap[r.staffId] = violations.length > 0
      }
      const map: Record<number, boolean> = {}
      for (const s of staffData.data) {
        map[s.id] = badMap[s.id] ?? false
      }
      setBadIds(map)
      setInitialized(true)
    }
  }, [staffData, cleaningData, isLoadingCleaning, initialized])

  const updateMutation = useMutation({
    mutationFn: ({ staffId, isBad }: { staffId: number; isBad: boolean }) =>
      cleaningService.updateCleaning(staffId, isBad ? ["cleanliness"] : []),
    onSuccess: (_, { staffId, isBad }) => {
      const violations: CleaningItemKey[] = isBad ? ["cleanliness"] : []
      queryClient.setQueryData(["cleaning-today"], (old: typeof cleaningData) => {
        if (!old?.data) return old
        const staff = old.data.staff.some((r) => r.staffId === staffId)
          ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, violations, issues: violations } : r))
          : [...old.data.staff, { staffId, staffName: "", violations, issues: violations }]
        return { ...old, data: { ...old.data, staff } }
      })
    },
    onSettled: (_, __, { staffId }) => {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(staffId)
        return next
      })
    },
  })

  function handleToggle(staffId: number) {
    if (updatingIds.has(staffId)) return
    const nextBad = !(badIds[staffId] ?? false)
    setBadIds((prev) => ({ ...prev, [staffId]: nextBad }))
    setUpdatingIds((prev) => new Set([...prev, staffId]))
    updateMutation.mutate({ staffId, isBad: nextBad })
  }

  const records: CleaningRecord[] = useMemo(
    () =>
      (staffData?.data ?? []).map((s) => ({
        staffId: s.id,
        staffName: s.name,
      })),
    [staffData]
  )

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return records
    return records.filter((r) => r.staffName.toLowerCase().includes(query))
  }, [records, search])

  const { width: winWidth } = useWindowDimensions()
  const numColumns = winWidth >= 1400 ? 3 : winWidth >= 1024 ? 3 : winWidth >= 768 ? 2 : 1

  type GridRow =
    | { type: "header"; key: string; label: string; count: number }
    | { type: "records"; key: string; items: CleaningRecord[] }

  const gridRows = useMemo<GridRow[]>(() => {
    const departmentNameById = new Map<string, string>()
    departmentsData?.data.forEach((d) => {
      departmentNameById.set(d._id, d.name)
    })

    const departmentById = new Map<number, string>()
    staffData?.data.forEach((s) => {
      const deptName = s.departmentId ? departmentNameById.get(s.departmentId) : undefined
      departmentById.set(s.id, deptName ?? UNASSIGNED_DEPARTMENT)
    })

    const departmentGroups = new Map<string, CleaningRecord[]>()
    filteredRecords.forEach((r) => {
      const dept = departmentById.get(r.staffId) ?? UNASSIGNED_DEPARTMENT
      if (!departmentGroups.has(dept)) departmentGroups.set(dept, [])
      departmentGroups.get(dept)!.push(r)
    })

    const departmentNames = [
      ...(departmentGroups.has(PINNED_DEPARTMENT) ? [PINNED_DEPARTMENT] : []),
      ...[...departmentGroups.keys()]
        .filter((d) => d !== UNASSIGNED_DEPARTMENT && d !== PINNED_DEPARTMENT)
        .sort(),
      ...(departmentGroups.has(UNASSIGNED_DEPARTMENT) ? [UNASSIGNED_DEPARTMENT] : []),
    ]

    const rows: GridRow[] = []
    departmentNames.forEach((dept) => {
      const items = departmentGroups.get(dept) ?? []
      rows.push({ type: "header", key: `header-${dept}`, label: dept, count: items.length })
      for (let i = 0; i < items.length; i += numColumns) {
        rows.push({ type: "records", key: `${dept}-${i}`, items: items.slice(i, i + numColumns) })
      }
    })
    return rows
  }, [filteredRecords, staffData, departmentsData, numColumns])

  return (
    <FlatList
      data={gridRows}
      keyExtractor={(row) => row.key}
      renderItem={({ item: row }) =>
        row.type === "header" ? (
          <View style={[styles.deptHeader, numColumns === 1 && styles.deptHeaderPadded]}>
            <AppText variant="bodyMedium" color="secondary">{row.label}</AppText>
            <AppText variant="caption" color="tertiary">{"  "}{row.count}</AppText>
          </View>
        ) : (
          <View style={numColumns > 1 ? styles.gridRow : undefined}>
            {row.items.map((item) => (
              <View key={item.staffId} style={numColumns > 1 ? styles.gridCell : { marginBottom: spacing[3] }}>
                <StaffCleaningRow
                  record={item}
                  isBad={badIds[item.staffId] ?? false}
                  isUpdating={updatingIds.has(item.staffId)}
                  onToggle={() => handleToggle(item.staffId)}
                />
              </View>
            ))}
          </View>
        )
      }
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : (
          <View style={styles.center}>
            <AppText color="tertiary">
              {search ? "No staff match your search" : "No staff records found"}
            </AppText>
          </View>
        )
      }
    />
  )
}

// ─── DailyCheckScreen ─────────────────────────────────────────────────────────

export default function DailyCheckScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const [tab, setTab] = useState<DailyCheckTab>("appearance")
  const [search, setSearch] = useState("")

  const today = moment().format("ddd, D MMM YYYY")

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {!isTablet && <BackButton />}
          <View>
            <AppText variant="heading3">Daily Check</AppText>
            <AppText variant="caption" color="tertiary">
              {today}
            </AppText>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setTab("appearance")}
          style={[styles.tabBtn, tab === "appearance" && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
        >
          <AppText
            variant={tab === "appearance" ? "bodyMedium" : "body"}
            style={{ color: tab === "appearance" ? colors.accent : colors.text.secondary }}
          >
            Appearance
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setTab("cleaning")}
          style={[styles.tabBtn, tab === "cleaning" && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
        >
          <AppText
            variant={tab === "cleaning" ? "bodyMedium" : "body"}
            style={{ color: tab === "cleaning" ? colors.accent : colors.text.secondary }}
          >
            Cleaning
          </AppText>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <AppInput
          placeholder="Search staff name..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          rightIcon={
            search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <XCircle size={16} color={colors.text.tertiary} strokeWidth={1.75} />
              </Pressable>
            ) : (
              <Search size={16} color={colors.text.tertiary} strokeWidth={1.75} />
            )
          }
        />
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.background.secondary, borderBottomColor: colors.border }]}>
        <AppText variant="caption" color="tertiary">
          Tap any item on a staff card to toggle its violation status
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

      {tab === "appearance" ? <AppearanceTab search={search} /> : <CleaningTab search={search} />}
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
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginRight: spacing[4],
  },
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  deptHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  deptHeaderPadded: { paddingHorizontal: spacing[1] },
  gridRow: { flexDirection: "row", gap: spacing[3] },
  gridCell: { flex: 1, marginBottom: spacing[3] },
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
