import { View, StyleSheet } from "react-native"
import AppCard from "../ui/AppCard"
import Skeleton from "../ui/Skeleton"
import { spacing, radii } from "../../constants/theme"

export default function DashboardSkeleton() {
  return (
    <View>
      {/* Stat tiles */}
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <AppCard key={i} elevation="sm" style={styles.statTile}>
            <Skeleton width={60} height={11} />
            <Skeleton width="80%" height={22} style={{ marginTop: spacing[2] }} />
          </AppCard>
        ))}
      </View>

      {/* Follow-up summary card */}
      <AppCard elevation="sm" style={styles.followupCard}>
        <Skeleton width={90} height={14} style={{ marginBottom: spacing[4] }} />
        <View style={styles.followupMoneyRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.followupMoneyItem}>
              <Skeleton width={50} height={10} />
              <Skeleton width="70%" height={20} style={{ marginTop: spacing[2] }} />
            </View>
          ))}
        </View>
        <View style={styles.outcomePillRow}>
          {[64, 80, 56].map((w, i) => (
            <Skeleton key={i} width={w} height={22} borderRadius={radii.full} />
          ))}
        </View>
      </AppCard>

      {/* Leaderboard card */}
      <AppCard elevation="sm">
        <Skeleton width={140} height={14} style={{ marginBottom: spacing[3] }} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.leaderRow, i > 0 && styles.leaderRowBorder]}>
            <Skeleton width={28} height={28} borderRadius={radii.full} />
            <View style={styles.leaderText}>
              <Skeleton width="50%" height={14} />
              <Skeleton width={70} height={10} style={{ marginTop: spacing[1] }} />
            </View>
            <Skeleton width={64} height={14} />
          </View>
        ))}
      </AppCard>
    </View>
  )
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statTile: {
    flex: 1,
  },
  followupCard: {
    marginBottom: spacing[3],
  },
  followupMoneyRow: {
    flexDirection: "row",
    marginBottom: spacing[3],
  },
  followupMoneyItem: {
    flex: 1,
  },
  outcomePillRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  leaderRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.15)",
  },
  leaderText: {
    flex: 1,
  },
})
