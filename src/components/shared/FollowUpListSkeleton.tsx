import { View, StyleSheet } from "react-native"
import AppCard from "../ui/AppCard"
import Skeleton from "../ui/Skeleton"
import { spacing, radii } from "../../constants/theme"

export default function FollowUpListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <AppCard key={i} elevation="sm" style={styles.card}>
          <View style={styles.nameRow}>
            <Skeleton width="55%" height={15} />
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Skeleton width={70} height={11} />
              <Skeleton width={90} height={20} borderRadius={radii.sm} style={{ marginTop: spacing[2] }} />
            </View>
            <View style={styles.detailRight}>
              <Skeleton width={60} height={14} />
              <Skeleton width={50} height={10} style={{ marginTop: spacing[1] }} />
            </View>
          </View>
        </AppCard>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    padding: spacing[4],
    gap: spacing[2],
  },
  card: {
    padding: spacing[4],
  },
  nameRow: {
    marginBottom: spacing[3],
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailLeft: {},
  detailRight: {
    alignItems: "flex-end",
  },
})
