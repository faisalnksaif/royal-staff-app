import { useState } from "react"
import { View } from "react-native"
import Popup from "./Popup"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import AppInput from "../ui/AppInput"
import { authService } from "../../services/authService"
import { spacing } from "../../constants/theme"

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    if (!currentPassword || !newPassword) {
      setError("Enter your current and new password")
      return
    }
    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      await authService.changePassword(currentPassword, newPassword)
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message ?? "Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  if (success) {
    return (
      <Popup title="Password Changed" onClose={onClose}>
        <AppText variant="body" color="secondary" style={{ marginBottom: spacing[5] }}>
          Your password has been updated.
        </AppText>
        <AppButton label="Done" onPress={onClose} size="lg" />
      </Popup>
    )
  }

  return (
    <Popup title="Change Password" onClose={onClose}>
      <AppInput
        label="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{ marginBottom: spacing[3] }}
      />
      <AppInput
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{ marginBottom: spacing[3] }}
      />
      <AppInput
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{ marginBottom: spacing[3] }}
      />
      {!!error && (
        <AppText variant="caption" style={{ color: "#EF4444", marginBottom: spacing[3] }}>{error}</AppText>
      )}
      <View style={{ flexDirection: "row", gap: spacing[3] }}>
        <AppButton label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
        <AppButton label="Save" onPress={handleSave} isLoading={isSaving} style={{ flex: 1 }} />
      </View>
    </Popup>
  )
}
