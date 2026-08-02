import { toTitleCase } from "../../utils/helpers"
import { useState, useEffect } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { Pencil, ChevronDown, Check, Clock, Building2 } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import TimeInput from "../../components/shared/TimeInput"
import Popup from "../../components/shared/Popup"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { useStaff } from "../../hooks/useStaff"
import { useShifts } from "../../hooks/useShifts"
import { useDepartments } from "../../hooks/useDepartments"
import { useRole } from "../../hooks/useRole"
import { staffService } from "../../services/staffService"
import { shiftService } from "../../services/shiftService"
import { departmentService } from "../../services/departmentService"
import { useQueryClient } from "@tanstack/react-query"
import type { StaffResponse, ShiftResponse, DepartmentResponse } from "../../types"

// ─── StaffCard ────────────────────────────────────────────────────────────────

function StaffRow({
  staff, shift, department, onEdit,
}: {
  staff: StaffResponse
  shift: ShiftResponse | null
  department: DepartmentResponse | null
  onEdit: () => void
}) {
  const { colors } = useTheme()
  return (
    <AppCard elevation="sm" style={styles.staffCard}>
      <View style={[styles.staffAvatar, { backgroundColor: colors.accentSubtle }]}>
        <AppText variant="bodyMedium" style={{ color: colors.accent }}>
          {staff.name.slice(0, 2).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.staffInfo}>
        <AppText variant="bodyMedium">{toTitleCase(staff.name)}</AppText>
        <View style={styles.staffMetaRow}>
          <AppText variant="caption" color="secondary">
            {department ? department.name : "No department"}
          </AppText>
          <AppText variant="caption" color="tertiary">
            {"  ·  "}{shift ? shift.name : "Default shift"}
          </AppText>
        </View>
      </View>
      <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
        <Pencil size={18} color={colors.text.tertiary} strokeWidth={1.75} />
      </Pressable>
    </AppCard>
  )
}

// ─── EditStaffModal ─────────────────────────────────────────────────────────

function EditStaffModal({
  staff, shifts, departments, onClose, onSaved,
}: {
  staff: StaffResponse
  shifts: ShiftResponse[]
  departments: DepartmentResponse[]
  onClose: () => void
  onSaved: () => void
}) {
  const { colors } = useTheme()
  const [departmentId, setDepartmentId] = useState<string | undefined>(staff.departmentId ?? undefined)
  const [deptPickerOpen, setDeptPickerOpen] = useState(false)
  const [shiftId, setShiftId] = useState<string | undefined>(staff.shiftId ?? undefined)
  const [shiftPickerOpen, setShiftPickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const selectedShift = shifts.find((s) => s._id === shiftId) ?? null
  const selectedDepartment = departments.find((d) => d._id === departmentId) ?? null

  async function handleSave() {
    setIsSaving(true)
    setError("")
    try {
      await staffService.updateStaff(staff.id, { departmentId, shiftId })
      onSaved()
      onClose()
    } catch (e) {
      setError((e as Error).message ?? "Failed to update staff")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popup title={toTitleCase(staff.name)} onClose={onClose}>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>Department</AppText>
      <Pressable
        onPress={() => setDeptPickerOpen((v) => !v)}
        style={[styles.shiftField, { borderColor: colors.border as string }]}
      >
        <AppText variant="body">
          {selectedDepartment ? selectedDepartment.name : "No department"}
        </AppText>
        <ChevronDown
          size={18}
          color={colors.text.tertiary}
          strokeWidth={2}
          style={{ transform: [{ rotate: deptPickerOpen ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {deptPickerOpen && (
        <View style={[styles.shiftOptions, { borderColor: colors.border as string }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => { setDepartmentId(undefined); setDeptPickerOpen(false) }}
              style={styles.shiftOption}
            >
              <AppText variant="body">No department</AppText>
              {!departmentId && <Check size={16} color={colors.accent} strokeWidth={2} />}
            </Pressable>
            {departments.map((dept) => (
              <Pressable
                key={dept._id}
                onPress={() => { setDepartmentId(dept._id); setDeptPickerOpen(false) }}
                style={styles.shiftOption}
              >
                <AppText variant="body">{dept.name}</AppText>
                {departmentId === dept._id && <Check size={16} color={colors.accent} strokeWidth={2} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>Shift</AppText>
      <Pressable
        onPress={() => setShiftPickerOpen((v) => !v)}
        style={[styles.shiftField, { borderColor: colors.border as string }]}
      >
        <AppText variant="body">
          {selectedShift ? `${selectedShift.name} (${selectedShift.startTime}–${selectedShift.endTime1})` : "Default shift"}
        </AppText>
        <ChevronDown
          size={18}
          color={colors.text.tertiary}
          strokeWidth={2}
          style={{ transform: [{ rotate: shiftPickerOpen ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {shiftPickerOpen && (
        <View style={[styles.shiftOptions, { borderColor: colors.border as string }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => { setShiftId(undefined); setShiftPickerOpen(false) }}
              style={styles.shiftOption}
            >
              <AppText variant="body">Default shift</AppText>
              {!shiftId && <Check size={16} color={colors.accent} strokeWidth={2} />}
            </Pressable>
            {shifts.map((shift) => (
              <Pressable
                key={shift._id}
                onPress={() => { setShiftId(shift._id); setShiftPickerOpen(false) }}
                style={styles.shiftOption}
              >
                <AppText variant="body">{shift.name} ({shift.startTime}–{shift.endTime1})</AppText>
                {shiftId === shift._id && <Check size={16} color={colors.accent} strokeWidth={2} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {error ? (
        <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[3] }}>
          {error}
        </AppText>
      ) : null}

      <View style={{ marginTop: spacing[5] }}>
        <AppButton label={isSaving ? "Saving…" : "Save Changes"} onPress={handleSave} disabled={isSaving} />
      </View>
    </Popup>
  )
}

// ─── ShiftEditor ────────────────────────────────────────────────────────────

function ShiftEditor({
  shift, onSaved,
}: {
  shift: ShiftResponse
  onSaved: () => void
}) {
  const { colors } = useTheme()
  const [name, setName] = useState(shift.name)
  const [startTime, setStartTime] = useState(shift.startTime)
  const [endTime1, setEndTime1] = useState(shift.endTime1)
  const [endTime2, setEndTime2] = useState(shift.endTime2)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const dirty = name !== shift.name || startTime !== shift.startTime
    || endTime1 !== shift.endTime1 || endTime2 !== shift.endTime2

  async function handleSave() {
    setIsSaving(true)
    setError("")
    try {
      await shiftService.updateShift(shift._id, { name, startTime, endTime1, endTime2 })
      onSaved()
    } catch (e) {
      setError((e as Error).message ?? "Failed to update shift")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={[styles.shiftEditorCard, { borderColor: colors.border as string }]}>
      <AppInput
        placeholder="Shift name"
        value={name}
        onChangeText={setName}
        style={{ marginBottom: spacing[3] }}
      />
      <View style={{ flexDirection: "row", gap: spacing[3] }}>
        <TimeInput label="Start" value={startTime} onChange={setStartTime} />
        <TimeInput label="End (normal)" value={endTime1} onChange={setEndTime1} />
        <TimeInput label="End (overtime)" value={endTime2} onChange={setEndTime2} />
      </View>
      {error ? (
        <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[2] }}>
          {error}
        </AppText>
      ) : null}
      {dirty && (
        <View style={{ marginTop: spacing[3] }}>
          <AppButton label={isSaving ? "Saving…" : "Save"} onPress={handleSave} disabled={isSaving} />
        </View>
      )}
    </View>
  )
}

function NewShiftForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime1, setEndTime1] = useState("18:00")
  const [endTime2, setEndTime2] = useState("18:00")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleCreate() {
    if (!name.trim()) {
      setError("Shift name is required")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      await shiftService.createShift({ name: name.trim(), startTime, endTime1, endTime2 })
      setName("")
      setStartTime("09:00")
      setEndTime1("18:00")
      setEndTime2("18:00")
      onCreated()
    } catch (e) {
      setError((e as Error).message ?? "Failed to create shift")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>New shift</AppText>
      <AppInput
        placeholder="Shift name"
        value={name}
        onChangeText={setName}
        style={{ marginBottom: spacing[3] }}
      />
      <View style={{ flexDirection: "row", gap: spacing[3] }}>
        <TimeInput label="Start" value={startTime} onChange={setStartTime} />
        <TimeInput label="End (normal)" value={endTime1} onChange={setEndTime1} />
        <TimeInput label="End (overtime)" value={endTime2} onChange={setEndTime2} />
      </View>
      {error ? (
        <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[2] }}>
          {error}
        </AppText>
      ) : null}
      <View style={{ marginTop: spacing[3] }}>
        <AppButton label={isSaving ? "Adding…" : "Add Shift"} onPress={handleCreate} disabled={isSaving} />
      </View>
    </View>
  )
}

function ManageShiftsModal({
  shifts, onClose, onChanged,
}: {
  shifts: ShiftResponse[]
  onClose: () => void
  onChanged: () => void
}) {
  const { colors } = useTheme()

  return (
    <Popup title="Manage Shifts" onClose={onClose}>
      <FlatList
        data={shifts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ShiftEditor shift={item} onSaved={onChanged} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        contentContainerStyle={{ paddingBottom: spacing[4] }}
        ListEmptyComponent={
          <AppText variant="caption" color="tertiary" style={{ paddingVertical: spacing[4] }}>
            No shifts defined yet
          </AppText>
        }
        ListFooterComponent={
          <View style={{ marginTop: spacing[4], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border as string, paddingTop: spacing[4] }}>
            <NewShiftForm onCreated={onChanged} />
          </View>
        }
      />
    </Popup>
  )
}

// ─── DepartmentEditor ───────────────────────────────────────────────────────

function DepartmentEditor({
  department, onSaved,
}: {
  department: DepartmentResponse
  onSaved: () => void
}) {
  const { colors } = useTheme()
  const [name, setName] = useState(department.name)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const dirty = name.trim() !== department.name

  async function handleSave() {
    if (!name.trim()) {
      setError("Department name is required")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      await departmentService.updateDepartment(department._id, name.trim())
      onSaved()
    } catch (e) {
      setError((e as Error).message ?? "Failed to update department")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={[styles.shiftEditorCard, { borderColor: colors.border as string }]}>
      <AppInput
        placeholder="Department name"
        value={name}
        onChangeText={setName}
      />
      {error ? (
        <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[2] }}>
          {error}
        </AppText>
      ) : null}
      {dirty && (
        <View style={{ marginTop: spacing[3] }}>
          <AppButton label={isSaving ? "Saving…" : "Save"} onPress={handleSave} disabled={isSaving} />
        </View>
      )}
    </View>
  )
}

function NewDepartmentForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleCreate() {
    if (!name.trim()) {
      setError("Department name is required")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      await departmentService.createDepartment(name.trim())
      setName("")
      onCreated()
    } catch (e) {
      setError((e as Error).message ?? "Failed to create department")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>New department</AppText>
      <AppInput
        placeholder="Department name"
        value={name}
        onChangeText={setName}
      />
      {error ? (
        <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[2] }}>
          {error}
        </AppText>
      ) : null}
      <View style={{ marginTop: spacing[3] }}>
        <AppButton label={isSaving ? "Adding…" : "Add Department"} onPress={handleCreate} disabled={isSaving} />
      </View>
    </View>
  )
}

function ManageDepartmentsModal({
  departments, onClose, onChanged,
}: {
  departments: DepartmentResponse[]
  onClose: () => void
  onChanged: () => void
}) {
  const { colors } = useTheme()

  return (
    <Popup title="Manage Departments" onClose={onClose}>
      <FlatList
        data={departments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <DepartmentEditor department={item} onSaved={onChanged} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        contentContainerStyle={{ paddingBottom: spacing[4] }}
        ListEmptyComponent={
          <AppText variant="caption" color="tertiary" style={{ paddingVertical: spacing[4] }}>
            No departments defined yet
          </AppText>
        }
        ListFooterComponent={
          <View style={{ marginTop: spacing[4], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border as string, paddingTop: spacing[4] }}>
            <NewDepartmentForm onCreated={onChanged} />
          </View>
        }
      />
    </Popup>
  )
}

// ─── StaffScreen ────────────────────────────────────────────────────────────

export default function StaffScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const { isAdmin, isHR } = useRole()
  const router = useRouter()
  const queryClient = useQueryClient()

  const canEdit = isAdmin || isHR

  const [search, setSearch] = useState("")
  const [editTarget, setEditTarget] = useState<StaffResponse | null>(null)
  const [manageShiftsOpen, setManageShiftsOpen] = useState(false)
  const [manageDepartmentsOpen, setManageDepartmentsOpen] = useState(false)

  const { data: staffData, isLoading, refetch, isRefetching } = useStaff()
  const { data: shiftsData, refetch: refetchShifts } = useShifts()
  const { data: departmentsData, refetch: refetchDepartments } = useDepartments()
  const shifts = shiftsData?.data ?? []
  const departments = departmentsData?.data ?? []

  const filtered = (staffData?.data ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function shiftFor(staff: StaffResponse): ShiftResponse | null {
    if (!staff.shiftId) return null
    return shifts.find((s) => s._id === staff.shiftId) ?? null
  }

  function departmentFor(staff: StaffResponse): DepartmentResponse | null {
    if (!staff.departmentId) return null
    return departments.find((d) => d._id === staff.departmentId) ?? null
  }

  // Redirect if not admin, manager, or HR
  useEffect(() => {
    if (!canEdit) router.replace("/(admin)")
  }, [canEdit])

  if (!canEdit) return null

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Staff</AppText>
          <AppText variant="caption" color="tertiary">Department &amp; shift assignment</AppText>
        </View>
        <Pressable onPress={() => setManageDepartmentsOpen(true)} hitSlop={8} style={styles.editBtn}>
          <Building2 size={20} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <Pressable onPress={() => setManageShiftsOpen(true)} hitSlop={8} style={styles.editBtn}>
          <Clock size={20} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <AppInput
          placeholder="Search staff name..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <StaffRow
              staff={item}
              shift={shiftFor(item)}
              department={departmentFor(item)}
              onEdit={() => canEdit && setEditTarget(item)}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No staff found</AppText>
            </View>
          )
        }
      />

      {editTarget && (
        <EditStaffModal
          staff={editTarget}
          shifts={shifts}
          departments={departments}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            refetch()
            queryClient.invalidateQueries({ queryKey: ["staff"] })
          }}
        />
      )}

      {manageShiftsOpen && (
        <ManageShiftsModal
          shifts={shifts}
          onClose={() => setManageShiftsOpen(false)}
          onChanged={() => {
            refetchShifts()
            queryClient.invalidateQueries({ queryKey: ["shifts"] })
          }}
        />
      )}

      {manageDepartmentsOpen && (
        <ManageDepartmentsModal
          departments={departments}
          onClose={() => setManageDepartmentsOpen(false)}
          onChanged={() => {
            refetchDepartments()
            queryClient.invalidateQueries({ queryKey: ["departments"] })
          }}
        />
      )}
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
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
  staffCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  staffInfo: { flex: 1, gap: spacing[1] },
  staffMetaRow: { flexDirection: "row", flexWrap: "wrap" },
  editBtn: { padding: spacing[2] },

  shiftEditorCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    padding: spacing[3],
  },
  deptRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  deptPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  shiftField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radii.lg,
    height: 48,
    paddingHorizontal: spacing[3],
  },
  shiftOptions: {
    borderWidth: 1,
    borderRadius: radii.lg,
    marginTop: spacing[2],
    maxHeight: 220,
    overflow: "hidden",
  },
  shiftOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
})
