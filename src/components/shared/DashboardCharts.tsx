import { View, StyleSheet } from "react-native"
import Svg, { Circle } from "react-native-svg"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated"
import { MotiView } from "moti"
import { useEffect } from "react"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"

interface FollowupSummary {
  totalFollowUps: number
  byOutcome: Record<string, number>
  byResolution: { resolved: number; open: number }
  totalFollowedUpAmount: number
  totalPromisedAmount: number
  totalPaidAmount: number
}

const OUTCOME_COLORS: Record<string, string> = {
  promisedToPay:   palette.success.default,
  promisedPartial: palette.warning.default,
  dispute:         palette.error.default,
  noResponse:      palette.neutral[400],
}

const OUTCOME_LABELS: Record<string, string> = {
  promisedToPay:   "Promised Full",
  promisedPartial: "Promised Partial",
  dispute:         "Dispute",
  noResponse:      "No Response",
}

function formatAmount(v: number) {
  return v.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

// ─── static donut built from SVG circles ──────────────────────────────────────

function DonutChart({ segments, bg }: { segments: { value: number; color: string }[]; bg: string }) {
  const size = 120
  const strokeWidth = 18
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  let cumAngle = 0
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={bg} strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ
        const gap  = circ - dash
        const rotate = (cumAngle / total) * 360 - 90
        cumAngle += seg.value
        return (
          <Circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth - 2}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="butt"
            transform={`rotate(${rotate}, ${cx}, ${cy})`}
          />
        )
      })}
    </Svg>
  )
}

// ─── outcome donut section ────────────────────────────────────────────────────

function OutcomeDonut({ byOutcome, total }: { byOutcome: Record<string, number>; total: number }) {
  const { colors } = useTheme()
  const entries = Object.entries(byOutcome).filter(([, v]) => v > 0)
  if (entries.length === 0 || total === 0) return null

  const segments = entries.map(([key, value]) => ({
    value,
    color: OUTCOME_COLORS[key] ?? palette.neutral[400],
    label: OUTCOME_LABELS[key] ?? key,
  }))

  return (
    <View>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[3] }}>Outcome breakdown</AppText>
      <View style={styles.donutRow}>
        {/* Donut fades + scales in as a whole */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 500, easing: Easing.out(Easing.cubic) }}
          style={styles.donutSvgWrap}
        >
          <DonutChart segments={segments} bg={colors.border} />
          <View style={styles.donutCenter} pointerEvents="none">
            <AppText variant="heading3" style={{ color: colors.text.primary }}>{total}</AppText>
            <AppText variant="caption" color="tertiary" style={{ fontSize: 10 }}>total</AppText>
          </View>
        </MotiView>

        <View style={styles.donutLegend}>
          {segments.map(({ label, value, color }, i) => (
            <MotiView
              key={label}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 300, delay: 200 + i * 70 }}
            >
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <AppText variant="caption" color="secondary" style={{ flex: 1 }}>{label}</AppText>
                <AppText variant="caption" style={{ color, fontWeight: "600" }}>{value}</AppText>
              </View>
            </MotiView>
          ))}
        </View>
      </View>
    </View>
  )
}

// ─── animated funnel bar (scaleX — works on web + native) ────────────────────

function FunnelBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const scaleX = useSharedValue(0)

  useEffect(() => {
    scaleX.value = withDelay(delay, withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }))
  }, [pct])

  // We animate scaleX on a full-width fill; the track clips it.
  // translateX shifts it left so it grows from the left edge.
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -((1 - scaleX.value) / 2) * 100 + "%" as any },
      { scaleX: scaleX.value },
    ],
  }))

  return <Animated.View style={[styles.funnelFill, { backgroundColor: color }, animStyle]} />
}

// ─── collection funnel ────────────────────────────────────────────────────────

function CollectionFunnel({ totalFollowedUpAmount, totalPromisedAmount, totalPaidAmount }: {
  totalFollowedUpAmount: number
  totalPromisedAmount: number
  totalPaidAmount: number
}) {
  const { colors } = useTheme()
  const max = totalFollowedUpAmount || 1

  const bars = [
    { label: "Followed up", value: totalFollowedUpAmount, color: palette.info.default },
    { label: "Promised",    value: totalPromisedAmount,   color: palette.warning.default },
    { label: "Collected",   value: totalPaidAmount,        color: palette.success.default },
  ]

  return (
    <View>
      <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[3] }}>Collection funnel</AppText>
      <View style={styles.funnelWrap}>
        {bars.map(({ label, value, color }, i) => (
          <MotiView
            key={label}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 300, delay: i * 100 }}
          >
            <View style={styles.funnelMeta}>
              <AppText variant="caption" color="secondary">{label}</AppText>
              <AppText variant="caption" style={{ color, fontWeight: "600" }}>₹{formatAmount(value)}</AppText>
            </View>
            <View style={[styles.funnelTrack, { backgroundColor: colors.border }]}>
              <FunnelBar pct={Math.min(value / max, 1)} color={color} delay={i * 120} />
            </View>
          </MotiView>
        ))}
      </View>
    </View>
  )
}

// ─── export ───────────────────────────────────────────────────────────────────

export default function DashboardCharts({ followups }: { followups: FollowupSummary }) {
  const { colors } = useTheme()
  const hasAmounts  = followups.totalFollowedUpAmount > 0 || followups.totalPromisedAmount > 0 || followups.totalPaidAmount > 0
  const hasOutcomes = Object.values(followups.byOutcome).some((v) => v > 0)

  if (!hasAmounts && !hasOutcomes) return null

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400 }}
      style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}
    >
      <AppText variant="bodyMedium" style={{ marginBottom: spacing[4] }}>Insights</AppText>
      <View style={styles.sections}>
        {hasOutcomes && (
          <OutcomeDonut byOutcome={followups.byOutcome} total={followups.totalFollowUps} />
        )}
        {hasAmounts && hasOutcomes && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
        {hasAmounts && (
          <CollectionFunnel
            totalFollowedUpAmount={followups.totalFollowedUpAmount}
            totalPromisedAmount={followups.totalPromisedAmount}
            totalPaidAmount={followups.totalPaidAmount}
          />
        )}
      </View>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  sections: {
    gap: spacing[4],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  donutSvgWrap: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
  },
  donutLegend: {
    flex: 1,
    gap: spacing[2],
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  funnelWrap: {
    gap: spacing[3],
  },
  funnelMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing[1],
  },
  funnelTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  funnelFill: {
    height: 8,
    width: "100%",
    borderRadius: 4,
  },
})
