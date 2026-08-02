import { useRef, useState } from "react"
import { View, StyleSheet, Pressable } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Camera } from "lucide-react-native"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import { spacing } from "../../constants/theme"

interface FaceCameraProps {
  onCapture: (photoUri: string) => void
  isBusy?: boolean
  targetPose?: "straight" | "left" | "right"
}

export default function FaceCamera({ onCapture, isBusy }: FaceCameraProps) {
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [captureError, setCaptureError] = useState("")

  if (!permission) {
    return <View style={styles.fill} />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.centerContent]}>
        <Camera size={48} color="rgba(255,255,255,0.6)" strokeWidth={1.5} />
        <AppText variant="body" style={{ color: "#fff", marginTop: spacing[4], textAlign: "center" }}>
          Camera access is needed to capture a photo
        </AppText>
        <View style={{ marginTop: spacing[6] }}>
          <AppButton label="Grant Permission" onPress={requestPermission} />
        </View>
      </View>
    )
  }

  async function handleCapture() {
    if (!cameraRef.current || isBusy || !isCameraReady) return
    setCaptureError("")
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false })
      if (photo?.uri) onCapture(photo.uri)
    } catch {
      setCaptureError("Couldn't capture photo — try again")
    }
  }

  const captureDisabled = isBusy || !isCameraReady

  return (
    <View style={styles.fill}>
      <CameraView
        ref={cameraRef}
        style={styles.fill}
        facing="front"
        mirror={false}
        onCameraReady={() => {
          // expo-camera's web implementation can fire onCameraReady slightly
          // before the underlying <video> element has actual frame data.
          setTimeout(() => setIsCameraReady(true), 400)
        }}
      />
      <View style={styles.shutterRow}>
        {!isCameraReady && (
          <AppText variant="caption" style={{ color: "rgba(255,255,255,0.7)", marginBottom: spacing[3] }}>
            Starting camera…
          </AppText>
        )}
        {captureError ? (
          <AppText variant="caption" style={{ color: "rgba(255,120,120,0.9)", marginBottom: spacing[3] }}>
            {captureError}
          </AppText>
        ) : null}
        <Pressable
          onPress={handleCapture}
          disabled={captureDisabled}
          style={({ pressed }) => [
            styles.shutterBtn,
            { opacity: pressed || captureDisabled ? 0.6 : 1 },
          ]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
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
    bottom: spacing[12],
    left: 0,
    right: 0,
    alignItems: "center",
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
