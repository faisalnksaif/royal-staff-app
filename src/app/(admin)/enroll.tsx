import { toTitleCase } from "../../utils/helpers"
import { useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
  Image,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { X, CheckCircle, UserCheck, RotateCcw } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import FaceCamera from "../../components/shared/FaceCamera"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { attendanceService } from "../../services/attendanceService"
import type { StaffResponse } from "../../types"

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
            <AppText variant="caption" color="secondary">
              {staff.hasPhoto ? "Photo enrolled" : `ID: ${staff.id}`}
            </AppText>
          </View>
          {staff.hasPhoto ? (
            <CheckCircle size={18} color={palette.success.default} strokeWidth={1.5} />
          ) : (
            <UserCheck size={18} color={colors.text.tertiary} strokeWidth={1.5} />
          )}
        </AppCard>
      )}
    </Pressable>
  )
}

// ─── EnrollFace ───────────────────────────────────────────────────────────────

function EnrollFace({
  staff,
  onClose,
  onDone,
}: {
  staff: StaffResponse
  onClose: () => void
  onDone: (photoCount: number) => void
}) {
  const [capturedUri, setCapturedUri] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastError, setLastError] = useState("")

  async function handleSubmit() {
    if (!capturedUri) return
    setIsSubmitting(true)
    setLastError("")
    try {
      const res = await attendanceService.enrollFace(staff.id, capturedUri)
      onDone(res.photoCount)
    } catch (e) {
      setLastError((e as Error).message ?? "Enrollment failed")
    } finally {
      setIsSubmitting(false)
    }
  }

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
            {capturedUri ? "Photo captured" : "Capture reference photo"}
          </AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera or preview */}
      {capturedUri ? (
        <View style={styles.scanCenter}>
          <Image source={{ uri: capturedUri }} style={styles.preview} resizeMode="cover" />
          {lastError ? (
            <AppText
              variant="caption"
              style={{ color: palette.error.default, marginTop: spacing[3], textAlign: "center" }}
            >
              {lastError}
            </AppText>
          ) : null}
        </View>
      ) : (
        <View style={styles.cameraFill}>
          <FaceCamera onCapture={setCapturedUri} />
        </View>
      )}

      {/* Bottom bar */}
      {capturedUri && (
        <View style={styles.modalBottom}>
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Pressable onPress={() => setCapturedUri(null)} style={styles.scanBtn}>
                <RotateCcw size={22} color="#fff" strokeWidth={1.5} />
                <AppText variant="bodyMedium" style={{ color: "#fff" }}>Retake</AppText>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                style={[styles.finishBtn, { backgroundColor: palette.success.default }]}
              >
                <AppText variant="bodyMedium" style={{ color: "#fff" }}>Save Photo</AppText>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  )
}

// ─── EnrollDone ───────────────────────────────────────────────────────────────

function EnrollDone({
  staffName,
  onClose,
}: {
  staffName: string
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
        Photo enrolled successfully
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

  const [search, setSearch] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [done, setDone] = useState(false)

  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ["staff"],
    queryFn: () => attendanceService.getStaff(),
  })

  const filtered = (staffData?.data ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelectStaff(staff: StaffResponse) {
    setSelectedStaff(staff)
    setDone(false)
    setEnrollOpen(true)
  }

  function handleEnrollDone() {
    setDone(true)
    setEnrollOpen(false)
    refetch()
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <View>
          <AppText variant="heading3">Add / Update Photo</AppText>
          <AppText variant="caption" color="tertiary">Select staff to capture a reference photo</AppText>
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
        visible={enrollOpen || done}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { setEnrollOpen(false); setDone(false) }}
      >
        {done && selectedStaff ? (
          <EnrollDone
            staffName={selectedStaff.name}
            onClose={() => { setDone(false); setSelectedStaff(null) }}
          />
        ) : selectedStaff ? (
          <EnrollFace
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
  preview: {
    alignSelf: "stretch",
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
  },
  cameraFill: {
    flex: 1,
  },
  modalBottom: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: spacing[12],
    paddingTop: spacing[4],
    gap: spacing[4],
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  finishBtn: {
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
})
