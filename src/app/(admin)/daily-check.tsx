import { useState, useEffect, useMemo } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, useWindowDimensions } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, AlertCircle, Search, XCircle, ChevronLeft, ChevronRight } from "lucide-react-native"
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
import { welcomingCustomerService } from "../../services/welcomingCustomerService"
import { attendanceService } from "../../services/attendanceService"
import { useDepartments } from "../../hooks/useDepartments"
import type {
  AppearanceItemKey,
  CleaningItemKey,
  WelcomingCustomerItemKey,
} from "../../types"

const UNASSIGNED_DEPARTMENT = "Other"
const PINNED_DEPARTMENT = "Store"

const APPEARANCE_ITEMS: { key: AppearanceItemKey; label: string }[] = [
  { key: "uniform", label: "Uniform" },
  { key: "hair_beard_moustache", label: "Hair & Beard" },
]

const WELCOMING_CUSTOMER_ITEMS: { key: WelcomingCustomerItemKey; label: string }[] = [
  { key: "no_greeting", label: "No Greeting" },
  { key: "no_smile", label: "No Smile" },
  { key: "ignored_customer", label: "Ignored Customer" },
]

interface StaffDailyCheck {
  staffId: number
  staffName: string
  appearanceIssues: AppearanceItemKey[]
  isCleaningBad: boolean
  welcomingIssues: WelcomingCustomerItemKey[]
}

// ─── ChipsSection ───────────────────────────────────────────────────────────

function ChipsSection<K extends string>({
  title,
  items,
  activeKeys,
  isUpdating,
  onToggle,
}: {
  title: string
  items: { key: K; label: string }[]
  activeKeys: K[]
  isUpdating: boolean
  onToggle: (key: K) => void
}) {
  const { colors } = useTheme()
  const isAllOk = activeKeys.length === 0

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="caption" color="secondary">
          {title}
        </AppText>
        {isAllOk ? (
          <View style={[styles.badge, { backgroundColor: palette.success.default + "18" }]}>
            <Check size={10} color={palette.success.default} strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: palette.success.default }}>
              OK
            </AppText>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: palette.error.default + "18" }]}>
            <AlertCircle size={10} color={palette.error.default} strokeWidth={2} />
            <AppText variant="caption" style={{ color: palette.error.default }}>
              {activeKeys.length} issue{activeKeys.length > 1 ? "s" : ""}
            </AppText>
          </View>
        )}
      </View>
      <View style={[styles.chipsRow, { borderTopColor: colors.border }]}>
        {items.map((item) => {
          const isBad = activeKeys.includes(item.key)
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
    </View>
  )
}

// ─── StaffDailyCheckCard ──────────────────────────────────────────────────────

function StaffDailyCheckCard({
  record,
  isUpdatingAppearance,
  isUpdatingCleaning,
  isUpdatingWelcoming,
  onToggleAppearance,
  onToggleCleaning,
  onToggleWelcoming,
}: {
  record: StaffDailyCheck
  isUpdatingAppearance: boolean
  isUpdatingCleaning: boolean
  isUpdatingWelcoming: boolean
  onToggleAppearance: (key: AppearanceItemKey) => void
  onToggleCleaning: () => void
  onToggleWelcoming: (key: WelcomingCustomerItemKey) => void
}) {
  const { colors } = useTheme()
  const isAllOk = record.appearanceIssues.length === 0 && !record.isCleaningBad && record.welcomingIssues.length === 0
  const initials = record.staffName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const statusColor = isAllOk ? palette.success.default : palette.error.default
  const isUpdating = isUpdatingAppearance || isUpdatingCleaning || isUpdatingWelcoming

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
              All OK
            </AppText>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: palette.error.default + "18" }]}>
            <AlertCircle size={11} color={palette.error.default} strokeWidth={2} />
            <AppText variant="caption" style={{ color: palette.error.default }}>
              Issues
            </AppText>
          </View>
        )}
      </View>

      <ChipsSection
        title="Appearance"
        items={APPEARANCE_ITEMS}
        activeKeys={record.appearanceIssues}
        isUpdating={isUpdatingAppearance}
        onToggle={onToggleAppearance}
      />

      <ChipsSection
        title="Cleaning"
        items={[{ key: "cleanliness" as CleaningItemKey, label: "Cleanliness" }]}
        activeKeys={record.isCleaningBad ? (["cleanliness"] as CleaningItemKey[]) : []}
        isUpdating={isUpdatingCleaning}
        onToggle={onToggleCleaning}
      />

      <ChipsSection
        title="Welcoming Customer"
        items={WELCOMING_CUSTOMER_ITEMS}
        activeKeys={record.welcomingIssues}
        isUpdating={isUpdatingWelcoming}
        onToggle={onToggleWelcoming}
      />
    </AppCard>
  )
}

// ─── DailyCheckScreen ─────────────────────────────────────────────────────────

export default function DailyCheckScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const [search, setSearch] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => moment().format("YYYY-MM-DD"))
  const queryClient = useQueryClient()

  const isToday = selectedDate === moment().format("YYYY-MM-DD")
  const displayDate = moment(selectedDate).format("ddd, D MMM YYYY")

  function goToPreviousDay() {
    setSelectedDate((d) => moment(d).subtract(1, "day").format("YYYY-MM-DD"))
  }

  function goToNextDay() {
    if (isToday) return
    setSelectedDate((d) => moment(d).add(1, "day").format("YYYY-MM-DD"))
  }

  const [appearanceIssues, setAppearanceIssues] = useState<Record<number, AppearanceItemKey[]>>({})
  const [cleaningBad, setCleaningBad] = useState<Record<number, boolean>>({})
  const [welcomingIssues, setWelcomingIssues] = useState<Record<number, WelcomingCustomerItemKey[]>>({})
  const [initialized, setInitialized] = useState(false)
  const [updatingAppearanceIds, setUpdatingAppearanceIds] = useState<Set<number>>(new Set())
  const [updatingCleaningIds, setUpdatingCleaningIds] = useState<Set<number>>(new Set())
  const [updatingWelcomingIds, setUpdatingWelcomingIds] = useState<Set<number>>(new Set())

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const { data: departmentsData } = useDepartments()

  const { data: appearanceData, isLoading: isLoadingAppearance } = useQuery({
    queryKey: ["appearance-today", selectedDate],
    queryFn: () => appearanceService.getTodayAppearance(selectedDate),
  })

  const { data: cleaningData, isLoading: isLoadingCleaning } = useQuery({
    queryKey: ["cleaning-today", selectedDate],
    queryFn: () => cleaningService.getTodayCleaning(selectedDate),
  })

  const { data: welcomingData, isLoading: isLoadingWelcoming } = useQuery({
    queryKey: ["welcoming-customer-today", selectedDate],
    queryFn: () => welcomingCustomerService.getTodayWelcomingCustomer(selectedDate),
  })

  const isLoading = isLoadingStaff || isLoadingAppearance || isLoadingCleaning || isLoadingWelcoming

  useEffect(() => {
    setInitialized(false)
  }, [selectedDate])

  useEffect(() => {
    if (staffData?.data && !isLoadingAppearance && !isLoadingCleaning && !isLoadingWelcoming && !initialized) {
      const appearanceMap: Record<number, AppearanceItemKey[]> = {}
      for (const r of appearanceData?.data?.staff ?? []) {
        appearanceMap[r.staffId] = (r.violations ?? r.issues ?? []) as AppearanceItemKey[]
      }
      const cleaningMap: Record<number, boolean> = {}
      for (const r of cleaningData?.data?.staff ?? []) {
        const violations = (r.violations ?? r.issues ?? []) as CleaningItemKey[]
        cleaningMap[r.staffId] = violations.length > 0
      }
      const welcomingMap: Record<number, WelcomingCustomerItemKey[]> = {}
      for (const r of welcomingData?.data?.staff ?? []) {
        welcomingMap[r.staffId] = (r.violations ?? r.issues ?? []) as WelcomingCustomerItemKey[]
      }

      const nextAppearance: Record<number, AppearanceItemKey[]> = {}
      const nextCleaning: Record<number, boolean> = {}
      const nextWelcoming: Record<number, WelcomingCustomerItemKey[]> = {}
      for (const s of staffData.data) {
        nextAppearance[s.id] = appearanceMap[s.id] ?? []
        nextCleaning[s.id] = cleaningMap[s.id] ?? false
        nextWelcoming[s.id] = welcomingMap[s.id] ?? []
      }
      setAppearanceIssues(nextAppearance)
      setCleaningBad(nextCleaning)
      setWelcomingIssues(nextWelcoming)
      setInitialized(true)
    }
  }, [staffData, appearanceData, cleaningData, welcomingData, isLoadingAppearance, isLoadingCleaning, isLoadingWelcoming, initialized])

  const appearanceMutation = useMutation({
    mutationFn: ({ staffId, updated }: { staffId: number; updated: AppearanceItemKey[] }) =>
      appearanceService.updateAppearance(staffId, updated, selectedDate),
    onSuccess: (_, { staffId, updated }) => {
      queryClient.setQueryData(["appearance-today", selectedDate], (old: typeof appearanceData) => {
        if (!old?.data) return old
        const staff = old.data.staff.some((r) => r.staffId === staffId)
          ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, violations: updated, issues: updated } : r))
          : [...old.data.staff, { staffId, staffName: "", violations: updated, issues: updated }]
        return { ...old, data: { ...old.data, staff } }
      })
    },
    onSettled: (_, __, { staffId }) => {
      setUpdatingAppearanceIds((prev) => {
        const next = new Set(prev)
        next.delete(staffId)
        return next
      })
    },
  })

  const cleaningMutation = useMutation({
    mutationFn: ({ staffId, isBad }: { staffId: number; isBad: boolean }) =>
      cleaningService.updateCleaning(staffId, isBad ? ["cleanliness"] : [], selectedDate),
    onSuccess: (_, { staffId, isBad }) => {
      const violations: CleaningItemKey[] = isBad ? ["cleanliness"] : []
      queryClient.setQueryData(["cleaning-today", selectedDate], (old: typeof cleaningData) => {
        if (!old?.data) return old
        const staff = old.data.staff.some((r) => r.staffId === staffId)
          ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, violations, issues: violations } : r))
          : [...old.data.staff, { staffId, staffName: "", violations, issues: violations }]
        return { ...old, data: { ...old.data, staff } }
      })
    },
    onSettled: (_, __, { staffId }) => {
      setUpdatingCleaningIds((prev) => {
        const next = new Set(prev)
        next.delete(staffId)
        return next
      })
    },
  })

  const welcomingMutation = useMutation({
    mutationFn: ({ staffId, updated }: { staffId: number; updated: WelcomingCustomerItemKey[] }) =>
      welcomingCustomerService.updateWelcomingCustomer(staffId, updated, selectedDate),
    onSuccess: (_, { staffId, updated }) => {
      queryClient.setQueryData(["welcoming-customer-today", selectedDate], (old: typeof welcomingData) => {
        if (!old?.data) return old
        const staff = old.data.staff.some((r) => r.staffId === staffId)
          ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, violations: updated, issues: updated } : r))
          : [...old.data.staff, { staffId, staffName: "", violations: updated, issues: updated }]
        return { ...old, data: { ...old.data, staff } }
      })
    },
    onSettled: (_, __, { staffId }) => {
      setUpdatingWelcomingIds((prev) => {
        const next = new Set(prev)
        next.delete(staffId)
        return next
      })
    },
  })

  function handleToggleAppearance(staffId: number, itemKey: AppearanceItemKey) {
    if (updatingAppearanceIds.has(staffId)) return
    const current = appearanceIssues[staffId] ?? []
    const isBad = current.includes(itemKey)
    const updated = isBad ? current.filter((k) => k !== itemKey) : [...current, itemKey]
    setAppearanceIssues((prev) => ({ ...prev, [staffId]: updated }))
    setUpdatingAppearanceIds((prev) => new Set([...prev, staffId]))
    appearanceMutation.mutate({ staffId, updated })
  }

  function handleToggleCleaning(staffId: number) {
    if (updatingCleaningIds.has(staffId)) return
    const nextBad = !(cleaningBad[staffId] ?? false)
    setCleaningBad((prev) => ({ ...prev, [staffId]: nextBad }))
    setUpdatingCleaningIds((prev) => new Set([...prev, staffId]))
    cleaningMutation.mutate({ staffId, isBad: nextBad })
  }

  function handleToggleWelcoming(staffId: number, itemKey: WelcomingCustomerItemKey) {
    if (updatingWelcomingIds.has(staffId)) return
    const current = welcomingIssues[staffId] ?? []
    const isBad = current.includes(itemKey)
    const updated = isBad ? current.filter((k) => k !== itemKey) : [...current, itemKey]
    setWelcomingIssues((prev) => ({ ...prev, [staffId]: updated }))
    setUpdatingWelcomingIds((prev) => new Set([...prev, staffId]))
    welcomingMutation.mutate({ staffId, updated })
  }

  const records: StaffDailyCheck[] = useMemo(
    () =>
      (staffData?.data ?? []).map((s) => ({
        staffId: s.id,
        staffName: s.name,
        appearanceIssues: appearanceIssues[s.id] ?? [],
        isCleaningBad: cleaningBad[s.id] ?? false,
        welcomingIssues: welcomingIssues[s.id] ?? [],
      })),
    [staffData, appearanceIssues, cleaningBad, welcomingIssues]
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
    | { type: "records"; key: string; items: StaffDailyCheck[] }

  const departmentById = useMemo(() => {
    const departmentNameById = new Map<string, string>()
    departmentsData?.data.forEach((d) => {
      departmentNameById.set(d._id, d.name)
    })
    const byId = new Map<number, string>()
    staffData?.data.forEach((s) => {
      const deptName = s.departmentId ? departmentNameById.get(s.departmentId) : undefined
      byId.set(s.id, deptName ?? UNASSIGNED_DEPARTMENT)
    })
    return byId
  }, [staffData, departmentsData])

  const allDepartmentNames = useMemo(() => {
    const names = new Set<string>()
    departmentById.forEach((name) => names.add(name))
    return [
      ...(names.has(PINNED_DEPARTMENT) ? [PINNED_DEPARTMENT] : []),
      ...[...names].filter((d) => d !== UNASSIGNED_DEPARTMENT && d !== PINNED_DEPARTMENT).sort(),
      ...(names.has(UNASSIGNED_DEPARTMENT) ? [UNASSIGNED_DEPARTMENT] : []),
    ]
  }, [departmentById])

  const gridRows = useMemo<GridRow[]>(() => {
    const departmentGroups = new Map<string, StaffDailyCheck[]>()
    filteredRecords.forEach((r) => {
      const dept = departmentById.get(r.staffId) ?? UNASSIGNED_DEPARTMENT
      if (selectedDepartment && dept !== selectedDepartment) return
      if (!departmentGroups.has(dept)) departmentGroups.set(dept, [])
      departmentGroups.get(dept)!.push(r)
    })

    const departmentNames = selectedDepartment
      ? [selectedDepartment].filter((d) => departmentGroups.has(d))
      : allDepartmentNames

    const rows: GridRow[] = []
    departmentNames.forEach((dept) => {
      const items = departmentGroups.get(dept) ?? []
      rows.push({ type: "header", key: `header-${dept}`, label: dept, count: items.length })
      for (let i = 0; i < items.length; i += numColumns) {
        rows.push({ type: "records", key: `${dept}-${i}`, items: items.slice(i, i + numColumns) })
      }
    })
    return rows
  }, [filteredRecords, departmentById, allDepartmentNames, selectedDepartment, numColumns])

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {!isTablet && <BackButton />}
          <View>
            <AppText variant="heading3">Daily Check</AppText>
          </View>
        </View>

        <View style={styles.dateNav}>
          <Pressable onPress={goToPreviousDay} hitSlop={8} style={styles.dateNavBtn}>
            <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
          <AppText variant="bodyMedium" style={styles.dateNavLabel}>
            {isToday ? "Today" : displayDate}
          </AppText>
          <Pressable
            onPress={goToNextDay}
            hitSlop={8}
            disabled={isToday}
            style={[styles.dateNavBtn, isToday && styles.dateNavBtnDisabled]}
          >
            <ChevronRight size={18} color={isToday ? colors.text.tertiary : colors.text.secondary} strokeWidth={2} />
          </Pressable>
        </View>
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

      {/* Department filter */}
      <View style={[styles.deptFilterWrap, { borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...allDepartmentNames]}
          keyExtractor={(d) => d ?? "all"}
          contentContainerStyle={styles.deptFilterList}
          renderItem={({ item: dept }) => {
            const isActive = selectedDepartment === dept
            return (
              <Pressable
                onPress={() => setSelectedDepartment(dept)}
                style={[
                  styles.deptChip,
                  {
                    backgroundColor: isActive ? colors.accent + "18" : colors.background.secondary,
                    borderColor: isActive ? colors.accent : colors.border,
                  },
                ]}
              >
                <AppText variant="caption" style={{ color: isActive ? colors.accent : colors.text.secondary }}>
                  {dept ?? "All"}
                </AppText>
              </Pressable>
            )
          }}
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
                  <StaffDailyCheckCard
                    record={item}
                    isUpdatingAppearance={updatingAppearanceIds.has(item.staffId)}
                    isUpdatingCleaning={updatingCleaningIds.has(item.staffId)}
                    isUpdatingWelcoming={updatingWelcomingIds.has(item.staffId)}
                    onToggleAppearance={(key) => handleToggleAppearance(item.staffId, key)}
                    onToggleCleaning={() => handleToggleCleaning(item.staffId)}
                    onToggleWelcoming={(key) => handleToggleWelcoming(item.staffId, key)}
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
  dateNav: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  dateNavBtn: { padding: spacing[1] },
  dateNavBtnDisabled: { opacity: 0.35 },
  dateNavLabel: { minWidth: 90, textAlign: "center" },
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deptFilterWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing[2],
  },
  deptFilterList: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
  },
  deptChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
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
  section: { marginTop: spacing[3] },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[1],
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
