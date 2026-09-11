import { toTitleCase } from "../../utils/helpers"
import React, { useState, useRef, useMemo, useCallback } from "react"
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { useRouter } from "expo-router"
import { UserPlus, BarChart3, ChevronLeft, ChevronRight, ChevronsUpDown, Pencil } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import DrawerMenuButton from "../../components/shared/DrawerMenuButton"
import RefreshButton from "../../components/shared/RefreshButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import AttendanceListSkeleton from "../../components/shared/AttendanceListSkeleton"
import Popup from "../../components/shared/Popup"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import AppInput from "../../components/ui/AppInput"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii } from "../../constants/theme"
import { useAttendance } from "../../hooks/useAttendance"
import { useRole } from "../../hooks/useRole"
import { useCurrentStaff, useStaff } from "../../hooks/useStaff"
import { useDepartments } from "../../hooks/useDepartments"
import { attendanceService } from "../../services/attendanceService"
import SummaryBar from "../../components/attendance/SummaryBar"
import AttendanceRow from "../../components/attendance/AttendanceRow"
import StaffCardDesktop from "../../components/attendance/StaffCardDesktop"
import EditSessionsModal from "../../components/attendance/EditSessionsModal"
import OvertimeApprovalModal from "../../components/attendance/OvertimeApprovalModal"
import { STATUS_ORDER, needsAttention } from "../../components/attendance/helpers"
import type { AttendanceRecord } from "../../types"

const UNASSIGNED_DEPARTMENT = "Other"
const PINNED_DEPARTMENT = "Store"

type GridRow =
  | { type: "header"; key: string; label: string; count: number }
  | { type: "records"; key: string; items: AttendanceRecord[] }

export default function AttendanceScreen() {
  const { colors, isDark } = useTheme()
  const { isTablet, isDesktop } = useTablet()
  const { width: windowWidth } = useWindowDimensions()
  const desktopColumns = windowWidth >= 1600 ? 3 : 2
  const router = useRouter()
  const [search, setSearch] = useState("")
  const today = moment().format("YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState(today)
  const isToday = selectedDate === today
  const emptyMessage = isToday
    ? "No attendance records for today"
    : `No attendance records for ${moment(selectedDate).format("D MMM YYYY")}`
  const { isHR, isAdmin } = useRole()
  const { currentStaff } = useCurrentStaff()
  const { data: staffData } = useStaff()
  const { data: departmentsData } = useDepartments()
  const [iosPickerVisible, setIosPickerVisible] = useState(false)
  const [iosTempDate, setIosTempDate] = useState(new Date())
  const webDateInputRef = useRef<HTMLInputElement | null>(null)
  const [editTarget, setEditTarget] = useState<AttendanceRecord | null>(null)
  const [otApprovalTarget, setOtApprovalTarget] = useState<AttendanceRecord | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [expandAllSignal, setExpandAllSignal] = useState({ value: false, token: 0 })
  const [actionError, setActionError] = useState<string | null>(null)

  function toggleExpandAll() {
    setExpandAllSignal((prev) => ({ value: !prev.value, token: prev.token + 1 }))
  }

  const { data, isLoading, refetch, isRefetching } = useAttendance(selectedDate)

  function goToPrevDay() {
    setSelectedDate(moment(selectedDate).subtract(1, "day").format("YYYY-MM-DD"))
  }

  function goToNextDay() {
    if (isToday) return
    setSelectedDate(moment(selectedDate).add(1, "day").format("YYYY-MM-DD"))
  }

  function openDatePicker() {
    const current = moment(selectedDate).toDate()
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        maximumDate: new Date(),
        onChange: (_, d) => { if (d) setSelectedDate(moment(d).format("YYYY-MM-DD")) },
      })
    } else if (Platform.OS === "ios") {
      setIosTempDate(current)
      setIosPickerVisible(true)
    } else if (Platform.OS === "web") {
      webDateInputRef.current?.showPicker?.()
    }
  }

  const summary = data?.summary ?? { present: 0, late: 0, absent: 0 }

  const records = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...(data?.data ?? [])]
      .filter((r) => r.staffName.toLowerCase().includes(query))
      .sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
        if (statusDiff !== 0) return statusDiff
        return Number(needsAttention(b)) - Number(needsAttention(a))
      })
  }, [data?.data, search])

  const departmentByStaffId = useMemo(() => {
    const departmentNameById = new Map<string, string>()
    departmentsData?.data.forEach((d) => {
      departmentNameById.set(d._id, d.name)
    })

    const byStaffId = new Map<number, string>()
    staffData?.data.forEach((s) => {
      const deptName = s.departmentId ? departmentNameById.get(s.departmentId) : undefined
      byStaffId.set(s.id, deptName ?? UNASSIGNED_DEPARTMENT)
    })
    return byStaffId
  }, [departmentsData?.data, staffData?.data])

  const { departmentGroups, departmentNames } = useMemo(() => {
    const groups = new Map<string, AttendanceRecord[]>()
    records.forEach((r) => {
      const dept = departmentByStaffId.get(r.staffId) ?? UNASSIGNED_DEPARTMENT
      if (!groups.has(dept)) groups.set(dept, [])
      groups.get(dept)!.push(r)
    })

    const names = [
      ...(groups.has(PINNED_DEPARTMENT) ? [PINNED_DEPARTMENT] : []),
      ...[...groups.keys()]
        .filter((d) => d !== UNASSIGNED_DEPARTMENT && d !== PINNED_DEPARTMENT)
        .sort(),
      ...(groups.has(UNASSIGNED_DEPARTMENT) ? [UNASSIGNED_DEPARTMENT] : []),
    ]

    return { departmentGroups: groups, departmentNames: names }
  }, [records, departmentByStaffId])

  const buildGridRows = useCallback(
    (columns: number): GridRow[] => {
      const rows: GridRow[] = []
      departmentNames.forEach((dept) => {
        const items = departmentGroups.get(dept) ?? []
        rows.push({ type: "header", key: `header-${dept}`, label: dept, count: items.length })
        for (let i = 0; i < items.length; i += columns) {
          rows.push({ type: "records", key: `${dept}-${i}`, items: items.slice(i, i + columns) })
        }
      })
      return rows
    },
    [departmentNames, departmentGroups],
  )

  const desktopRows = useMemo(() => buildGridRows(desktopColumns), [buildGridRows, desktopColumns])
  const mobileRows = useMemo(() => buildGridRows(1), [buildGridRows])

  const canEditRecord = useCallback(
    (record: AttendanceRecord): boolean => {
      if (!editMode || !currentStaff) return false
      return record.staffId !== currentStaff.id
    },
    [editMode, currentStaff],
  )

  const canDecideOvertimeFor = useCallback(
    (record: AttendanceRecord): boolean => {
      if (!currentStaff || !(isAdmin || isHR)) return false
      return record.staffId !== currentStaff.id
    },
    [currentStaff, isAdmin, isHR],
  )

  const handleRejectOvertime = useCallback(
    async (record: AttendanceRecord) => {
      try {
        await attendanceService.decideOvertime(record.staffId, selectedDate, false)
        refetch()
      } catch (e) {
        setActionError(
          e instanceof Error && e.message
            ? e.message
            : `Could not reject overtime for ${toTitleCase(record.staffName)}. Please try again.`,
        )
      }
    },
    [selectedDate, refetch],
  )

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && (isHR ? <DrawerMenuButton /> : <BackButton />)}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Attendance</AppText>
        </View>

        {isDesktop && (
          <View style={styles.headerSearch}>
            <AppInput
              placeholder="Search staff name..."
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
        )}

        <View style={styles.headerActions}>
          <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
          <Pressable onPress={toggleExpandAll} style={styles.enrollBtn} hitSlop={8}>
            <ChevronsUpDown size={20} color={colors.text.tertiary} strokeWidth={1.75} />
          </Pressable>
          <Pressable onPress={() => setEditMode((v) => !v)} style={styles.enrollBtn} hitSlop={8}>
            <Pencil size={22} color={editMode ? colors.accent : colors.text.tertiary} strokeWidth={1.75} />
          </Pressable>
          <Pressable onPress={() => router.push("/(admin)/attendance-dashboard")} style={styles.enrollBtn} hitSlop={8}>
            <BarChart3 size={22} color={colors.accent} strokeWidth={1.75} />
          </Pressable>
          <Pressable onPress={() => router.push("/(admin)/enroll")} style={styles.enrollBtn} hitSlop={8}>
            <UserPlus size={22} color={colors.accent} strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      {!isDesktop && (
        <View style={[styles.searchBar, { borderBottomColor: colors.border }]}>
          <AppInput
            placeholder="Search staff name..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      )}

      {/* Date switcher */}
      <View style={[styles.dateBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={goToPrevDay} hitSlop={10} style={[styles.dateArrowBtn, { backgroundColor: colors.background.secondary }]}>
          <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={openDatePicker}
          style={[styles.datePill, { backgroundColor: isToday ? colors.accentSubtle : colors.background.secondary }]}
        >
          <AppText variant="bodyMedium" style={{ color: isToday ? colors.accent : colors.text.primary }}>
            {moment(selectedDate).format("dddd")}
          </AppText>
          <View style={[styles.datePillDivider, { backgroundColor: isToday ? colors.accent : colors.border, opacity: isToday ? 0.35 : 1 }]} />
          <AppText variant="body" style={{ color: isToday ? colors.accent : colors.text.secondary }}>
            {isToday ? `Today · ${moment(selectedDate).format("D MMM YYYY")}` : moment(selectedDate).format("D MMM YYYY")}
          </AppText>
          {Platform.OS === "web" &&
            React.createElement("input", {
              ref: webDateInputRef,
              type: "date",
              value: selectedDate,
              max: today,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.value) setSelectedDate(e.target.value)
              },
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              },
            })}
        </Pressable>

        <Pressable
          onPress={goToNextDay}
          hitSlop={10}
          disabled={isToday}
          style={[styles.dateArrowBtn, { backgroundColor: colors.background.secondary, opacity: isToday ? 0.35 : 1 }]}
        >
          <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
        </Pressable>
      </View>

      {Platform.OS === "ios" && (
        <Modal
          transparent
          visible={iosPickerVisible}
          animationType="slide"
          onRequestClose={() => setIosPickerVisible(false)}
        >
          <Pressable style={styles.datePickerOverlay} onPress={() => setIosPickerVisible(false)} />
          <View style={[styles.datePickerSheet, { backgroundColor: colors.background.secondary, borderTopColor: colors.border as string }]}>
            <View style={[styles.datePickerHandle, { backgroundColor: colors.border as string }]} />
            <DateTimePicker
              mode="date"
              value={iosTempDate}
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, d) => { if (d) setIosTempDate(d) }}
              themeVariant={isDark ? "dark" : "light"}
              style={{ width: "100%", height: 200 }}
            />
            <Pressable
              onPress={() => {
                setSelectedDate(moment(iosTempDate).format("YYYY-MM-DD"))
                setIosPickerVisible(false)
              }}
              style={[styles.datePickerDoneBtn, { backgroundColor: colors.accent }]}
            >
              <AppText variant="bodyMedium" style={{ color: "#FFFFFF" }}>Done</AppText>
            </Pressable>
          </View>
        </Modal>
      )}

      {/* Summary */}
      <View style={{ marginVertical: spacing[4] }}>
        <SummaryBar
          present={summary.present}
          late={summary.late}
          absent={summary.absent}
          isLoading={isLoading}
        />
      </View>


      {/* List */}
      {isDesktop ? (
        <FlatList
          key={`desktop-grid-${desktopColumns}`}
          data={desktopRows}
          keyExtractor={(row) => row.key}
          renderItem={({ item: row, index }) =>
            row.type === "header" ? (
              <View style={styles.deptHeader}>
                <AppText variant="bodyMedium" color="secondary">{row.label}</AppText>
                <AppText variant="caption" color="tertiary">{"  "}{row.count}</AppText>
              </View>
            ) : (
              <AnimatedListItem index={index} style={[styles.deskGridRow, expandAllSignal.value && styles.deskGridRowStretch]}>
                {row.items.map((item) => (
                  <View key={item.staffId} style={{ flex: 1 }}>
                    <StaffCardDesktop record={item} canEdit={canEditRecord(item)} onEdit={setEditTarget} expandAllSignal={expandAllSignal} canDecideOvertime={canDecideOvertimeFor(item)} onApproveOvertime={setOtApprovalTarget} onRejectOvertime={handleRejectOvertime} />
                  </View>
                ))}
              </AnimatedListItem>
            )
          }
          contentContainerStyle={styles.deskGridContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            isLoading ? (
              <AttendanceListSkeleton />
            ) : (
              <View style={styles.center}>
                <AppText color="tertiary">{emptyMessage}</AppText>
              </View>
            )
          }
        />
      ) : (
      <FlatList
        data={mobileRows}
        keyExtractor={(row) => row.key}
        renderItem={({ item: row, index }) =>
          row.type === "header" ? (
            <View style={[styles.deptHeader, styles.deptHeaderPadded]}>
              <AppText variant="bodyMedium" color="secondary">{row.label}</AppText>
              <AppText variant="caption" color="tertiary">{"  "}{row.count}</AppText>
            </View>
          ) : (
            <AnimatedListItem index={index}>
              <AttendanceRow record={row.items[0]} canEdit={canEditRecord(row.items[0])} onEdit={setEditTarget} expandAllSignal={expandAllSignal} canDecideOvertime={canDecideOvertimeFor(row.items[0])} onApproveOvertime={setOtApprovalTarget} onRejectOvertime={handleRejectOvertime} />
            </AnimatedListItem>
          )
        }
        contentContainerStyle={{ paddingBottom: spacing[20] }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <AttendanceListSkeleton />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">{emptyMessage}</AppText>
            </View>
          )
        }
      />
      )}

      {/* Edit sessions modal */}
      {editTarget && (
        <EditSessionsModal
          record={editTarget}
          date={selectedDate}
          onClose={() => setEditTarget(null)}
          onSaved={refetch}
        />
      )}

      {/* Action error */}
      {actionError && (
        <Popup title="Action failed" onClose={() => setActionError(null)}>
          <AppText color="secondary">{actionError}</AppText>
          <View style={{ marginTop: spacing[4] }}>
            <AppButton label="Close" onPress={() => setActionError(null)} />
          </View>
        </Popup>
      )}

      {/* Overtime approval modal */}
      {otApprovalTarget && (
        <OvertimeApprovalModal
          record={otApprovalTarget}
          date={selectedDate}
          onClose={() => setOtApprovalTarget(null)}
          onSaved={refetch}
        />
      )}
    </View>
  )
}

// ─── styles ────────────────────────────────────────────────────────────────

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
  enrollBtn: { padding: spacing[2] },
  headerSearch: { width: 180 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  searchBar: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    position: "relative",
    overflow: "hidden",
  },
  datePillDivider: { width: StyleSheet.hairlineWidth, height: 16 },
  datePickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  datePickerSheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    alignItems: "center",
  },
  datePickerHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: spacing[4] },
  datePickerDoneBtn: {
    width: "100%",
    height: 52,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing[4],
  },
  deskGridContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[20],
    gap: spacing[4],
  },
  deskGridRow: {
    flexDirection: "row",
    gap: spacing[4],
    alignItems: "flex-start",
  },
  deskGridRowStretch: {
    alignItems: "stretch",
  },
  deptHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  deptHeaderPadded: {
    paddingHorizontal: spacing[5],
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
})
