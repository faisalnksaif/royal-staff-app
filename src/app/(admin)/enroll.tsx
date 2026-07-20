import { useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { X, CheckCircle, UserCheck, Fingerprint } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import FingerprintScanner from "../../components/shared/FingerprintScanner"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { attendanceService } from "../../services/attendanceService"
import { useFingerprint } from "../../hooks/useFingerprint"
import type { StaffResponse } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const MIN_SCANS = 3

// ─── StaffCard ────────────────────────────────────────────────────────────────

function StaffCard({ staff, onSelect }: { staff: StaffResponse; onSelect: () => void }) {
  const { colors } = useTheme()
  return (
    <Pressable onPress={onSelect}>
      {({ pressed }) => (
        <AppCard elevation="sm" style={[styles.staffCard, { opacity: pressed ? 0.7 : 1 }]}>
          <View style={[styles.staffAvatar, { backgroundColor: colors.accentSubtle }]}>
            <AppText variant="bodyMedium" style={{ color: colors.accent }}>
              {staff.name.slice(0, 2).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.staffInfo}>
            <AppText variant="bodyMedium">{toTitleCase(staff.name)}</AppText>
            <AppText variant="caption" color="secondary">ID: {staff.id}</AppText>
          </View>
          <UserCheck size={18} color={colors.text.tertiary} strokeWidth={1.5} />
        </AppCard>
      )}
    </Pressable>
  )
}

// ─── EnrollFingerprint ────────────────────────────────────────────────────────

function EnrollFingerprint({
  staff,
  onClose,
  onDone,
}: {
  staff: StaffResponse
  onClose: () => void
  onDone: (count: number) => void
}) {
  const { readTemplate } = useFingerprint()
  const [scanCount, setScanCount] = useState(0)
  const [readyForAttendance, setReadyForAttendance] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastError, setLastError] = useState("")

  async function handleScan() {
    if (isScanning) return
    setLastError("")
    setIsScanning(true)
    try {
      const template = await readTemplate()
      const res = await attendanceService.enrollFingerprint(staff.id, template)
      setScanCount(res.enrollmentCount)
      setReadyForAttendance(res.readyForAttendance)
    } catch (e) {
      setLastError((e as Error).message ?? "Scan failed")
    } finally {
      setIsScanning(false)
    }
  }

  const canFinish = scanCount >= MIN_SCANS

  return (
    <View style={[styles.modalFull, { backgroundColor: "#000" }]}>
      {/* Top bar */}
      <View style={styles.modalTopBar}>
        <Pressable onPress={onClose} hitSlop={8} style={{ padding: spacing[2] }}>
          <X size={24} color="#fff" strokeWidth={2} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <AppText variant="bodyMedium" style={{ color: "#fff" }}>
            {toTitleCase(staff.name)}
          </AppText>
          <AppText variant="caption" style={{ color: "rgba(255,255,255,0.6)" }}>
            {scanCount < MIN_SCANS
              ? `${scanCount} / ${MIN_SCANS} scans minimum`
              : `${scanCount} scans captured ✓`}
          </AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Scanner */}
      <View style={styles.scanCenter}>
        <FingerprintScanner isScanning={isScanning} />
        {lastError ? (
          <AppText
            variant="caption"
            style={{ color: palette.error.default, marginTop: spacing[3], textAlign: "center" }}
          >
            {lastError}
          </AppText>
        ) : null}
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: Math.max(scanCount, MIN_SCANS) }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < scanCount
                    ? readyForAttendance
                      ? palette.success.default
                      : palette.warning.default
                    : "rgba(255,255,255,0.25)",
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom bar */}
      <View style={styles.modalBottom}>
        {isScanning ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Pressable onPress={handleScan} style={styles.scanBtn}>
            <Fingerprint size={28} color="#fff" strokeWidth={1.5} />
            <AppText variant="bodyMedium" style={{ color: "#fff" }}>Scan Fingerprint</AppText>
          </Pressable>
        )}

        {canFinish && !isScanning && (
          <Pressable
            onPress={() => onDone(scanCount)}
            style={[styles.finishBtn, { backgroundColor: palette.success.default }]}
          >
            <AppText variant="bodyMedium" style={{ color: "#fff" }}>Finish</AppText>
          </Pressable>
        )}
      </View>
    </View>
  )
}

// ─── EnrollDone ───────────────────────────────────────────────────────────────

function EnrollDone({
  staffName,
  scanCount,
  onClose,
}: {
  staffName: string
  scanCount: number
  onClose: () => void
}) {
  return (
    <View style={[styles.modalFull, styles.centerContent, { backgroundColor: "#000" }]}>
      <CheckCircle size={80} color={palette.success.default} strokeWidth={1.5} />
      <AppText
        variant="heading2"
        style={{ color: "#fff", marginTop: spacing[5], textAlign: "center" }}
      >
        {toTitleCase(staffName)}
      </AppText>
      <AppText
        variant="body"
        style={{ color: palette.success.default, marginTop: spacing[2] }}
      >
        Enrolled successfully
      </AppText>
      <AppText
        variant="caption"
        style={{ color: "rgba(255,255,255,0.45)", marginTop: spacing[2] }}
      >
        {scanCount} fingerprint scan{scanCount !== 1 ? "s" : ""} captured
      </AppText>
      <View style={{ marginTop: spacing[8] }}>
        <AppButton label="Done" onPress={onClose} />
      </View>
    </View>
  )
}

// ─── EnrollScreen ─────────────────────────────────────────────────────────────

export default function EnrollScreen() {
  const { colors } = useTheme()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [doneCount, setDoneCount] = useState<number | null>(null)

  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const filtered = (staffData?.data ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelectStaff(staff: StaffResponse) {
    setSelectedStaff(staff)
    setDoneCount(null)
    setEnrollOpen(true)
  }

  function handleEnrollDone(count: number) {
    setDoneCount(count)
    setEnrollOpen(false)
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <View>
          <AppText variant="heading3">Fingerprint Enrollment</AppText>
          <AppText variant="caption" color="tertiary">Select staff to enroll</AppText>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <AppInput
          placeholder="Search staff name..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Staff list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <StaffCard staff={item} onSelect={() => handleSelectStaff(item)} />
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

      {/* Enrollment modal */}
      <Modal
        visible={enrollOpen || doneCount != null}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { setEnrollOpen(false); setDoneCount(null) }}
      >
        {doneCount != null && selectedStaff ? (
          <EnrollDone
            staffName={selectedStaff.name}
            scanCount={doneCount}
            onClose={() => { setDoneCount(null); setSelectedStaff(null) }}
          />
        ) : selectedStaff ? (
          <EnrollFingerprint
            staff={selectedStaff}
            onClose={() => setEnrollOpen(false)}
            onDone={handleEnrollDone}
          />
        ) : null}
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

  // Modal
  modalFull: { flex: 1 },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  modalTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing[12],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  topBarCenter: { alignItems: "center", gap: spacing[1] },
  scanCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[2],
    paddingBottom: spacing[3],
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  modalBottom: {
    alignItems: "center",
    paddingBottom: spacing[12],
    paddingTop: spacing[4],
    gap: spacing[4],
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
  finishBtn: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
})
