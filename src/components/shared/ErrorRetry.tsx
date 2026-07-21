import { View, Pressable, StyleSheet } from "react-native"
import AppText from "../ui/AppText"
import { spacing } from "../../constants/theme"

interface Props {
  message?: string
  onRetry: () => void
}

export default function ErrorRetry({ message = "Something went wrong.", onRetry }: Props) {
  return (
    <View style={styles.center}>
      <AppText variant="body" color="secondary">{message}</AppText>
      <Pressable onPress={onRetry} style={styles.retryBtn}>
        <AppText variant="bodyMedium" color="accent">Retry</AppText>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[16] },
  retryBtn: { cursor: "pointer" } as any,
})
