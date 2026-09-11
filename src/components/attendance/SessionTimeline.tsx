import { View, ScrollView, StyleSheet } from "react-native"
import { LogIn, LogOut, Clock, AlertTriangle } from "lucide-react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { computeSessionGaps, formatWorkHours, type SessionGap } from "./helpers"
import { sharedStyles } from "./styles"
import type { AttendanceRecord, AttendanceSession } from "../../types"

function BreakRow({ gap, isOver }: { gap: SessionGap; isOver: boolean }) {
  const { colors } = useTheme()
  const color = isOver ? palette.warning.default : palette.success.default

  return (
    <View style={sharedStyles.timelineRow}>
      <View style={sharedStyles.timelineLeft}>
        <View style={[sharedStyles.sessionDot, { backgroundColor: color }]} />
        <AppText variant="caption" color="tertiary" numberOfLines={1}>
          Break
        </AppText>
      </View>

      <View style={sharedStyles.timelineTimes}>
        <View style={sharedStyles.timeChip}>
          <LogOut size={13} color={color} strokeWidth={2} />
          <AppText variant="caption" style={{ color: colors.text.primary }}>
            {moment(gap.startTime).format("h:mm A")}
          </AppText>
        </View>

        <View style={[sharedStyles.timeDash, { backgroundColor: colors.border as string }]} />

        <View style={sharedStyles.timeChip}>
          <LogIn size={13} color={color} strokeWidth={2} />
          <AppText variant="caption" style={{ color: colors.text.primary }}>
            {moment(gap.endTime).format("h:mm A")}
          </AppText>
        </View>

        <AppText
          variant="caption"
          color="tertiary"
          numberOfLines={1}
          style={{ marginLeft: spacing[2], flexShrink: 0 }}
        >
          {formatWorkHours(gap.minutes / 60)}
        </AppText>
      </View>
    </View>
  )
}

export default function SessionTimeline({
  record, color, scrollable,
}: {
  record: AttendanceRecord; color: string; scrollable?: boolean
}) {
  const { colors } = useTheme()
  const now = Date.now()
  const Container = scrollable ? ScrollView : View
  const containerProps = scrollable
    ? {
        style: styles.timelineScrollable,
        contentContainerStyle: styles.timeline,
        showsVerticalScrollIndicator: false,
      }
    : { style: styles.timeline }

  const orderedSessions = [...record.sessions].sort((a, b) => b.sessionNumber - a.sessionNumber)

  // Breaks are derived client-side from the gap between one session's checkOut
  // and the next session's checkIn — the API no longer identifies individual
  // tea/lunch windows, only a single summed daily break allowance/excess.
  const gaps = computeSessionGaps(record.sessions)
  const isOverAll = (record.break?.excessMinutes ?? 0) > 0

  // Sessions render newest-first, so a break must attach to the session that
  // comes right AFTER it chronologically (whose checkIn == the gap's
  // endTime) — that session renders first, putting the break row directly
  // beneath it and above the earlier session it followed.
  function breaksAfter(session: AttendanceSession): { key: string; gap: SessionGap }[] {
    return gaps
      .filter((g) => moment(g.endTime).isSame(session.checkIn))
      .map((g, i) => ({ key: `${session.sessionNumber}-${i}`, gap: g }))
  }

  return (
    <Container {...containerProps}>
      {orderedSessions.map((session) => {
        const isOpen = !session.checkOut && !session.autoClosed
        const breaks = breaksAfter(session)

        return (
          <View key={session.sessionNumber} style={styles.timelineGroup}>
            <View style={sharedStyles.timelineRow}>
              <View style={sharedStyles.timelineLeft}>
                <View style={[sharedStyles.sessionDot, { backgroundColor: color }]} />
                <AppText variant="caption" color="tertiary">
                  Session {session.sessionNumber}
                </AppText>
              </View>

              <View style={sharedStyles.timelineTimes}>
                <View style={sharedStyles.timeChip}>
                  <LogIn size={13} color={palette.success.default} strokeWidth={2} />
                  <AppText variant="caption" style={{ color: colors.text.primary }}>
                    {moment(session.checkIn).format("h:mm A")}
                  </AppText>
                </View>

                <View style={[sharedStyles.timeDash, { backgroundColor: colors.border as string }]} />

                {session.checkOut ? (
                  <View style={sharedStyles.timeChip}>
                    <LogOut size={13} color={palette.error.default} strokeWidth={2} />
                    <AppText variant="caption" style={{ color: colors.text.primary }}>
                      {moment(session.checkOut).format("h:mm A")}
                    </AppText>
                  </View>
                ) : session.autoClosed ? (
                  <View style={sharedStyles.timeChip}>
                    <AlertTriangle size={13} color={palette.warning.default} strokeWidth={2} />
                    <AppText variant="caption" style={{ color: palette.warning.default }}>
                      Auto-closed
                    </AppText>
                  </View>
                ) : (
                  <View style={sharedStyles.timeChip}>
                    <AppText variant="caption" style={{ color: palette.success.default }}>
                      Still in
                    </AppText>
                  </View>
                )}

                {isOpen ? (
                  <AppText
                    variant="caption"
                    color="tertiary"
                    numberOfLines={1}
                    style={{ marginLeft: spacing[2], flexShrink: 0 }}
                  >
                    {formatWorkHours((now - moment(session.checkIn).valueOf()) / 3600000)}
                  </AppText>
                ) : session.workHours != null && (
                  <AppText
                    variant="caption"
                    color="tertiary"
                    numberOfLines={1}
                    style={{ marginLeft: spacing[2], flexShrink: 0 }}
                  >
                    {formatWorkHours(session.workHours)}
                  </AppText>
                )}
              </View>

              {isOpen && (
                <View style={[styles.liveBadge, { backgroundColor: palette.success.default + "22" }]}>
                  <View style={styles.liveBadgeDot} />
                  <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>
                    Live
                  </AppText>
                </View>
              )}
            </View>

            {breaks.map((b) => (
              <BreakRow key={b.key} gap={b.gap} isOver={isOverAll} />
            ))}
          </View>
        )
      })}
    </Container>
  )
}

const styles = StyleSheet.create({
  timeline: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  timelineScrollable: {
    maxHeight: 100,
  },
  timelineGroup: {
    gap: spacing[3],
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  liveBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.success.default,
  },
})
