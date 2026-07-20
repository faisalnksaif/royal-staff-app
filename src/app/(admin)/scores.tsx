import { View, FlatList, ActivityIndicator, StyleSheet, Pressable } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Trophy, Clock, CalendarX, ShieldCheck, RefreshCw } from "lucide-react-native"
import moment from "moment"
import { useState } from "react"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { scoreService } from "../../services/scoreService"
import type { ScoreBreakdownItem, StaffScore } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function scoreColor(pct: number): string {
  if (pct >= 80) return palette.success.default
  if (pct >= 50) return palette.warning.default
  return palette.error.default
}

function rankColor(rank: number): string {
  if (rank === 1) return "#F59E0B"
  if (rank === 2) return "#94A3B8"
  if (rank === 3) return "#B45309"
  return palette.neutral[400]
}

function categoryIcon(category: string, color: string, size = 13) {
  switch (category.toLowerCase()) {
    case "attendance": return <Clock size={size} color={color} strokeWidth={1.75} />
    case "leaves":     return <CalendarX size={size} color={color} strokeWidth={1.75} />
    case "appearance": return <ShieldCheck size={size} color={color} strokeWidth={1.75} />
    default:           return <Trophy size={size} color={color} strokeWidth={1.75} />
  }
}

// ─── BreakdownChip ────────────────────────────────────────────────────────────

function BreakdownChip({ item }: { item: ScoreBreakdownItem }) {
  const isPositive = item.earned > 0
  const isNegative = item.earned < 0
  const color = isPositive
    ? palette.success.default
    : isNegative
    ? palette.error.default
    : palette.neutral[400]

  return (
    <View style={[styles.chip, { backgroundColor: color + "18", borderColor: color }]}>
      {categoryIcon(item.category, color)}
      <AppText variant="caption" style={{ color, fontSize: 11 }}>
        {item.category}
      </AppText>
      <AppText variant="caption" style={{ color, fontSize: 11, fontWeight: "600" }}>
        {item.earned > 0 ? `+${item.earned}` : `${item.earned}`}
      </AppText>
    </View>
  )
}

// ─── ScoreCard ────────────────────────────────────────────────────────────────

function ScoreCard({ score, rank }: { score: StaffScore; rank: number }) {
  const { colors } = useTheme()
  const pct = score.percentageScore ?? 0
  const color = scoreColor(pct)
  const rColor = rankColor(rank)

  return (
    <AppCard elevation="sm" style={styles.scoreCard}>
      {/* Top row: rank + name + score */}
      <View style={styles.cardTop}>
        <View style={[styles.rankBadge, { backgroundColor: rColor + "22" }]}>
          <AppText variant="caption" style={{ color: rColor, fontSize: 11, fontWeight: "700" }}>
            #{rank}
          </AppText>
        </View>
        <AppText variant="bodyMedium" style={styles.staffName} numberOfLines={1}>
          {score.staffName}
        </AppText>
        <View style={styles.scoreRight}>
          <AppText variant="bodyMedium" style={{ color }}>
            {score.totalScore}
          </AppText>
          <AppText variant="caption" color="tertiary">
            /{score.maxPossibleScore}
          </AppText>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(0, Math.min(100, pct))}%` as any, backgroundColor: color },
          ]}
        />
      </View>
      <AppText variant="caption" color="tertiary" style={styles.pctLabel}>
        {pct.toFixed(0)}%
      </AppText>

      {/* Breakdown chips */}
      {score.breakdown.length > 0 && (
        <View style={[styles.chipsRow, { borderTopColor: colors.border }]}>
          {score.breakdown.map((item) => (
            <BreakdownChip key={item.rule} item={item} />
          ))}
        </View>
      )}

    </AppCard>
  )
}

// ─── ScoresScreen ─────────────────────────────────────────────────────────────

export default function ScoresScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()

  const [month, setMonth] = useState(() => moment().startOf("month"))
  const monthParam = month.format("YYYY-MM")
  const isCurrentMonth = month.isSame(moment(), "month")

  const { data: overviewData, isLoading } = useQuery({
    queryKey: ["scores-monthly", monthParam],
    queryFn: () => scoreService.getMonthlyOverview(monthParam),
  })

  const { data: configData } = useQuery({
    queryKey: ["scoring-config", monthParam],
    queryFn: () => scoreService.getScoringConfig(monthParam),
    retry: false,
  })

  const calculateMutation = useMutation({
    mutationFn: () => scoreService.calculateMonthly(monthParam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores-monthly", monthParam] })
    },
  })

  const scores = overviewData?.data?.scores ?? []
  const config = configData?.data

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {!isTablet && <BackButton />}
          <View>
            <AppText variant="heading3">Staff Scores</AppText>
            <AppText variant="caption" color="tertiary">
              Performance by month
            </AppText>
          </View>
        </View>

        {/* Month navigator */}
        <View style={[styles.monthNav, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setMonth((m) => m.clone().subtract(1, "month"))}
            style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
          <AppText variant="bodyMedium" style={{ minWidth: 88, textAlign: "center" }}>
            {month.format("MMM YYYY")}
          </AppText>
          <Pressable
            onPress={() => !isCurrentMonth && setMonth((m) => m.clone().add(1, "month"))}
            style={({ pressed }) => [styles.navBtn, { opacity: isCurrentMonth || pressed ? 0.3 : 1 }]}
            hitSlop={8}
            disabled={isCurrentMonth}
          >
            <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Recalculate */}
        <Pressable
          onPress={() => calculateMutation.mutate()}
          disabled={calculateMutation.isPending}
          hitSlop={8}
          style={({ pressed }) => [
            styles.recalcBtn,
            { backgroundColor: colors.background.secondary, borderColor: colors.border, opacity: pressed || calculateMutation.isPending ? 0.5 : 1 },
          ]}
        >
          {calculateMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <RefreshCw size={16} color={colors.accent} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      {/* Config strip */}
      {config && (
        <View style={[styles.configStrip, { backgroundColor: colors.background.secondary, borderBottomColor: colors.border }]}>
          <AppText variant="caption" color="tertiary">
            Rules:
          </AppText>
          <AppText variant="caption" color="secondary">
            Late ≤{config.attendance.maxLateCases} → +{config.attendance.pointsIfNoLate}pts
          </AppText>
          <View style={styles.configDot} />
          <AppText variant="caption" color="secondary">
            Leave ≤{config.leaves.maxAllowedPerMonth} → +{config.leaves.pointsIfWithinLimit}pts
          </AppText>
          <View style={styles.configDot} />
          <AppText variant="caption" color="secondary">
            Appearance {config.appearance.pointsPerViolation}pts/day
          </AppText>
          {config.extraPerformance && (
            <>
              <View style={styles.configDot} />
              <AppText variant="caption" color="secondary">
                Extra +{config.extraPerformance.pointsPerPerformance}pts/approval
              </AppText>
            </>
          )}
        </View>
      )}

      <FlatList
        data={scores}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => <ScoreCard score={item} rank={index + 1} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.emptyState}>
              <Trophy size={40} color={colors.text.tertiary} strokeWidth={1.25} />
              <AppText variant="bodyMedium" color="secondary" style={{ marginTop: spacing[3] }}>
                No scores for {month.format("MMMM YYYY")}
              </AppText>
              <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[1], textAlign: "center" }}>
                Scores are calculated from attendance, leaves and appearance data.
              </AppText>
              <View style={{ marginTop: spacing[5] }}>
                <AppButton
                  label={calculateMutation.isPending ? "Calculating…" : "Calculate Scores"}
                  onPress={() => calculateMutation.mutate()}
                  disabled={calculateMutation.isPending}
                  isLoading={calculateMutation.isPending}
                />
              </View>
            </View>
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing[3], flex: 1 },
  recalcBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  navBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  configStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: "wrap",
  },
  configDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#94A3B8",
  },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  center: { alignItems: "center", justifyContent: "center", paddingTop: spacing[16] },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[16],
    paddingHorizontal: spacing[8],
  },
  scoreCard: { padding: spacing[4] },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  staffName: { flex: 1 },
  scoreRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing[1],
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  pctLabel: {
    textAlign: "right",
    marginBottom: spacing[1],
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
  },
})
