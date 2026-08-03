import { useState, useEffect, useRef } from "react"
import { View, ActivityIndicator, StyleSheet, Pressable, Animated, Easing } from "react-native"
import { useAudioPlayer } from "expo-audio"
import * as Haptics from "expo-haptics"
import * as Location from "expo-location"
import { CheckCircle, XCircle, X, AlertTriangle } from "lucide-react-native"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import FaceCamera from "./FaceCamera"
import { colors as palette, spacing } from "../../constants/theme"
import { attendanceService } from "../../services/attendanceService"
import { toTitleCase } from "../../utils/helpers"
import type { AppError, AttendanceScanResponse } from "../../types"

type ScanPhase = "camera" | "scanning" | "result" | "no_match" | "rejected" | "error"

function SuccessCheckmark() {
  const scale = useRef(new Animated.Value(0)).current
  const ringScale = useRef(new Animated.Value(0.4)).current
  const ringOpacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start()
    Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 1.6,
        duration: 550,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View style={styles.checkmarkWrap}>
      <Animated.View
        style={[
          styles.checkmarkRing,
          { borderColor: palette.success.default, transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <CheckCircle size={80} color={palette.success.default} strokeWidth={1.5} />
      </Animated.View>
    </View>
  )
}

export default function AttendanceScanModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [phase, setPhase] = useState<ScanPhase>("camera")
  const [scanResult, setScanResult] = useState<AttendanceScanResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const successPlayer = useAudioPlayer(require("../../../assets/sounds/success.mp3"))

  async function handleCapture(photoUri: string) {
    setPhase("scanning")
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      setErrorMsg("Location permission is required to scan attendance")
      setPhase("error")
      return
    }

    let lat: number
    let lng: number
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      lat = position.coords.latitude
      lng = position.coords.longitude
    } catch {
      setErrorMsg("Couldn't get your location — try again")
      setPhase("error")
      return
    }

    const capturedAt = new Date().toISOString()
    try {
      const res = await attendanceService.scanFace(photoUri, capturedAt, lat, lng)
      setScanResult(res)
      if (res.matched && res.success) {
        setPhase("result")
        successPlayer.seekTo(0)
        successPlayer.play()
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setTimeout(() => { onSuccess(); onClose() }, 2500)
      } else if (res.matched && !res.success) {
        setPhase("rejected")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      } else {
        setPhase("no_match")
      }
    } catch (e) {
      const appError = e as AppError
      setErrorMsg(appError.message ?? "Scan failed")
      setPhase("error")
    }
  }

  // ── Result / no-match / rejected / error ─────────────────────────────────
  if (phase === "result" || phase === "no_match" || phase === "rejected" || phase === "error") {
    const isSuccess = phase === "result"
    const isRejected = phase === "rejected"
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
          <SuccessCheckmark />
        ) : isRejected ? (
          <AlertTriangle size={80} color={palette.warning.default} strokeWidth={1.5} />
        ) : (
          <XCircle size={80} color={palette.error.default} strokeWidth={1.5} />
        )}

        <AppText
          variant="heading2"
          style={{ color: "#fff", marginTop: spacing[5], textAlign: "center" }}
        >
          {isSuccess || isRejected ? staffName : "Not Recognized"}
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
              {phase === "error"
                ? errorMsg
                : isRejected
                  ? (scanResult?.error ?? "Scan rejected — please try again")
                  : "No matching staff found — please try again"}
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
          <FaceCamera onCapture={handleCapture} onClose={onClose} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
  checkmarkWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 96,
    height: 96,
  },
  checkmarkRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
})
