import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, Animated, Easing, useWindowDimensions } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, ChevronDown, Trophy, Timer, Clock, CalendarX, ShieldCheck, Award, RefreshCw, MessageSquareText } from "lucide-react-native"
import moment from "moment"
import { useState, useRef, useEffect } from "react"
import BackButton from "../../components/shared/BackButton"
import Collapsible from "../../components/shared/Collapsible"
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

function humanizeMetricName(name: string): string {
  const spaced = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

function categoryIcon(category: string, color: string, size = 13) {
  switch (category.toLowerCase()) {
    case "time keeping": return <Timer size={size} color={color} strokeWidth={1.75} />
    case "attendance":   return <Clock size={size} color={color} strokeWidth={1.75} />
    case "leaves":       return <CalendarX size={size} color={color} strokeWidth={1.75} />
    case "appearance":   return <ShieldCheck size={size} color={color} strokeWidth={1.75} />
    case "extra performance": return <Award size={size} color={color} strokeWidth={1.75} />
    default:             return <Trophy size={size} color={color} strokeWidth={1.75} />
  }
}

// ─── BreakdownRow ─────────────────────────────────────────────────────────────

function BreakdownRow({ item }: { item: ScoreBreakdownItem }) {
  const { colors } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const isFull = item.possible > 0 && item.earned >= item.possible
  const isZero = item.earned <= 0
  const color = isFull
    ? palette.success.default
    : isZero
    ? palette.error.default
    : palette.warning.default

  function toggle() {
    setExpanded((e) => !e)
  }

  return (
    <View style={[styles.breakdownRow, { borderColor: colors.border }]}>
      <Pressable
        onPress={() => item.explanation && toggle()}
        style={styles.breakdownRowHeader}
      >
        <View style={[styles.breakdownIcon, { backgroundColor: color + "18" }]}>
          {categoryIcon(item.category, color, 15)}
        </View>

        <View style={{ flex: 1 }}>
          <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
            {item.category}
          </AppText>
          {item.metrics.length > 0 && (
            <AppText variant="caption" color="tertiary" style={{ fontSize: 11, marginTop: 1 }}>
              {item.metrics
                .map((m) => `${humanizeMetricName(m.name)}: ${m.value}`)
                .join("  ·  ")}
            </AppText>
          )}
        </View>

        <AppText variant="bodyMedium" style={{ color, fontSize: 13 }}>
          {item.earned > 0 ? `+${item.earned}` : item.earned}
          <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
            {" "}/{item.possible}
          </AppText>
        </AppText>

        {item.explanation && (
          <ChevronDown
            size={14}
            color={colors.text.tertiary}
            strokeWidth={2}
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
          />
        )}
      </Pressable>

      {item.explanation && (
        <Collapsible expanded={expanded}>
          <View style={[styles.explanationBox, { backgroundColor: colors.background.secondary }]}>
            <AppText variant="caption" color="secondary" style={{ fontSize: 12, lineHeight: 17 }}>
              {item.explanation}
            </AppText>
          </View>
        </Collapsible>
      )}
    </View>
  )
}

// ─── SummaryPip ───────────────────────────────────────────────────────────────

function SummaryPip({ item }: { item: ScoreBreakdownItem }) {
  const isFull = item.possible > 0 && item.earned >= item.possible
  const isZero = item.earned <= 0
  const color = isFull ? palette.success.default : isZero ? palette.error.default : palette.warning.default

  return (
    <View style={[styles.summaryPip, { backgroundColor: color + "18" }]}>
      {categoryIcon(item.category, color, 12)}
      <AppText variant="caption" style={{ color, fontSize: 11 }} numberOfLines={1}>
        {item.category}
      </AppText>
      <AppText variant="caption" style={{ color, fontSize: 11, fontWeight: "600" }}>
        {item.earned > 0 ? `+${item.earned}` : item.earned}
      </AppText>
    </View>
  )
}

// ─── ScoreCard ────────────────────────────────────────────────────────────────

function ScoreCard({ score, rank }: { score: StaffScore; rank: number }) {
  const { colors } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const pct = score.percentageScore ?? 0
  const color = scoreColor(pct)
  const rColor = rankColor(rank)
  const clampedPct = Math.max(0, Math.min(100, pct))
  const barAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: clampedPct,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [clampedPct])

  function toggle() {
    setExpanded((e) => !e)
  }

  return (
    <AppCard elevation="sm" style={styles.scoreCard}>
      <Pressable onPress={toggle}>
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
          <ChevronDown
            size={16}
            color={colors.text.tertiary}
            strokeWidth={2}
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
          />
        </View>

        {/* Progress bar */}
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <AppText variant="caption" color="tertiary" style={styles.pctLabel}>
          {pct.toFixed(0)}%
        </AppText>

        {/* Collapsed summary */}
        {score.breakdown.length > 0 && (
          <Collapsible expanded={!expanded}>
            <View style={styles.summaryRow}>
              {score.breakdown.map((item) => (
                <SummaryPip key={item.rule} item={item} />
              ))}
            </View>
          </Collapsible>
        )}
      </Pressable>

      <Collapsible expanded={expanded}>
        <View>
          {/* Breakdown */}
          {score.breakdown.length > 0 && (
            <View style={[styles.breakdownList, { borderTopColor: colors.border }]}>
              {score.breakdown.map((item) => (
                <BreakdownRow key={item.rule} item={item} />
              ))}
            </View>
          )}

          {/* Remarks */}
          {score.remarks && (
            <View style={[styles.remarksBox, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
              <MessageSquareText size={13} color={colors.text.tertiary} strokeWidth={1.75} />
              <AppText variant="caption" color="secondary" style={{ flex: 1, fontSize: 12 }}>
                {score.remarks}
              </AppText>
            </View>
          )}

          {/* Calculated meta */}
          {score.calculatedAt && (
            <AppText variant="caption" color="tertiary" style={styles.calculatedLabel}>
              Calculated {moment(score.calculatedAt).format("D MMM, h:mm A")}
              {score.calculatedBy ? ` · ${score.calculatedBy}` : ""}
            </AppText>
          )}
        </View>
      </Collapsible>
    </AppCard>
  )
}

// ─── ScoresScreen ─────────────────────────────────────────────────────────────

type ScoreRow = { key: string; items: StaffScore[]; startRank: number }

function buildScoreRows(scores: StaffScore[], columns: number): ScoreRow[] {
  const rows: ScoreRow[] = []
  for (let i = 0; i < scores.length; i += columns) {
    rows.push({ key: `row-${i}`, items: scores.slice(i, i + columns), startRank: i + 1 })
  }
  return rows
}

export default function ScoresScreen() {
  const { colors } = useTheme()
  const { isTablet, isDesktop } = useTablet()
  const { width: windowWidth } = useWindowDimensions()
  const queryClient = useQueryClient()
  const desktopColumns = windowWidth >= 1600 ? 3 : 2

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

      {isDesktop ? (
        <FlatList
          key={`desktop-grid-${desktopColumns}`}
          data={buildScoreRows(scores, desktopColumns)}
          keyExtractor={(row) => row.key}
          renderItem={({ item: row }) => (
            <View style={styles.deskGridRow}>
              {row.items.map((score, i) => (
                <View key={score._id} style={{ flex: 1 }}>
                  <ScoreCard score={score} rank={row.startRank + i} />
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.deskGridContent}
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
      ) : (
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
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  deskGridContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  deskGridRow: {
    flexDirection: "row",
    gap: spacing[4],
    alignItems: "flex-start",
  },
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
    height: 2,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing[1],
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  summaryPip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  pctLabel: {
    textAlign: "right",
    marginBottom: spacing[1],
  },
  breakdownList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing[2],
    gap: spacing[2],
  },
  breakdownRow: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  breakdownRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  breakdownIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  explanationBox: {
    borderRadius: radii.md,
    padding: spacing[3],
    marginHorizontal: spacing[3],
    marginBottom: spacing[3],
  },
  remarksBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  calculatedLabel: {
    marginTop: spacing[2],
    fontSize: 10,
  },
})
