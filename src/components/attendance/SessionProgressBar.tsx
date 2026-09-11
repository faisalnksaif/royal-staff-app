import { useState } from "react"
import { View, Pressable, Platform, StyleSheet } from "react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { computeSessionGaps, formatWorkHours } from "./helpers"
import type { AttendanceRecord } from "../../types"

interface ProgressSegment {
  key: string
  kind: "session" | "break"
  start: number
  end: number
  isLive: boolean
  label: string
}

function buildProgressSegments(record: AttendanceRecord): ProgressSegment[] {
  const segments: ProgressSegment[] = []

  record.sessions.forEach((s) => {
    const start = moment(s.checkIn).valueOf()
    const isLive = !s.checkOut && !s.autoClosed
    const end = s.checkOut ? moment(s.checkOut).valueOf() : Date.now()
    segments.push({
      key: `session-${s.sessionNumber}`,
      kind: "session",
      start,
      end,
      isLive,
      label: `Session ${s.sessionNumber}: ${moment(start).format("h:mm A")} – ${s.checkOut ? moment(end).format("h:mm A") : "now"}`,
    })
  })

  const gaps = computeSessionGaps(record.sessions)
  gaps.forEach((gap, i) => {
    segments.push({
      key: `break-${i}`,
      kind: "break",
      start: moment(gap.startTime).valueOf(),
      end: moment(gap.endTime).valueOf(),
      isLive: false,
      label: `Break: ${moment(gap.startTime).format("h:mm A")} – ${moment(gap.endTime).format("h:mm A")}`,
    })
  })

  return segments.sort((a, b) => a.start - b.start)
}

export default function SessionProgressBar({ record, color }: { record: AttendanceRecord; color: string }) {
  const { colors } = useTheme()
  const [hovered, setHovered] = useState<ProgressSegment | null>(null)

  const segments = buildProgressSegments(record)
  if (segments.length === 0) return null

  function segmentColor(seg: ProgressSegment): string {
    if (seg.kind === "session") return color
    return palette.warning.default
  }

  return (
    <View style={{ marginTop: spacing[2], position: "relative" }}>
      <View style={styles.progressBarTrack}>
        {segments.map((seg, i) => {
          const durationMs = Math.max(seg.end - seg.start, 1)
          const segColor = segmentColor(seg)

          const hoverProps = Platform.OS === "web"
            ? {
                onMouseEnter: () => setHovered(seg),
                onMouseLeave: () => setHovered(null),
              }
            : {}

          return (
            <View
              key={seg.key}
              {...hoverProps}
              style={[
                styles.progressBarSegment,
                {
                  flex: durationMs,
                  backgroundColor: segColor,
                  opacity: seg.isLive ? 0.85 : 1,
                  marginLeft: i > 0 ? 2 : 0,
                },
              ]}
            >
              {seg.isLive && <View style={[styles.progressBarLiveDot, { backgroundColor: "#fff" }]} />}
            </View>
          )
        })}
      </View>

      {hovered && (
        <View
          pointerEvents="none"
          style={[
            styles.progressTooltip,
            { backgroundColor: colors.background.primary, borderColor: colors.border as string },
          ]}
        >
          <AppText variant="caption" numberOfLines={1}>{hovered.label}</AppText>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  progressBarTrack: {
    flexDirection: "row",
    height: 3,
    borderRadius: radii.full,
    backgroundColor: palette.neutral[500] + "22",
    overflow: "hidden",
  },
  progressBarSegment: {
    height: "100%",
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  progressTooltip: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    elevation: 10,
  },
})
