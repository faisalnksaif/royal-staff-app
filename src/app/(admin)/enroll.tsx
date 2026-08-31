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
import { X, CheckCircle, UserCheck, RotateCcw, ArrowLeft, ArrowRight, ScanFace, Check } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppInput from "../../components/ui/AppInput"
import AppButton from "../../components/ui/AppButton"
import FaceCamera from "../../components/shared/FaceCamera"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { attendanceService } from "../../services/attendanceService"
import type { StaffResponse, EnrollmentPose } from "../../types"

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
              {staff.photoCount ? `${staff.photoCount}/3 poses enrolled` : `ID: ${staff.id}`}
            </AppText>
          </View>
          {(staff.photoCount ?? 0) >= 3 ? (
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

const ENROLL_POSES = [
  { key: "straight", label: "Straight", instruction: "Look straight at the camera", Icon: ScanFace },
  // Camera preview is not mirrored, so turning your head left moves your
  // face toward the right of the screen — icon points the way it'll look on screen.
  { key: "left", label: "Left", instruction: "Turn your head to the left", Icon: ArrowRight },
  { key: "right", label: "Right", instruction: "Turn your head to the right", Icon: ArrowLeft },
] as const

function PoseTracker({ capturedPoses }: { capturedPoses: EnrollmentPose[] }) {
  return (
    <View style={styles.poseTracker}>
      {ENROLL_POSES.map((pose) => {
        const done = capturedPoses.includes(pose.key)
        return (
          <View key={pose.key} style={styles.poseStep}>
            <View
              style={[
                styles.poseIconWrap,
                done && { backgroundColor: palette.success.default },
              ]}
            >
              {done ? (
                <Check size={16} color="#fff" strokeWidth={2.5} />
              ) : (
                <pose.Icon size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
              )}
            </View>
            <AppText
              variant="caption"
              style={{ color: done ? "#fff" : "rgba(255,255,255,0.5)" }}
            >
              {pose.label}
            </AppText>
          </View>
        )
      })}
    </View>
  )
}

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
  const [capturedPoses, setCapturedPoses] = useState<EnrollmentPose[]>([])
  const [photoCount, setPhotoCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastError, setLastError] = useState("")

  const readyForAttendance = capturedPoses.length >= ENROLL_POSES.length
  const nextPose =
    ENROLL_POSES.find((p) => !capturedPoses.includes(p.key)) ?? ENROLL_POSES[0]

  async function handleSavePhoto() {
    if (!capturedUri) return
    setIsSubmitting(true)
    setLastError("")
    try {
      const res = await attendanceService.enrollFace(staff.id, capturedUri, nextPose.key)
      const nextCapturedPoses = capturedPoses.includes(nextPose.key)
        ? capturedPoses
        : [...capturedPoses, nextPose.key]
      setCapturedPoses(nextCapturedPoses)
      setPhotoCount(res.photoCount)
      setCapturedUri(null)
      if (nextCapturedPoses.length >= ENROLL_POSES.length && res.readyForAttendance) {
        onDone(res.photoCount)
      }
    } catch (e) {
      setLastError((e as Error).message ?? "Enrollment failed — try again")
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
            {capturedUri
              ? "Photo captured"
              : !readyForAttendance
                ? nextPose.instruction
                : `${photoCount} photos saved — add more or finish`}
          </AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <PoseTracker capturedPoses={capturedPoses} />

      {/* Camera or preview */}
      {capturedUri ? (
        <View style={styles.scanCenter}>
          <Image source={{ uri: capturedUri }} style={styles.preview} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.cameraFill}>
          <View style={styles.poseHintWrap} pointerEvents="none">
            <nextPose.Icon size={28} color="#fff" strokeWidth={2} />
            <AppText variant="bodyMedium" style={{ color: "#fff" }}>
              {nextPose.instruction}
            </AppText>
          </View>
          <FaceCamera
            targetPose={nextPose.key}
            onCapture={(uri) => { setLastError(""); setCapturedUri(uri) }}
            onClose={onClose}
          />
        </View>
      )}

      {/* Bottom bar */}
      {capturedUri ? (
        <View style={styles.modalBottom}>
          {isSubmitting ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Pressable
                onPress={() => { setCapturedUri(null); setLastError("") }}
                style={styles.scanBtn}
              >
                <RotateCcw size={22} color="#fff" strokeWidth={1.5} />
                <AppText variant="bodyMedium" style={{ color: "#fff" }}>Retake</AppText>
              </Pressable>
              <Pressable
                onPress={handleSavePhoto}
                style={[styles.finishBtn, { backgroundColor: palette.success.default }]}
              >
                <AppText variant="bodyMedium" style={{ color: "#fff" }}>Save Photo</AppText>
              </Pressable>
            </>
          )}
        </View>
      ) : readyForAttendance ? (
        <View style={styles.modalBottom}>
          <Pressable
            onPress={() => onDone(photoCount)}
            style={[styles.finishBtn, { backgroundColor: palette.success.default }]}
          >
            <AppText variant="bodyMedium" style={{ color: "#fff" }}>Finish</AppText>
          </Pressable>
        </View>
      ) : null}

      {/* Error banner — rendered last so it always stacks above the native camera surface */}
      {lastError ? (
        <View style={styles.errorBanner} pointerEvents="none">
          <AppText variant="bodyMedium" style={{ color: "#fff", textAlign: "center" }}>
            {lastError}
          </AppText>
        </View>
      ) : null}
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
          <AppText variant="caption" color="tertiary">Select staff to capture reference photos</AppText>
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
  poseTracker: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[8],
    paddingBottom: spacing[4],
  },
  poseStep: {
    alignItems: "center",
    gap: spacing[1],
  },
  poseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    position: "absolute",
    top: spacing[20],
    left: spacing[4],
    right: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: palette.error.default,
    zIndex: 10,
    elevation: 10,
  },
  poseHintWrap: {
    position: "absolute",
    top: spacing[6],
    left: 0,
    right: 0,
    alignItems: "center",
    gap: spacing[2],
    zIndex: 1,
  },
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
