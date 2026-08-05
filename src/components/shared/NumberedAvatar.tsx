import { View, StyleSheet } from "react-native"
import AppText from "../ui/AppText"

interface Props {
  number: number
  color: string
  bgColor: string
  size?: number
}

export default function NumberedAvatar({ number, color, bgColor, size = 32 }: Props) {
  return (
    <View style={[styles.avatar, { backgroundColor: bgColor, width: size, height: size, borderRadius: size / 2 }]}>
      <AppText variant="bodySmall" style={{ color }}>{number}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
})
