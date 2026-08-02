import { View, StyleSheet } from "react-native"
import Skeleton from "../ui/Skeleton"
import { spacing, radii } from "../../constants/theme"

export default function AttendanceListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={styles.info}>
            <Skeleton width="45%" height={15} />
            <Skeleton width="65%" height={12} style={{ marginTop: spacing[2] }} />
          </View>
          <Skeleton width={70} height={24} borderRadius={radii.full} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    gap: spacing[4],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  info: {
    flex: 1,
  },
})
