import { toTitleCase } from "../../utils/helpers"
import { useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
} from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { Fingerprint, CheckCircle, XCircle, X, UserPlus, ChevronLeft } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import StaffAvatar from "../../components/shared/StaffAvatar"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import FingerprintScanner from "../../components/shared/FingerprintScanner"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { useAttendance } from "../../hooks/useAttendance"
import { useFingerprint } from "../../hooks/useFingerprint"
import { attendanceService } from "../../services/attendanceService"
import type { AttendanceRecord, AttendanceScanResponse, StaffResponse } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────


function statusColor(status: AttendanceRecord["status"]): string {
  switch (status) {
    case "present": return palette.success.default
    case "late":    return palette.warning.default
    case "absent":  return palette.neutral[500]
  }
}

const STATUS_LABEL = { present: "Present", late: "Late", absent: "Absent" }

// ─── SummaryBar ───────────────────────────────────────────────────────────────

function SummaryBar({
  present, late, absent, isLoading,
}: {
  present: number; late: number; absent: number; isLoading: boolean
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.summaryBar, { borderBottomColor: colors.border }]}>
      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        [
          { label: "Present", count: present, color: palette.success.default },
          { label: "Late",    count: late,    color: palette.warning.default },
          { label: "Absent",  count: absent,  color: palette.neutral[500] },
        ].map((item, i, arr) => (
          <View key={item.label} style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <AppText variant="heading3" style={{ color: item.color }}>{item.count}</AppText>
              <AppText variant="caption" color="tertiary">{item.label}</AppText>
            </View>
            {i < arr.length - 1 && (
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))
      )}
    </View>
  )
}

// ─── AttendanceRow ────────────────────────────────────────────────────────────

function AttendanceRow({ record }: { record: AttendanceRecord }) {
  const { colors } = useTheme()
  const color = statusColor(record.status)
  const firstSession = record.sessions?.[0]

  return (
    <View style={[styles.row, { borderBottomColor: colors.border as string }]}>
      <View style={styles.rowContent}>
        <StaffAvatar name={record.staffName} color={color} bgColor={color + "22"} />

        <View style={styles.rowInfo}>
          <AppText variant="bodyMedium">{toTitleCase(record.staffName)}</AppText>
          <View style={styles.rowMeta}>
            {firstSession?.checkIn ? (
              <AppText variant="caption" color="secondary">
                In: {moment(firstSession.checkIn).format("HH:mm")}
              </AppText>
            ) : (
              <AppText variant="caption" color="tertiary">Not checked in</AppText>
            )}
            {record.totalWorkHours != null && (
              <AppText variant="caption" color="tertiary">
                {"  ·  "}{record.totalWorkHours.toFixed(1)}h
              </AppText>
            )}
            {record.sessionCount > 1 && (
              <AppText variant="caption" color="tertiary">
                {"  ·  "}{record.sessionCount} sessions
              </AppText>
            )}
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: color + "22" }]}>
          <AppText variant="caption" style={{ color, fontSize: 11 }}>
            {STATUS_LABEL[record.status]}
          </AppText>
        </View>
      </View>
    </View>
  )
}

// ─── FingerprintModal ─────────────────────────────────────────────────────────

type ScanPhase = "pick" | "scan" | "scanning" | "result" | "no_match" | "error"

function FingerprintModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { colors } = useTheme()
  const { readTemplate } = useFingerprint()
  const [phase, setPhase] = useState<ScanPhase>("pick")
  const [search, setSearch] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null)
  const [scanResult, setScanResult] = useState<AttendanceScanResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const filtered = (staffData?.data ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleScan() {
    if (!selectedStaff) return
    setPhase("scanning")
    try {
      const template = await readTemplate()
      const res = await attendanceService.scanFingerprint(
        selectedStaff.id,
        template,
        new Date().toISOString()
      )
      setScanResult(res)
      setPhase(res.matched ? "result" : "no_match")
      if (res.matched) {
        setTimeout(() => { onSuccess(); onClose() }, 2500)
      }
    } catch (e) {
      setErrorMsg((e as Error).message ?? "Scan failed")
      setPhase("error")
    }
  }

  // ── Pick staff ───────────────────────────────────────────────────────────
  if (phase === "pick") {
    return (
      <View style={[styles.modalFull, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={8} style={{ padding: spacing[2] }}>
            <X size={24} color={colors.text.primary} strokeWidth={2} />
          </Pressable>
          <AppText variant="heading3">Select Staff</AppText>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
          <AppInput
            placeholder="Search name..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => { setSelectedStaff(item); setPhase("scan") }}
            >
              <View style={[styles.staffRow, { borderBottomColor: colors.border as string }]}>
                <StaffAvatar name={item.name} color={colors.accent} bgColor={colors.accentSubtle} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium">{toTitleCase(item.name)}</AppText>
                  <AppText variant="caption" color="secondary">ID: {item.id}</AppText>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: spacing[10] }}
          ListEmptyComponent={
            staffLoading ? (
              <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
            ) : (
              <View style={styles.center}>
                <AppText color="tertiary">No staff found</AppText>
              </View>
            )
          }
        />
      </View>
    )
  }

  // ── Result / no-match / error ────────────────────────────────────────────
  if (phase === "result" || phase === "no_match" || phase === "error") {
    const isSuccess = phase === "result"
    const staffName = scanResult?.staff?.name ? toTitleCase(scanResult.staff.name) : ""
    const actionLabel = scanResult?.action === "checkOut" ? "Checked Out" : "Checked In"
    const confidence = scanResult?.confidence != null
      ? Math.round(scanResult.confidence * 100) : null

    return (
      <View style={[styles.modalFull, styles.centerContent, { backgroundColor: "#000" }]}>
        <Pressable onPress={onClose} style={styles.overlayClose} hitSlop={8}>
          <X size={24} color="#fff" strokeWidth={2} />
        </Pressable>

        {isSuccess ? (
          <CheckCircle size={80} color={palette.success.default} strokeWidth={1.5} />
        ) : (
          <XCircle size={80} color={palette.error.default} strokeWidth={1.5} />
        )}

        <AppText
          variant="heading2"
          style={{ color: "#fff", marginTop: spacing[5], textAlign: "center" }}
        >
          {isSuccess ? staffName : "Not Recognized"}
        </AppText>

        {isSuccess && (
          <AppText variant="body" style={{ color: palette.success.default, marginTop: spacing[2] }}>
            {actionLabel}
          </AppText>
        )}

        {isSuccess && confidence != null && (
          <AppText variant="caption" style={{ color: "rgba(255,255,255,0.45)", marginTop: spacing[2] }}>
            Confidence: {confidence}%
          </AppText>
        )}

        {!isSuccess && (
          <>
            <AppText
              variant="body"
              style={{ color: "rgba(255,255,255,0.55)", marginTop: spacing[2], textAlign: "center" }}
            >
              {phase === "error" ? errorMsg : "Please try again"}
            </AppText>
            <View style={{ marginTop: spacing[8], gap: spacing[3] }}>
              <AppButton label="Try Again" onPress={() => setPhase("scan")} />
              <AppButton label="Change Staff" variant="ghost" onPress={() => setPhase("pick")} />
            </View>
          </>
        )}
      </View>
    )
  }

  // ── Scan / scanning ──────────────────────────────────────────────────────
  return (
    <View style={[styles.modalFull, { backgroundColor: "#000" }]}>
      <View style={[styles.modalHeader, { borderBottomColor: "rgba(255,255,255,0.1)" }]}>
        <Pressable onPress={() => setPhase("pick")} hitSlop={8} style={{ padding: spacing[2] }}>
          <ChevronLeft size={24} color="#fff" strokeWidth={1.75} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <AppText variant="heading3" style={{ color: "#fff" }}>
            {toTitleCase(selectedStaff?.name ?? "")}
          </AppText>
          <AppText variant="caption" style={{ color: "rgba(255,255,255,0.5)" }}>
            ID: {selectedStaff?.id}
          </AppText>
        </View>
        <Pressable onPress={onClose} hitSlop={8} style={{ padding: spacing[2] }}>
          <X size={24} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.scanCenter}>
        <FingerprintScanner isScanning={phase === "scanning"} />
      </View>

      <View style={styles.scanBottom}>
        {phase === "scanning" ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Pressable onPress={handleScan} style={styles.scanBtn}>
            <Fingerprint size={32} color="#fff" strokeWidth={1.5} />
            <AppText variant="bodyMedium" style={{ color: "#fff" }}>Scan Fingerprint</AppText>
          </Pressable>
        )}
      </View>
    </View>
  )
}

// ─── AttendanceScreen ─────────────────────────────────────────────────────────

export default function AttendanceScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const today = moment().format("YYYY-MM-DD")

  const { data, isLoading, refetch, isRefetching } = useAttendance(today)

  const summary = data?.summary ?? { present: 0, late: 0, absent: 0 }
  const records = data?.data ?? []

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Attendance</AppText>
          <AppText variant="caption" color="tertiary">{moment().format("D MMM YYYY")}</AppText>
        </View>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
        <Pressable
          onPress={() => router.push("/(admin)/enroll")}
          style={styles.enrollBtn}
          hitSlop={8}
        >
          <UserPlus size={22} color={colors.accent} strokeWidth={1.75} />
        </Pressable>
      </View>

      {/* Summary */}
      <SummaryBar
        present={summary.present}
        late={summary.late}
        absent={summary.absent}
        isLoading={isLoading}
      />

      {/* List */}
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.staffId)}
        renderItem={({ item }) => <AttendanceRow record={item} />}
        contentContainerStyle={{ paddingBottom: spacing[20] }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No attendance records for today</AppText>
            </View>
          )
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => setModalOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Fingerprint size={26} color="#fff" strokeWidth={1.75} />
      </Pressable>

      {/* Fingerprint modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalOpen(false)}
      >
        <FingerprintModal
          onClose={() => setModalOpen(false)}
          onSuccess={refetch}
        />
      </Modal>
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
  enrollBtn: { padding: spacing[2] },

  summaryBar: {
    flexDirection: "row",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-around",
    minHeight: 64,
    alignItems: "center",
  },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[4] },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 32 },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

  row: {
    borderBottomWidth: 1,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  rowInfo: { flex: 1, gap: spacing[1] },
  rowMeta: { flexDirection: "row", flexWrap: "wrap" },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },

  fab: {
    position: "absolute",
    bottom: spacing[8],
    right: spacing[6],
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  // Modal
  modalFull: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchWrap: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    gap: spacing[3],
  },

  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  overlayClose: {
    position: "absolute",
    top: spacing[12],
    right: spacing[4],
    padding: spacing[2],
  },

  scanCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBottom: {
    alignItems: "center",
    paddingBottom: spacing[12],
    paddingTop: spacing[6],
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
})
