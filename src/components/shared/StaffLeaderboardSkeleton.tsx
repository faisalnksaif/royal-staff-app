import { View, StyleSheet } from "react-native"
import AppCard from "../ui/AppCard"
import Skeleton from "../ui/Skeleton"
import { spacing, radii } from "../../constants/theme"

export default function StaffLeaderboardSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <AppCard elevation="sm">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
          <Skeleton width={28} height={28} borderRadius={radii.full} />
          <View style={styles.text}>
            <Skeleton width="45%" height={14} />
            <Skeleton width={80} height={10} style={{ marginTop: spacing[1] }} />
          </View>
          <Skeleton width={64} height={14} />
        </View>
      ))}
    </AppCard>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.15)",
  },
  text: {
    flex: 1,
  },
})
