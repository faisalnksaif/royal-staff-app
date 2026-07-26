import { toTitleCase } from "../../utils/helpers"
import { useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native"
import { useRouter } from "expo-router"
import { Camera as CameraIcon, CheckCircle, XCircle, X, UserPlus } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import StaffAvatar from "../../components/shared/StaffAvatar"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import FaceCamera from "../../components/shared/FaceCamera"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { useAttendance } from "../../hooks/useAttendance"
import { useAttendanceSummary } from "../../hooks/useAttendanceSummary"
import { useRole } from "../../hooks/useRole"
import { attendanceService } from "../../services/attendanceService"
import type { AttendanceRecord, AttendanceScanResponse, AttendanceSummaryResponse } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────


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

// ─── ExtendedSummary ─────────────────────────────────────────────────────────────

function ExtendedSummary({ summary, isLoading }: { summary?: AttendanceSummaryResponse; isLoading: boolean }) {
  const { colors } = useTheme()
  if (isLoading) {
    return (
      <View style={{ padding: spacing[4] }}>
        <ActivityIndicator color={colors.accent} size="small" />
      </View>
    )
  }
  if (!summary) {
    return null
  }

  // Format numbers
  const formatNumber = (value: number | undefined) => {
    if (value === undefined) return '-'
    return value.toString()
  }
  const formatHours = (value: number | undefined) => {
    if (value === undefined) return '-'
    return `${value.toFixed(1)}h`
  }
  const formatRate = (value: number | undefined) => {
    if (value === undefined) return '-'
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <View style={styles.extendedSummaryContainer}>
      <View style={styles.extendedSummaryRow}>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatNumber(summary.totalStaff)}</AppText>
          <AppText variant="caption" color="tertiary">Total Staff</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatNumber(summary.presentCount)}</AppText>
          <AppText variant="caption" color="tertiary">Present</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatNumber(summary.absentCount)}</AppText>
          <AppText variant="caption" color="tertiary">Absent</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatNumber(summary.lateCount)}</AppText>
          <AppText variant="caption" color="tertiary">Late</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatNumber(summary.onLeaveCount)}</AppText>
          <AppText variant="caption" color="tertiary">On Leave</AppText>
        </View>
      </View>
      <View style={styles.extendedSummaryRow}>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatHours(summary.totalWorkHours)}</AppText>
          <AppText variant="caption" color="tertiary">Total Work Hrs</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatHours(summary.totalBreakTime)}</AppText>
          <AppText variant="caption" color="tertiary">Total Break</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatHours(summary.averageWorkHours)}</AppText>
          <AppText variant="caption" color="tertiary">Avg Work Hrs</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatHours(summary.averageBreakTime)}</AppText>
          <AppText variant="caption" color="tertiary">Avg Break</AppText>
        </View>
        <View style={styles.extendedSummaryItem}>
          <AppText variant="heading3">{formatRate(summary.attendanceRate)}</AppText>
          <AppText variant="caption" color="tertiary">Attendance Rate</AppText>
        </View>
      </View>
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

// ─── ScanModal ────────────────────────────────────────────────────────────────

type ScanPhase = "camera" | "scanning" | "result" | "no_match" | "error"

function ScanModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [phase, setPhase] = useState<ScanPhase>("camera")
  const [scanResult, setScanResult] = useState<AttendanceScanResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleCapture(photoUri: string) {
    setPhase("scanning")
    try {
      const res = await attendanceService.scanFace(photoUri, new Date().toISOString())
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
              {phase === "error" ? errorMsg : "No matching staff found — please try again"}
            </AppText>
            <View style={{ marginTop: spacing[8] }}>
              <AppButton label="Try Again" onPress={() => setPhase("camera")} />
            </View>
          </>
        )}
      </View>
    )
  }

  // ── Camera / scanning ─────────────────────────────────────────────────────
  return (
    <View style={[styles.modalFull, { backgroundColor: "#000" }]}>
      <View style={[styles.modalHeader, { borderBottomColor: "rgba(255,255,255,0.1)" }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="heading3" style={{ color: "#fff" }}>Scan Attendance</AppText>
        </View>
        <Pressable onPress={onClose} hitSlop={8} style={{ padding: spacing[2] }}>
          <X size={24} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>

      {phase === "scanning" ? (
        <View style={styles.scanCenter}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <View style={styles.cameraFill}>
          <FaceCamera onCapture={handleCapture} />
        </View>
      )}
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
  const { isAdmin } = useRole()

  // Redirect if not admin or manager
  if (!isAdmin) {
    router.replace("/(admin)")
    return null
  }

  const { data, isLoading, refetch, isRefetching } = useAttendance(today)
  const { data: summaryData, isLoading: summaryLoading } = useAttendanceSummary(today)

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
      <View style={{ marginVertical: spacing[4] }}>
        <SummaryBar
          present={summaryData?.presentCount ?? summary.present}
          late={summaryData?.lateCount ?? summary.late}
          absent={summaryData?.absentCount ?? summary.absent}
          isLoading={isLoading || summaryLoading}
        />
        <ExtendedSummary
          summary={summaryData}
          isLoading={summaryLoading}
        />
      </View>

      {/* List */}
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.staffId)}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <AttendanceRow record={item} />
          </AnimatedListItem>
        )}
        contentContainerStyle={{ paddingBottom: spacing[20] }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          (isLoading || summaryLoading) ? (
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
        <CameraIcon size={26} color="#fff" strokeWidth={1.75} />
      </Pressable>

      {/* Scan modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalOpen(false)}
      >
        <ScanModal
          onClose={() => setModalOpen(false)}
          onSuccess={refetch}
        />
      </Modal>
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

  // Extended Summary Styles
  extendedSummaryContainer: {
    marginVertical: spacing[2],
  },
  extendedSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  extendedSummaryItem: {
    alignItems: "center",
    marginVertical: spacing[1],
    paddingHorizontal: spacing[2],
    minWidth: 80,
  },

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
  cameraFill: {
    flex: 1,
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