import { View, StyleSheet } from "react-native"
import AppText from "../ui/AppText"
import { spacing, radii } from "../../constants/theme"

interface Props {
  name: string
  color: string
  bgColor: string
  size?: number
}

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase()
}

export default function StaffAvatar({ name, color, bgColor, size = 44 }: Props) {
  return (
    <View style={[styles.avatar, { backgroundColor: bgColor, width: size, height: size, borderRadius: size / 2 }]}>
      <AppText variant="bodyMedium" style={{ color }}>{getInitials(name)}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
})
