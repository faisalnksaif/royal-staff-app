import { useState, useMemo, useEffect, useRef } from "react"
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Animated, Easing } from "react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import ErrorRetry from "../../components/shared/ErrorRetry"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { formatAmount } from "../../utils/helpers"
import { useDebtHistory } from "../../hooks/useDebtHistory"

const RANGES: { label: string; days: number }[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "180D", days: 180 },
  { label: "1Y", days: 365 },
]

const CHART_H = 220
const SCREEN_W = Dimensions.get("window").width

// Format number as abbreviated (2k, 3M, etc.)
function abbreviateNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  return num.toString()
}

// ─── DebtChart ───────────────────────────────────────────────────────────────

function DebtChart({ data, color }: { data: { date: string; total_debt: number }[]; color: string }) {
  const { colors } = useTheme()
  const [chartW, setChartW] = useState<number>(SCREEN_W - spacing[4] * 2 - spacing[3] * 2)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const lineAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(lineAnimation, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [lineAnimation])

  // Transform data for custom chart
  const chartData = data.map((d, i) => ({
    x: i,
    y: d.total_debt,
    date: moment(d.date).format("D MMM"),
    fullDate: moment(d.date).format("D MMM YYYY"),
  }))

  const values = chartData.map(d => d.y)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const valRange = maxVal - minVal || 1
  const leftPad = 20
  const rightPad = 50
  const plotW = Math.max(chartW - leftPad - rightPad, 0)
  const hoverThreshold = Math.max(18, plotW / Math.max(chartData.length * 2, 1))
  const tooltipWidth = 120
  const tooltipMargin = 8

  return (
    <Animated.View
      onLayout={(e: any) => setChartW(e.nativeEvent.layout.width)}
      style={{
        alignSelf: "stretch",
        height: CHART_H + 60,
        position: "relative",
        overflow: "hidden",
        opacity: lineAnimation,
      }}
    >
      {chartW > 0 && (
        <>
          <svg
            width={chartW}
            height={CHART_H + 60}
            style={{ backgroundColor: "transparent", cursor: "crosshair", overflow: "hidden" } as any}
            onMouseMove={(e: any) => {
              const rect = (e.target as any).getBoundingClientRect()
              const x = e.clientX - rect.left - leftPad
              const relativeX = Math.max(0, Math.min(plotW, x))

              if (plotW <= 0 || chartData.length <= 1) {
                setHoveredIdx(null)
                return
              }

              const nearest = chartData.reduce(
                (best, _, idx) => {
                  const pointX = (idx / Math.max(chartData.length - 1, 1)) * plotW
                  const distance = Math.abs(relativeX - pointX)
                  return distance < best.distance ? { index: idx, distance } : best
                },
                { index: -1, distance: Number.POSITIVE_INFINITY }
              )

              if (nearest.index >= 0 && nearest.distance <= hoverThreshold) {
                setHoveredIdx(nearest.index)
              } else if (hoveredIdx !== null) {
                setHoveredIdx(hoveredIdx)
              } else {
                setHoveredIdx(null)
              }
            }}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <g transform={`translate(${leftPad}, 20)`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = CHART_H * (1 - pct)
                return (
                  <line
                    key={i}
                    x1={0}
                    y1={y}
                    x2={plotW}
                    y2={y}
                    stroke={colors.border as string}
                    strokeDasharray="4 4"
                    strokeWidth={0.5}
                  />
                )
              })}

              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const val = minVal + valRange * (1 - pct)
                const y = CHART_H * (1 - pct)
                return (
                  <text key={i} x={plotW + 12} y={y + 4} fontSize={11} fill={colors.text.tertiary as string} textAnchor="start">
                    {abbreviateNumber(val)}
                  </text>
                )
              })}

              {/* Line */}
              {chartData.length > 1 && (
                <polyline
                  points={chartData
                    .map((d, i) => {
                      const x = (i / (chartData.length - 1)) * plotW
                      const y = CHART_H * (1 - (d.y - minVal) / valRange)
                      return `${x},${y}`
                    })
                    .join(" ")}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  style={{ opacity: lineAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) as any }}
                />
              )}

              {/* Data points */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * plotW
                const y = CHART_H * (1 - (d.y - minVal) / valRange)
                const isHovered = hoveredIdx === i

                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill={color}
                      style={{ cursor: "pointer" } as any}
                    />
                    {/* Vertical line on hover */}
                    {isHovered && (
                      <line x1={x} y1={0} x2={x} y2={CHART_H} stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity="0.5" />
                    )}
                  </g>
                )
              })}

              {/* X-axis labels */}
              {chartData.map((d, i) => {
                if (chartData.length > 5 && ![0, Math.floor(chartData.length / 4), Math.floor((chartData.length * 2) / 4), Math.floor((chartData.length * 3) / 4), chartData.length - 1].includes(i)) return null
                const x = (i / (chartData.length - 1)) * plotW
                return (
                  <text key={i} x={x} y={CHART_H + 25} fontSize={11} fill={colors.text.tertiary as string} textAnchor="middle">
                    {d.date}
                  </text>
                )
              })}
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredIdx !== null && chartData[hoveredIdx] && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 10,
                left: Math.min(
                  Math.max(
                    leftPad + (hoveredIdx / Math.max(chartData.length - 1, 1)) * plotW - tooltipWidth / 2,
                    tooltipMargin
                  ),
                  chartW - tooltipWidth - tooltipMargin
                ),
                width: tooltipWidth,
                backgroundColor: colors.background.secondary as string,
                borderColor: colors.border as string,
                borderWidth: 1,
                borderRadius: radii.md,
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
                zIndex: 9999,
                elevation: 9999,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              <AppText variant="caption" color="tertiary" style={{ fontSize: 10 }}>
                {chartData[hoveredIdx].fullDate}
              </AppText>
              <AppText variant="bodySmall" style={{ color, fontWeight: "bold" }}>
                ₹{formatAmount(chartData[hoveredIdx].y)}
              </AppText>
            </View>
          )}
        </>
      )}
    </Animated.View>
  )
}

// ─── StatRow ─────────────────────────────────────────────────────────────────

function StatItem({ label, value, color, hint }: { label: string; value: string; color?: string; hint?: string }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.statItem, { backgroundColor: colors.background.secondary as string }]}> 
      <AppText variant="caption" color="tertiary" style={styles.statLabel}>{label}</AppText>
      <AppText variant="heading3" style={{ color: color ?? (colors.text.primary as string) }}>{value}</AppText>
      {hint ? (
        <AppText variant="caption" color="tertiary" style={styles.statHint}>{hint}</AppText>
      ) : null}
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DebtHistoryScreen() {
  const { colors } = useTheme()
  const [days, setDays] = useState(30)
  const { data, isLoading, isError, refetch } = useDebtHistory(days)

  const points = data?.data ?? []

  const stats = useMemo(() => {
    if (points.length === 0) return null
    const values = points.map((p) => p.total_debt)
    const latest = values[values.length - 1]
    const earliest = values[0]
    const peak = Math.max(...values)
    const trough = Math.min(...values)
    const change = latest - earliest
    const changePct = earliest !== 0 ? (change / Math.abs(earliest)) * 100 : 0
    const average = values.reduce((sum, value) => sum + value, 0) / values.length
    const range = peak - trough
    const trend = change >= 0 ? "Rising" : "Falling"
    return { latest, earliest, peak, trough, change, changePct, average, range, trend }
  }, [points])

  const chartColor = palette.error.default

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background.primary as string }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border as string }]}>
        <BackButton />
        <AppText variant="heading2">Outstanding Debt</AppText>
      </View>

      {/* Range chips */}
      <View style={styles.chips}>
        {RANGES.map((r) => {
          const active = r.days === days
          return (
            <TouchableOpacity
              key={r.days}
              onPress={() => setDays(r.days)}
              style={[
                styles.chip,
                { borderColor: colors.border as string },
                active && { backgroundColor: chartColor, borderColor: chartColor },
              ]}
            >
              <AppText variant="caption" style={{ color: active ? "#fff" : (colors.text.secondary as string) }}>
                {r.label}
              </AppText>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Chart card */}
      <AppCard elevation="sm" style={styles.chartCard}>
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ height: CHART_H }} />
        ) : isError ? (
          <ErrorRetry message="Couldn't load debt history." onRetry={refetch} />
        ) : points.length === 0 ? (
          <View style={[styles.center, { height: CHART_H }]}>
            <AppText color="tertiary">No data for this range.</AppText>
          </View>
        ) : (
          <>
            <DebtChart data={points} color={chartColor} />
          </>
        )}
      </AppCard>

      {/* Stats */}
      {stats && (
        <AppCard elevation="sm" style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <AppText variant="heading3">Stats</AppText>
            <AppText variant="caption" color="tertiary">Showing the selected period</AppText>
          </View>

          <View style={styles.statsRow}>
            <StatItem label="Current" value={`₹${formatAmount(stats.latest)}`} color={chartColor} />
            <StatItem label="Average" value={`₹${formatAmount(stats.average)}`} />
          </View>
          <View style={styles.statsRow}>
            <StatItem label="Peak" value={`₹${formatAmount(stats.peak)}`} />
            <StatItem label="Trough" value={`₹${formatAmount(stats.trough)}`} color={palette.success.default} />
          </View>
          <View style={styles.statsRow}>
            <StatItem
              label={stats.change >= 0 ? "Net change" : "Net change"}
              value={`₹${formatAmount(stats.change)}`}
              color={stats.change >= 0 ? palette.error.default : palette.success.default}
              hint={`${stats.trend} over period`}
            />
            <StatItem
              label="Range"
              value={`₹${formatAmount(stats.range)}`}
              hint={`${stats.changePct >= 0 ? "+" : ""}${stats.changePct.toFixed(1)}% from start`}
              color={stats.changePct >= 0 ? palette.error.default : palette.success.default}
            />
          </View>
        </AppCard>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing[12] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chips: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chartCard: { marginHorizontal: spacing[4], padding: spacing[3] },
  statsCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[4],
    gap: spacing[3],
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statItem: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radii.md,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  statLabel: { marginBottom: spacing[1] },
  statHint: { marginTop: spacing[1] },
  divider: { height: StyleSheet.hairlineWidth },
  center: { alignItems: "center", justifyContent: "center" },
})
