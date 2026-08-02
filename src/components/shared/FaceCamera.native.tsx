import { useCallback, useEffect, useRef, useState } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { usePhotoOutput, useCameraPermission } from "react-native-vision-camera"
import { Camera as FaceDetectorCamera, type Face } from "react-native-vision-camera-face-detector"
import { Camera as CameraIcon, Zap, ZapOff, X } from "lucide-react-native"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import { spacing } from "../../constants/theme"

export type FaceTargetPose = "straight" | "left" | "right"

interface FaceCameraProps {
  onCapture: (photoUri: string) => void
  onClose?: () => void
  isBusy?: boolean
  targetPose?: FaceTargetPose
}

// A face must be detected, roughly centered/frontal, well lit, and held
// still for this long before the shutter fires automatically.
const AUTO_CAPTURE_HOLD_MS = 1400
const MAX_YAW_DEG = 18
const MAX_PITCH_DEG = 18
const MIN_FACE_WIDTH_RATIO = 0.28

// Turned-pose capture must land in this yaw window — wide enough to be
// reachable, narrow enough to reject a still-mostly-frontal face.
const MIN_TURN_YAW_DEG = 15
const MAX_TURN_YAW_DEG = 45

// Below this, ML Kit's landmark detector is usually struggling with low
// light or motion blur rather than genuinely closed eyes — treat it as
// "not clear enough to capture" rather than a blink.
const MIN_EYE_OPEN_PROBABILITY = 0.4

// Face center must not drift more than this fraction of the frame between
// samples for the hold window to be considered "still".
const MAX_STILL_DRIFT_RATIO = 0.02

function isFaceClear(face: Face): boolean {
  const { leftEyeOpenProbability, rightEyeOpenProbability } = face
  if (leftEyeOpenProbability == null || rightEyeOpenProbability == null) return true
  return (
    leftEyeOpenProbability >= MIN_EYE_OPEN_PROBABILITY &&
    rightEyeOpenProbability >= MIN_EYE_OPEN_PROBABILITY
  )
}

function isFaceWellPositioned(face: Face, targetPose: FaceTargetPose): boolean {
  const faceWidthRatio = face.bounds.width / face.frameWidth
  if (faceWidthRatio < MIN_FACE_WIDTH_RATIO || Math.abs(face.pitchAngle) > MAX_PITCH_DEG) {
    return false
  }
  if (!isFaceClear(face)) return false

  if (targetPose === "straight") {
    return Math.abs(face.yawAngle) <= MAX_YAW_DEG
  }

  // Camera preview is not mirrored, so turning the head left yields a
  // negative yaw and turning right yields a positive yaw.
  const yaw = targetPose === "left" ? -face.yawAngle : face.yawAngle
  return yaw >= MIN_TURN_YAW_DEG && yaw <= MAX_TURN_YAW_DEG
}

interface FacePoint { x: number; y: number }

function facePoint(face: Face): FacePoint {
  return { x: face.bounds.x + face.bounds.width / 2, y: face.bounds.y + face.bounds.height / 2 }
}

function isStill(prev: FacePoint, curr: FacePoint, frameWidth: number): boolean {
  const dx = Math.abs(curr.x - prev.x) / frameWidth
  const dy = Math.abs(curr.y - prev.y) / frameWidth
  return dx <= MAX_STILL_DRIFT_RATIO && dy <= MAX_STILL_DRIFT_RATIO
}

export default function FaceCamera({ onCapture, onClose, isBusy, targetPose = "straight" }: FaceCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission()
  const photoOutput = usePhotoOutput({ quality: 0.6 })
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const capturingRef = useRef(false)
  const lastPointRef = useRef<FacePoint | null>(null)
  const [faceLocked, setFaceLocked] = useState(false)
  const [needsBetterLight, setNeedsBetterLight] = useState(false)
  const [captureError, setCaptureError] = useState("")
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true)
  const autoCaptureEnabledRef = useRef(autoCaptureEnabled)
  autoCaptureEnabledRef.current = autoCaptureEnabled
  const [shutterPressed, setShutterPressed] = useState(false)

  function resetHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    lastPointRef.current = null
    setFaceLocked(false)
    setNeedsBetterLight(false)
  }

  useEffect(() => {
    resetHold()
  }, [targetPose])

  function toggleAutoCapture() {
    setAutoCaptureEnabled((prev) => {
      const next = !prev
      if (!next && holdTimer.current) {
        clearTimeout(holdTimer.current)
        holdTimer.current = null
      }
      return next
    })
  }

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current)
    }
  }, [])

  const handleCapture = useCallback(async () => {
    if (capturingRef.current || isBusy) return
    capturingRef.current = true
    setCaptureError("")
    try {
      const file = await photoOutput.capturePhotoToFile({}, {})
      onCapture(file.filePath.startsWith("file://") ? file.filePath : `file://${file.filePath}`)
    } catch {
      setCaptureError("Couldn't capture photo — try again")
      capturingRef.current = false
    }
  }, [isBusy, onCapture, photoOutput])

  const handleFacesDetected = useCallback((faces: Face[]) => {
    if (capturingRef.current || isBusy) return

    const face = faces[0]
    const wellPositioned = faces.length === 1 && face && isFaceWellPositioned(face, targetPose)

    if (!wellPositioned) {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current)
        holdTimer.current = null
      }
      lastPointRef.current = null
      setFaceLocked(false)
      setNeedsBetterLight(faces.length === 1 && !!face && !isFaceClear(face))
      return
    }

    setNeedsBetterLight(false)

    const point = facePoint(face)
    const prevPoint = lastPointRef.current
    lastPointRef.current = point

    const stillSincePrevFrame = !prevPoint || isStill(prevPoint, point, face.frameWidth)

    if (!stillSincePrevFrame) {
      // Movement detected — restart the hold window.
      if (holdTimer.current) {
        clearTimeout(holdTimer.current)
        holdTimer.current = null
      }
      setFaceLocked(false)
      return
    }

    setFaceLocked(true)

    if (!holdTimer.current && autoCaptureEnabledRef.current) {
      holdTimer.current = setTimeout(() => {
        holdTimer.current = null
        handleCapture()
      }, AUTO_CAPTURE_HOLD_MS)
    }
  }, [handleCapture, isBusy, targetPose])

  if (!hasPermission) {
    return (
      <View style={[styles.fill, styles.centerContent]}>
        <CameraIcon size={48} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
        <AppText variant="body" style={{ color: "#fff", marginTop: spacing[4], textAlign: "center" }}>
          Camera access is needed to capture a photo
        </AppText>
        <View style={{ marginTop: spacing[6] }}>
          <AppButton label="Grant Permission" onPress={requestPermission} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.fill}>
      <FaceDetectorCamera
        style={StyleSheet.absoluteFill}
        isActive
        cameraFacing="front"
        device="front"
        outputs={[photoOutput]}
        performanceMode="fast"
        resizeMode="cover"
        onFacesDetected={handleFacesDetected}
        onError={() => setCaptureError("Camera error — try again")}
      />
      <View style={styles.shutterRow}>
        <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)", marginBottom: spacing[3] }}>
          {faceLocked
            ? autoCaptureEnabled ? "Hold still…" : "Ready — tap to capture"
            : needsBetterLight
              ? "Move to better lighting"
              : targetPose === "straight"
                ? "Position your face in the frame"
                : `Turn your head to the ${targetPose}`}
        </AppText>
        {captureError ? (
          <AppText variant="caption" style={{ color: "rgba(255,120,120,0.9)", marginBottom: spacing[3] }}>
            {captureError}
          </AppText>
        ) : null}
        <View style={styles.shutterButtonRow}>
          <Pressable onPress={toggleAutoCapture} hitSlop={8} style={styles.autoToggle}>
            {autoCaptureEnabled ? (
              <Zap size={16} color="#fff" strokeWidth={2} />
            ) : (
              <ZapOff size={16} color="rgba(255,255,255,0.6)" strokeWidth={2} />
            )}
            <AppText variant="caption" style={{ color: autoCaptureEnabled ? "#fff" : "rgba(255,255,255,0.6)" }}>
              Auto {autoCaptureEnabled ? "On" : "Off"}
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleCapture}
            onPressIn={() => setShutterPressed(true)}
            onPressOut={() => setShutterPressed(false)}
            disabled={isBusy || !faceLocked}
            style={[
              styles.shutterBtn,
              { opacity: shutterPressed || isBusy || !faceLocked ? 0.4 : 1 },
            ]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          {onClose ? (
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeToggle}>
              <X size={20} color="#fff" strokeWidth={2} />
            </Pressable>
          ) : (
            <View style={styles.autoToggleSpacer} />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  shutterRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: spacing[5],
    paddingBottom: spacing[10],
    backgroundColor: "#000",
  },
  shutterButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
  },
  autoToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  autoToggleSpacer: {
    width: 76,
    opacity: 0,
  },
  closeToggle: {
    width: 76,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
})
