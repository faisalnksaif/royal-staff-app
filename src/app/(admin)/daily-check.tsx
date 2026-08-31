import { useState, useMemo, useEffect, useRef } from "react"
import { View, FlatList, ScrollView, ActivityIndicator, StyleSheet, Pressable, useWindowDimensions, Modal } from "react-native"
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, AlertCircle, Search, XCircle, ChevronLeft, ChevronRight, LayoutGrid, Table } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { attendanceService } from "../../services/attendanceService"
import { dailyCheckCategoryService, createCategoryService } from "../../services/dailyCheckCategoryService"
import { useDepartments } from "../../hooks/useDepartments"
import type { DailyCheckCategoryDef, TodayDailyCheckCategory } from "../../types"

const UNASSIGNED_DEPARTMENT = "Other"
const PINNED_DEPARTMENT = "Store"

function humanizeViolationKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

interface StaffDailyCheck {
  staffId: number
  staffName: string
  categories: DailyCheckCategoryDef[]
  violationsByCategory: Record<string, string[]>
  remarksByCategory: Record<string, string>
}

// ─── ChipsSection ───────────────────────────────────────────────────────────

function ChipsSection({
  title,
  items,
  activeKeys,
  isUpdating,
  onToggle,
  disabled,
  disabledNote,
  remarks,
  onRemarksChange,
  onRemarksSave,
}: {
  title: string
  items: { key: string; label: string }[]
  activeKeys: string[]
  isUpdating: boolean
  onToggle: (key: string) => void
  disabled?: boolean
  disabledNote?: string
  remarks: string
  onRemarksChange: (remarks: string) => void
  onRemarksSave: (remarks: string) => void
}) {
  const { colors } = useTheme()
  const [draftRemarks, setDraftRemarks] = useState(remarks)
  useEffect(() => setDraftRemarks(remarks), [remarks])
  const isAllOk = activeKeys.length === 0

  if (disabled) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="bodySmall" color="secondary">
            {title}
          </AppText>
        </View>
        <View style={[styles.chipsRow, { borderTopColor: colors.border }]}>
          <AppText variant="bodySmall" color="tertiary" style={{ fontStyle: "italic" }}>
            {disabledNote ?? "Not applicable"}
          </AppText>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="bodyMedium" color="secondary">
          {title}
        </AppText>
        {isAllOk ? (
          <View style={[styles.badge, { backgroundColor: palette.success.default + "18" }]}>
            <Check size={13} color={palette.success.default} strokeWidth={2.5} />
            <AppText variant="bodySmall" style={{ color: palette.success.default }}>
              OK
            </AppText>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: palette.error.default + "18" }]}>
            <AlertCircle size={13} color={palette.error.default} strokeWidth={2} />
            <AppText variant="bodySmall" style={{ color: palette.error.default }}>
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
                <X size={15} color={chipColor} strokeWidth={2.5} />
              ) : (
                <Check size={15} color={chipColor} strokeWidth={2.5} />
              )}
              <AppText variant="bodySmall" style={{ color: chipColor }}>
                {item.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>
      <View style={styles.remarksRow}>
        <AppInput
          placeholder={isAllOk ? "Remarks" : "Remarks (required)"}
          value={draftRemarks}
          onChangeText={setDraftRemarks}
          editable={!isUpdating}
        />
        <AppButton
          label="Save"
          size="sm"
          onPress={() => { onRemarksChange(draftRemarks); onRemarksSave(draftRemarks) }}
          disabled={isUpdating || (!isAllOk && draftRemarks.trim().length === 0)}
          style={{ marginTop: spacing[2] }}
        />
      </View>
    </View>
  )
}

// ─── StaffDailyCheckCard ──────────────────────────────────────────────────────

function StaffDailyCheckCard({
  record,
  isUpdating,
  onToggle,
  onRemarksChange,
  onRemarksSave,
}: {
  record: StaffDailyCheck
  isUpdating: (category: string) => boolean
  onToggle: (category: string, key: string) => void
  onRemarksChange: (category: string, remarks: string) => void
  onRemarksSave: (category: string, remarks: string) => void
}) {
  const { colors } = useTheme()
  const isAllOk = record.categories.every((c) => (record.violationsByCategory[c.category] ?? []).length === 0)
  const initials = record.staffName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const statusColor = isAllOk ? palette.success.default : palette.error.default
  const anyUpdating = record.categories.some((c) => isUpdating(c.category))

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
        {anyUpdating ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : isAllOk ? (
          <View style={[styles.badge, { backgroundColor: palette.success.default + "18" }]}>
            <Check size={13} color={palette.success.default} strokeWidth={2.5} />
            <AppText variant="bodySmall" style={{ color: palette.success.default }}>
              All OK
            </AppText>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: palette.error.default + "18" }]}>
            <AlertCircle size={13} color={palette.error.default} strokeWidth={2} />
            <AppText variant="bodySmall" style={{ color: palette.error.default }}>
              Issues
            </AppText>
          </View>
        )}
      </View>

      {record.categories.map((category) => (
        <ChipsSection
          key={category.category}
          title={category.label}
          items={category.violations.map((v) => ({ key: v, label: humanizeViolationKey(v) }))}
          activeKeys={record.violationsByCategory[category.category] ?? []}
          isUpdating={isUpdating(category.category)}
          onToggle={(key) => onToggle(category.category, key)}
          disabled={Boolean(category.note)}
          disabledNote={category.note}
          remarks={record.remarksByCategory[category.category] ?? ""}
          onRemarksChange={(remarks) => onRemarksChange(category.category, remarks)}
          onRemarksSave={(remarks) => onRemarksSave(category.category, remarks)}
        />
      ))}
    </AppCard>
  )
}

// ─── SheetView ────────────────────────────────────────────────────────────────

const SHEET_NAME_COL_WIDTH = 180
const SHEET_CATEGORY_COL_WIDTH = 150
const SHEET_ROW_HEIGHT = 52

function SheetCategoryCell({
  category,
  activeKeys,
  isUpdating,
  isOpen,
  onOpen,
  onClose,
  onToggle,
  remarks,
  onRemarksChange,
  onRemarksSave,
}: {
  category: DailyCheckCategoryDef
  activeKeys: string[]
  isUpdating: boolean
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onToggle: (key: string) => void
  remarks: string
  onRemarksChange: (remarks: string) => void
  onRemarksSave: (remarks: string) => void
}) {
  const { colors } = useTheme()
  const [draftRemarks, setDraftRemarks] = useState(remarks)
  useEffect(() => setDraftRemarks(remarks), [remarks])

  if (category.note) {
    return (
      <View style={[styles.sheetCell, { width: SHEET_CATEGORY_COL_WIDTH, borderColor: colors.border }]}>
        <AppText variant="caption" color="tertiary" style={{ fontStyle: "italic" }} numberOfLines={1}>
          {category.note}
        </AppText>
      </View>
    )
  }

  const isOk = activeKeys.length === 0
  const cellColor = isOk ? palette.success.default : palette.error.default

  return (
    <View style={[styles.sheetCell, { width: SHEET_CATEGORY_COL_WIDTH, borderColor: colors.border }]}>
      <Pressable
        onPress={onOpen}
        disabled={isUpdating}
        style={({ pressed }) => [
          styles.sheetCellButton,
          {
            backgroundColor: cellColor + (pressed ? "22" : "14"),
            borderColor: cellColor + "80",
            opacity: isUpdating ? 0.5 : 1,
          },
        ]}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color={cellColor} />
        ) : isOk ? (
          <Check size={16} color={cellColor} strokeWidth={2.5} />
        ) : (
          <>
            <X size={16} color={cellColor} strokeWidth={2.5} />
            <AppText variant="bodySmall" style={{ color: cellColor }}>
              {activeKeys.length}
            </AppText>
          </>
        )}
      </Pressable>

      {isOpen ? (
        <Modal transparent animationType="fade" onRequestClose={onClose} visible={isOpen}>
          <Pressable style={styles.sheetModalBackdrop} onPress={onClose}>
            <Pressable
              style={[styles.sheetPopover, { backgroundColor: colors.background.primary, borderColor: colors.border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetPopoverHeader}>
                <AppText variant="heading3">
                  {category.label}
                </AppText>
                {isOk ? (
                  <View style={[styles.badge, { backgroundColor: palette.success.default + "18" }]}>
                    <Check size={13} color={palette.success.default} strokeWidth={2.5} />
                    <AppText variant="bodySmall" style={{ color: palette.success.default }}>
                      OK
                    </AppText>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: palette.error.default + "18" }]}>
                    <AlertCircle size={13} color={palette.error.default} strokeWidth={2} />
                    <AppText variant="bodySmall" style={{ color: palette.error.default }}>
                      {activeKeys.length} issue{activeKeys.length > 1 ? "s" : ""}
                    </AppText>
                  </View>
                )}
              </View>
              <View style={styles.sheetPopoverChips}>
                {category.violations.map((v) => {
                  const isBad = activeKeys.includes(v)
                  const chipColor = isBad ? palette.error.default : palette.success.default
                  return (
                    <Pressable
                      key={v}
                      onPress={() => !isUpdating && onToggle(v)}
                      disabled={isUpdating}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: chipColor + "14",
                          borderColor: chipColor + (pressed ? "" : "80"),
                        },
                      ]}
                    >
                      {isBad ? (
                        <X size={15} color={chipColor} strokeWidth={2.5} />
                      ) : (
                        <Check size={15} color={chipColor} strokeWidth={2.5} />
                      )}
                      <AppText variant="bodySmall" style={{ color: chipColor }}>
                        {humanizeViolationKey(v)}
                      </AppText>
                    </Pressable>
                  )
                })}
              </View>
              <View style={styles.sheetPopoverRemarks}>
                <AppText variant="bodySmall" color="secondary" style={{ marginBottom: spacing[1] }}>
                  {isOk ? "Remarks" : "Remarks (required)"}
                </AppText>
                <AppInput
                  placeholder="Add a note..."
                  value={draftRemarks}
                  onChangeText={setDraftRemarks}
                  editable={!isUpdating}
                />
                <AppButton
                  label="Save"
                  size="md"
                  onPress={() => { onRemarksChange(draftRemarks); onRemarksSave(draftRemarks) }}
                  disabled={isUpdating || (!isOk && draftRemarks.trim().length === 0)}
                  style={{ marginTop: spacing[3] }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  )
}

function SheetView({
  records,
  categories,
  isUpdating,
  onToggle,
  onRemarksChange,
  onRemarksSave,
}: {
  records: StaffDailyCheck[]
  categories: DailyCheckCategoryDef[]
  isUpdating: (category: string, staffId: number) => boolean
  onToggle: (staffId: number, category: string, key: string) => void
  onRemarksChange: (staffId: number, category: string, remarks: string) => void
  onRemarksSave: (staffId: number, category: string, remarks: string) => void
}) {
  const { colors } = useTheme()
  const [openCell, setOpenCell] = useState<string | null>(null)
  // Departments may each define their own category (different key + violation list) under the
  // same label (e.g. "Major Violations" for Store / Plywood Godown / Glass Godown). Collapse
  // those into a single column keyed by label; each staff row resolves its own department's
  // variant via record.categories.
  const columnsByLabel = useMemo(() => {
    const seen = new Set<string>()
    const result: DailyCheckCategoryDef[] = []
    categories.forEach((c) => {
      if (seen.has(c.label)) return
      seen.add(c.label)
      result.push(c)
    })
    return result
  }, [categories])
  const nameScrollRef = useRef<ScrollView>(null)
  const bodyScrollRef = useRef<ScrollView>(null)
  const syncingFrom = useRef<"name" | "body" | null>(null)

  function handleNameScroll(y: number) {
    if (syncingFrom.current === "body") {
      syncingFrom.current = null
      return
    }
    syncingFrom.current = "name"
    bodyScrollRef.current?.scrollTo({ y, animated: false })
  }

  function handleBodyScroll(y: number) {
    if (syncingFrom.current === "name") {
      syncingFrom.current = null
      return
    }
    syncingFrom.current = "body"
    nameScrollRef.current?.scrollTo({ y, animated: false })
  }

  return (
    <View style={styles.sheetContainer}>
      {/* Fixed name column */}
      <View style={[styles.sheetNameColumn, { borderColor: colors.border }]}>
        <View style={[styles.sheetRow, styles.sheetHeaderRow, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <View style={[styles.sheetCell, styles.sheetNameCell, { width: SHEET_NAME_COL_WIDTH, borderColor: colors.border, borderRightWidth: 0 }]}>
            <AppText variant="bodySmall" color="secondary">Staff</AppText>
          </View>
        </View>
        <ScrollView
          ref={nameScrollRef}
          style={styles.sheetVScroll}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => handleNameScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {records.map((record) => {
            const isAllOk = record.categories.every((c) => (record.violationsByCategory[c.category] ?? []).length === 0)
            const statusColor = isAllOk ? palette.success.default : palette.error.default
            return (
              <View key={record.staffId} style={[styles.sheetRow, { borderColor: colors.border }]}>
                <View style={[styles.sheetCell, styles.sheetNameCell, { width: SHEET_NAME_COL_WIDTH, borderColor: colors.border, borderRightWidth: 0 }]}>
                  <View style={[styles.sheetDot, { backgroundColor: statusColor }]} />
                  <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                    {record.staffName}
                  </AppText>
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* Scrollable category columns */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.sheetHScroll} style={{ flex: 1 }}>
        <View>
          <View style={[styles.sheetRow, styles.sheetHeaderRow, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
            {columnsByLabel.map((c) => (
              <View key={c.label} style={[styles.sheetCell, { width: SHEET_CATEGORY_COL_WIDTH, borderColor: colors.border }]}>
                <AppText variant="bodySmall" color="secondary" numberOfLines={1}>{c.label}</AppText>
              </View>
            ))}
          </View>

          <ScrollView
            ref={bodyScrollRef}
            style={styles.sheetVScroll}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => handleBodyScroll(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >
            {records.map((record) => (
              <View key={record.staffId} style={[styles.sheetRow, { borderColor: colors.border }]}>
                {columnsByLabel.map((col) => {
                  const ownDef = record.categories.find((rc) => rc.label === col.label)
                  if (!ownDef) {
                    return (
                      <View key={col.label} style={[styles.sheetCell, { width: SHEET_CATEGORY_COL_WIDTH, borderColor: colors.border }]}>
                        <AppText variant="caption" color="tertiary">—</AppText>
                      </View>
                    )
                  }
                  const cellKey = `${record.staffId}:${ownDef.category}`
                  return (
                    <SheetCategoryCell
                      key={col.label}
                      category={ownDef}
                      activeKeys={record.violationsByCategory[ownDef.category] ?? []}
                      isUpdating={isUpdating(ownDef.category, record.staffId)}
                      isOpen={openCell === cellKey}
                      onOpen={() => setOpenCell(cellKey)}
                      onClose={() => setOpenCell(null)}
                      onToggle={(key) => onToggle(record.staffId, ownDef.category, key)}
                      remarks={record.remarksByCategory[ownDef.category] ?? ""}
                      onRemarksChange={(remarks) => onRemarksChange(record.staffId, ownDef.category, remarks)}
                      onRemarksSave={(remarks) => onRemarksSave(record.staffId, ownDef.category, remarks)}
                    />
                  )
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── DailyCheckScreen ─────────────────────────────────────────────────────────

export default function DailyCheckScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "sheet">("sheet")
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [issuesOnly, setIssuesOnly] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => moment().format("YYYY-MM-DD"))
  const [updatingKeys, setUpdatingKeys] = useState<Set<string>>(new Set())
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

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const { data: departmentsData } = useDepartments()

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["daily-check-categories"],
    queryFn: () => dailyCheckCategoryService.getCategoriesByDepartment(),
  })

  const categoriesByDepartment = categoriesData?.data ?? {}

  const allCategories = useMemo(() => {
    const byKey = new Map<string, DailyCheckCategoryDef>()
    Object.values(categoriesByDepartment).forEach((defs) => {
      defs.forEach((def) => byKey.set(def.category, def))
    })
    return [...byKey.values()]
  }, [categoriesByDepartment])

  const categoryQueries = useQueries({
    queries: allCategories.map((def) => ({
      queryKey: ["category-today", def.apiBasePath, selectedDate],
      queryFn: () => createCategoryService(def.apiBasePath).getToday(selectedDate),
      enabled: allCategories.length > 0,
    })),
  })

  const isLoadingCategoryData = categoryQueries.some((q) => q.isLoading)
  const isLoading = isLoadingStaff || isLoadingCategories || isLoadingCategoryData

  const violationsByCategoryByStaff = useMemo(() => {
    const map: Record<string, Record<number, string[]>> = {}
    allCategories.forEach((def, i) => {
      const staffList = categoryQueries[i]?.data?.data?.staff ?? []
      const byStaff: Record<number, string[]> = {}
      staffList.forEach((r) => {
        byStaff[r.staffId] = (r.violations ?? r.issues ?? []) as string[]
      })
      map[def.category] = byStaff
    })
    return map
  }, [allCategories, categoryQueries])

  const remarksByCategoryByStaff = useMemo(() => {
    const map: Record<string, Record<number, string>> = {}
    allCategories.forEach((def, i) => {
      const staffList = categoryQueries[i]?.data?.data?.staff ?? []
      const byStaff: Record<number, string> = {}
      staffList.forEach((r) => {
        byStaff[r.staffId] = r.remarks ?? ""
      })
      map[def.category] = byStaff
    })
    return map
  }, [allCategories, categoryQueries])

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

  const records: StaffDailyCheck[] = useMemo(
    () =>
      (staffData?.data ?? []).map((s) => {
        const deptName = departmentById.get(s.id) ?? UNASSIGNED_DEPARTMENT
        const categories = categoriesByDepartment[deptName] ?? []
        const violationsByCategory: Record<string, string[]> = {}
        const remarksByCategory: Record<string, string> = {}
        categories.forEach((c) => {
          violationsByCategory[c.category] = violationsByCategoryByStaff[c.category]?.[s.id] ?? []
          remarksByCategory[c.category] = remarksByCategoryByStaff[c.category]?.[s.id] ?? ""
        })
        return {
          staffId: s.id,
          staffName: s.name,
          categories,
          violationsByCategory,
          remarksByCategory,
        }
      }),
    [staffData, departmentById, categoriesByDepartment, violationsByCategoryByStaff, remarksByCategoryByStaff]
  )

  const categoryMutation = useMutation({
    mutationFn: ({
      apiBasePath,
      staffId,
      violations,
      remarks,
    }: {
      category: string
      apiBasePath: string
      staffId: number
      violations: string[]
      remarks: string
    }) => createCategoryService(apiBasePath).update(staffId, violations, remarks, selectedDate),
    onSuccess: (_, { apiBasePath, staffId, violations, remarks }) => {
      queryClient.setQueryData(
        ["category-today", apiBasePath, selectedDate],
        (old: { success: boolean; data: TodayDailyCheckCategory } | undefined) => {
          if (!old?.data) return old
          const staff = old.data.staff.some((r) => r.staffId === staffId)
            ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, violations, issues: violations, remarks } : r))
            : [...old.data.staff, { staffId, staffName: "", violations, issues: violations, remarks }]
          return { ...old, data: { ...old.data, staff } }
        }
      )
    },
    onSettled: (_, __, { category, staffId }) => {
      setUpdatingKeys((prev) => {
        const next = new Set(prev)
        next.delete(`${category}:${staffId}`)
        return next
      })
    },
  })

  function handleToggle(staffId: number, category: string, apiBasePath: string, key: string) {
    const record = records.find((r) => r.staffId === staffId)
    const current = record?.violationsByCategory[category] ?? []
    const isBad = current.includes(key)
    const updated = isBad ? current.filter((k) => k !== key) : [...current, key]

    queryClient.setQueryData(
      ["category-today", apiBasePath, selectedDate],
      (old: { success: boolean; data: TodayDailyCheckCategory } | undefined) => {
        if (!old?.data) return old
        const staff = old.data.staff.some((r) => r.staffId === staffId)
          ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, violations: updated, issues: updated } : r))
          : [...old.data.staff, { staffId, staffName: "", violations: updated, issues: updated }]
        return { ...old, data: { ...old.data, staff } }
      }
    )
  }

  function handleRemarksChange(staffId: number, category: string, apiBasePath: string, remarks: string) {
    queryClient.setQueryData(
      ["category-today", apiBasePath, selectedDate],
      (old: { success: boolean; data: TodayDailyCheckCategory } | undefined) => {
        if (!old?.data) return old
        const staff = old.data.staff.some((r) => r.staffId === staffId)
          ? old.data.staff.map((r) => (r.staffId === staffId ? { ...r, remarks } : r))
          : [...old.data.staff, { staffId, staffName: "", violations: [], issues: [], remarks }]
        return { ...old, data: { ...old.data, staff } }
      }
    )
  }

  function handleSave(staffId: number, category: string, apiBasePath: string, remarks: string) {
    const updatingKey = `${category}:${staffId}`
    if (updatingKeys.has(updatingKey)) return
    const record = records.find((r) => r.staffId === staffId)
    const violations = record?.violationsByCategory[category] ?? []
    setUpdatingKeys((prev) => new Set([...prev, updatingKey]))
    categoryMutation.mutate({ category, apiBasePath, staffId, violations, remarks })
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    let result = records
    if (query) result = result.filter((r) => r.staffName.toLowerCase().includes(query))
    if (issuesOnly) {
      result = result.filter((r) => r.categories.some((c) => (r.violationsByCategory[c.category] ?? []).length > 0))
    }
    return result
  }, [records, search, issuesOnly])

  const { width: winWidth } = useWindowDimensions()
  const numColumns = winWidth >= 1400 ? 3 : winWidth >= 1024 ? 3 : winWidth >= 768 ? 2 : 1

  type GridRow =
    | { type: "header"; key: string; label: string; count: number }
    | { type: "records"; key: string; items: StaffDailyCheck[] }

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

          <View style={[styles.viewSwitch, { borderColor: colors.border }]}>
            <Pressable
              onPress={() => setViewMode("grid")}
              style={[styles.viewSwitchBtn, viewMode === "grid" && { backgroundColor: colors.accent + "18" }]}
            >
              <LayoutGrid size={15} color={viewMode === "grid" ? colors.accent : colors.text.secondary} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode("sheet")}
              style={[styles.viewSwitchBtn, viewMode === "sheet" && { backgroundColor: colors.accent + "18" }]}
            >
              <Table size={15} color={viewMode === "sheet" ? colors.accent : colors.text.secondary} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
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
          <Pressable
            onPress={() => setIssuesOnly((v) => !v)}
            style={[
              styles.issuesToggle,
              {
                backgroundColor: issuesOnly ? palette.error.default + "18" : colors.background.secondary,
                borderColor: issuesOnly ? palette.error.default : colors.border,
              },
            ]}
          >
            <AlertCircle size={16} color={issuesOnly ? palette.error.default : colors.text.secondary} strokeWidth={2} />
            <AppText variant="bodySmall" style={{ color: issuesOnly ? palette.error.default : colors.text.secondary }}>
              Issues only
            </AppText>
          </Pressable>
        </View>
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
                <AppText variant="bodySmall" style={{ color: isActive ? colors.accent : colors.text.secondary }}>
                  {dept ?? "All"}
                </AppText>
              </Pressable>
            )
          }}
        />
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: colors.background.secondary, borderBottomColor: colors.border }]}>
        <AppText variant="bodySmall" color="tertiary">
          Tap any item on a staff card to toggle its violation status
        </AppText>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <Check size={13} color={palette.success.default} strokeWidth={2.5} />
            <AppText variant="bodySmall" style={{ color: palette.success.default }}>
              OK
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <X size={13} color={palette.error.default} strokeWidth={2.5} />
            <AppText variant="bodySmall" style={{ color: palette.error.default }}>
              Violation
            </AppText>
          </View>
        </View>
      </View>

      {viewMode === "sheet" ? (
        isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : filteredRecords.length === 0 ? (
          <View style={styles.center}>
            <AppText color="tertiary">
              {search ? "No staff match your search" : "No staff records found"}
            </AppText>
          </View>
        ) : (
          <SheetView
            records={
              selectedDepartment
                ? filteredRecords.filter((r) => (departmentById.get(r.staffId) ?? UNASSIGNED_DEPARTMENT) === selectedDepartment)
                : filteredRecords
            }
            categories={allCategories}
            isUpdating={(category, staffId) => updatingKeys.has(`${category}:${staffId}`)}
            onToggle={(staffId, category, key) => {
              const record = records.find((r) => r.staffId === staffId)
              const def = record?.categories.find((c) => c.category === category)
              if (!def) return
              handleToggle(staffId, category, def.apiBasePath, key)
            }}
            onRemarksChange={(staffId, category, remarks) => {
              const record = records.find((r) => r.staffId === staffId)
              const def = record?.categories.find((c) => c.category === category)
              if (!def) return
              handleRemarksChange(staffId, category, def.apiBasePath, remarks)
            }}
            onRemarksSave={(staffId, category, remarks) => {
              const record = records.find((r) => r.staffId === staffId)
              const def = record?.categories.find((c) => c.category === category)
              if (!def) return
              handleSave(staffId, category, def.apiBasePath, remarks)
            }}
          />
        )
      ) : (
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
                      isUpdating={(category) => updatingKeys.has(`${category}:${item.staffId}`)}
                      onToggle={(category, key) => {
                        const def = item.categories.find((c) => c.category === category)
                        if (!def) return
                        handleToggle(item.staffId, category, def.apiBasePath, key)
                      }}
                      onRemarksChange={(category, remarks) => {
                        const def = item.categories.find((c) => c.category === category)
                        if (!def) return
                        handleRemarksChange(item.staffId, category, def.apiBasePath, remarks)
                      }}
                      onRemarksSave={(category, remarks) => {
                        const def = item.categories.find((c) => c.category === category)
                        if (!def) return
                        handleSave(item.staffId, category, def.apiBasePath, remarks)
                      }}
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
      )}
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  issuesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
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
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  section: { marginTop: spacing[4] },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[3],
    flexWrap: "wrap",
  },
  remarksRow: {
    marginTop: spacing[3],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  viewSwitch: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    overflow: "hidden",
    marginLeft: spacing[3],
  },
  viewSwitchBtn: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  sheetContainer: { flex: 1, flexDirection: "row", paddingLeft: spacing[4] },
  sheetNameColumn: {
    borderRightWidth: 1,
    zIndex: 1,
  },
  sheetHScroll: { paddingRight: spacing[4] },
  sheetVScroll: {},
  sheetRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetHeaderRow: {
    borderBottomWidth: 1,
  },
  sheetCell: {
    height: SHEET_ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sheetNameCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing[2],
    paddingLeft: spacing[3],
  },
  sheetDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  sheetCellButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    width: "100%",
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  sheetModalBackdrop: {
    flex: 1,
    backgroundColor: "#00000055",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPopover: {
    minWidth: 320,
    maxWidth: 420,
    padding: spacing[5],
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  sheetPopoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  sheetPopoverChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  sheetPopoverRemarks: {
    marginTop: spacing[4],
  },
})
