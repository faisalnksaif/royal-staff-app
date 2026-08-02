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
import { Pencil, ChevronDown, Check, Plus, MapPin } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import Popup from "../../components/shared/Popup"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { useScanningDevices } from "../../hooks/useScanningDevices"
import { useDepartments } from "../../hooks/useDepartments"
import { useRole } from "../../hooks/useRole"
import { scanningDeviceService } from "../../services/scanningDeviceService"
import { useQueryClient } from "@tanstack/react-query"
import type { ScanningDeviceResponse, DepartmentResponse } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function departmentNameFor(
  device: ScanningDeviceResponse,
  departments: DepartmentResponse[]
): string {
  if (typeof device.departmentId === "string") {
    return departments.find((d) => d._id === device.departmentId)?.name ?? "Unknown department"
  }
  return device.departmentId?.name ?? "Unknown department"
}

function departmentIdFor(device: ScanningDeviceResponse): string {
  return typeof device.departmentId === "string" ? device.departmentId : device.departmentId?._id ?? ""
}

// ─── DeviceRow ────────────────────────────────────────────────────────────────

function DeviceRow({
  device, departmentName, onEdit,
}: {
  device: ScanningDeviceResponse
  departmentName: string
  onEdit: () => void
}) {
  const { colors } = useTheme()
  return (
    <AppCard elevation="sm" style={styles.deviceCard}>
      <View style={[styles.deviceAvatar, { backgroundColor: device.isActive ? colors.accentSubtle : palette.error.light }]}>
        <MapPin size={20} color={device.isActive ? colors.accent : palette.error.default} strokeWidth={1.75} />
      </View>
      <View style={styles.deviceInfo}>
        <AppText variant="bodyMedium">{device.name || device.email}</AppText>
        <AppText variant="caption" color="tertiary" numberOfLines={1}>{device.email}</AppText>
        <View style={styles.deviceMetaRow}>
          <AppText variant="caption" color="secondary">{departmentName}</AppText>
          <AppText variant="caption" color="tertiary">
            {"  ·  "}{device.isActive ? "Active" : "Inactive"}
          </AppText>
        </View>
      </View>
      <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
        <Pencil size={18} color={colors.text.tertiary} strokeWidth={1.75} />
      </Pressable>
    </AppCard>
  )
}

// ─── DepartmentPicker ───────────────────────────────────────────────────────

function DepartmentPicker({
  departments, departmentId, onChange,
}: {
  departments: DepartmentResponse[]
  departmentId: string
  onChange: (id: string) => void
}) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const selected = departments.find((d) => d._id === departmentId) ?? null

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>Department</AppText>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.shiftField, { borderColor: colors.border as string }]}
      >
        <AppText variant="body">{selected ? selected.name : "Select department"}</AppText>
        <ChevronDown
          size={18}
          color={colors.text.tertiary}
          strokeWidth={2}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {open && (
        <View style={[styles.shiftOptions, { borderColor: colors.border as string }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {departments.map((dept) => (
              <Pressable
                key={dept._id}
                onPress={() => { onChange(dept._id); setOpen(false) }}
                style={styles.shiftOption}
              >
                <AppText variant="body">{dept.name}</AppText>
                {departmentId === dept._id && <Check size={16} color={colors.accent} strokeWidth={2} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

// ─── EditDeviceModal ────────────────────────────────────────────────────────

function EditDeviceModal({
  device, departments, onClose, onSaved,
}: {
  device: ScanningDeviceResponse
  departments: DepartmentResponse[]
  onClose: () => void
  onSaved: () => void
}) {
  const { colors } = useTheme()
  const [name, setName] = useState(device.name ?? "")
  const [departmentId, setDepartmentId] = useState(departmentIdFor(device))
  const [lat, setLat] = useState(String(device.location?.lat ?? ""))
  const [lng, setLng] = useState(String(device.location?.lng ?? ""))
  const [radiusMeters, setRadiusMeters] = useState(String(device.location?.radiusMeters ?? ""))
  const [isActive, setIsActive] = useState(device.isActive)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    const latNum = Number(lat)
    const lngNum = Number(lng)
    const radiusNum = Number(radiusMeters)
    if (lat && Number.isNaN(latNum)) return setError("Latitude must be a number")
    if (lng && Number.isNaN(lngNum)) return setError("Longitude must be a number")
    if (radiusMeters && Number.isNaN(radiusNum)) return setError("Radius must be a number")

    setIsSaving(true)
    setError("")
    try {
      await scanningDeviceService.updateScanningDevice(device.id, {
        name: name.trim() || undefined,
        departmentId: departmentId || undefined,
        lat: lat ? latNum : undefined,
        lng: lng ? lngNum : undefined,
        radiusMeters: radiusMeters ? radiusNum : undefined,
        isActive,
      })
      onSaved()
      onClose()
    } catch (e) {
      setError((e as Error).message ?? "Failed to update device")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popup title={device.name || device.email} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppInput
          label="Name"
          placeholder="Device name"
          value={name}
          onChangeText={setName}
          style={{ marginBottom: spacing[4] }}
        />

        <DepartmentPicker departments={departments} departmentId={departmentId} onChange={setDepartmentId} />

        <AppText variant="label" color="secondary" style={{ marginBottom: spacing[2] }}>Location</AppText>
        <View style={[styles.locationSection, { borderColor: colors.border as string }]}>
          <View style={{ flexDirection: "row", gap: spacing[3] }}>
            <AppInput
              label="Latitude"
              placeholder="11.2588"
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <AppInput
              label="Longitude"
              placeholder="75.7804"
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </View>
          <AppInput
            label="Radius (meters)"
            placeholder="100"
            value={radiusMeters}
            onChangeText={setRadiusMeters}
            keyboardType="numeric"
            style={{ marginTop: spacing[3] }}
          />
        </View>

        <Pressable
          onPress={() => setIsActive((v) => !v)}
          style={[styles.activeToggle, { borderColor: colors.border as string, marginTop: spacing[4] }]}
        >
          <AppText variant="body">Active</AppText>
          <View style={[styles.checkbox, { borderColor: colors.border as string }, isActive && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
            {isActive && <Check size={14} color="#fff" strokeWidth={3} />}
          </View>
        </Pressable>

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[3] }}>
            {error}
          </AppText>
        ) : null}

        <View style={{ marginTop: spacing[5] }}>
          <AppButton label={isSaving ? "Saving…" : "Save Changes"} onPress={handleSave} disabled={isSaving} />
        </View>
        <View style={{ height: spacing[4] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── NewDeviceModal ─────────────────────────────────────────────────────────

function NewDeviceModal({
  departments, onClose, onCreated,
}: {
  departments: DepartmentResponse[]
  onClose: () => void
  onCreated: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [departmentId, setDepartmentId] = useState(departments[0]?._id ?? "")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [radiusMeters, setRadiusMeters] = useState("100")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleCreate() {
    if (!email.trim()) return setError("Email is required")
    if (!password.trim()) return setError("Password is required")
    if (!departmentId) return setError("Department is required")
    const latNum = Number(lat)
    const lngNum = Number(lng)
    const radiusNum = Number(radiusMeters)
    if (!lat || Number.isNaN(latNum)) return setError("Latitude is required")
    if (!lng || Number.isNaN(lngNum)) return setError("Longitude is required")
    if (!radiusMeters || Number.isNaN(radiusNum)) return setError("Radius is required")

    setIsSaving(true)
    setError("")
    try {
      await scanningDeviceService.createScanningDevice({
        email: email.trim(),
        password,
        departmentId,
        lat: latNum,
        lng: lngNum,
        radiusMeters: radiusNum,
        name: name.trim() || undefined,
      })
      onCreated()
      onClose()
    } catch (e) {
      setError((e as Error).message ?? "Failed to create device")
    } finally {
      setIsSaving(false)
    }
  }

  const { colors } = useTheme()

  return (
    <Popup title="New Scanning Device" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppInput
          label="Email"
          placeholder="scan-kitchen@rowbest.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: spacing[4] }}
        />

        <AppInput
          label="Password"
          placeholder="Login password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ marginBottom: spacing[4] }}
        />

        <AppInput
          label="Name (optional)"
          placeholder="Kitchen scanner"
          value={name}
          onChangeText={setName}
          style={{ marginBottom: spacing[4] }}
        />

        <DepartmentPicker departments={departments} departmentId={departmentId} onChange={setDepartmentId} />

        <AppText variant="label" color="secondary" style={{ marginBottom: spacing[2] }}>Location</AppText>
        <View style={[styles.locationSection, { borderColor: colors.border as string }]}>
          <View style={{ flexDirection: "row", gap: spacing[3] }}>
            <AppInput
              label="Latitude"
              placeholder="11.2588"
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <AppInput
              label="Longitude"
              placeholder="75.7804"
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </View>
          <AppInput
            label="Radius (meters)"
            placeholder="100"
            value={radiusMeters}
            onChangeText={setRadiusMeters}
            keyboardType="numeric"
            style={{ marginTop: spacing[3] }}
          />
        </View>

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[3], marginBottom: spacing[3] }}>
            {error}
          </AppText>
        ) : null}

        <View style={{ marginTop: spacing[5] }}>
          <AppButton label={isSaving ? "Creating…" : "Create Device"} onPress={handleCreate} disabled={isSaving} />
        </View>
        <View style={{ height: spacing[4] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── ScanningDevicesScreen ──────────────────────────────────────────────────

export default function ScanningDevicesScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const { isSuperAdmin } = useRole()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editTarget, setEditTarget] = useState<ScanningDeviceResponse | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: devicesData, isLoading, refetch, isRefetching } = useScanningDevices()
  const { data: departmentsData } = useDepartments()
  const devices = devicesData?.data ?? []
  const departments = departmentsData?.data ?? []

  function onChanged() {
    refetch()
    queryClient.invalidateQueries({ queryKey: ["scanning-devices"] })
  }

  useEffect(() => {
    if (!isSuperAdmin) router.replace("/(admin)")
  }, [isSuperAdmin])

  if (!isSuperAdmin) return null

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Scanning Devices</AppText>
          <AppText variant="caption" color="tertiary">Department attendance scanners</AppText>
        </View>
        <Pressable onPress={() => setCreateOpen(true)} hitSlop={8} style={styles.editBtn}>
          <Plus size={20} color={colors.text.tertiary} strokeWidth={1.75} />
        </Pressable>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <DeviceRow
              device={item}
              departmentName={departmentNameFor(item, departments)}
              onEdit={() => setEditTarget(item)}
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
              <AppText color="tertiary">No scanning devices found</AppText>
            </View>
          )
        }
      />

      {editTarget && (
        <EditDeviceModal
          device={editTarget}
          departments={departments}
          onClose={() => setEditTarget(null)}
          onSaved={onChanged}
        />
      )}

      {createOpen && (
        <NewDeviceModal
          departments={departments}
          onClose={() => setCreateOpen(false)}
          onCreated={onChanged}
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
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  deviceAvatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceInfo: { flex: 1, gap: spacing[1] },
  deviceMetaRow: { flexDirection: "row", flexWrap: "wrap" },
  editBtn: { padding: spacing[2] },

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
  locationSection: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
})
