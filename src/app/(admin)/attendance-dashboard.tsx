import { useState } from "react"
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native"
import { MotiView } from "moti"
import { Easing } from "react-native-reanimated"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import DatePickerField from "../../components/shared/DatePickerField"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { useAttendanceDashboard } from "../../hooks/useAttendanceDashboard"
import { toAPIDate } from "../../utils/helpers"
import type { AttendanceDashboardResponse } from "../../types"

// ─── stat tile ─────────────────────────────────────────────────────────────

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <AppCard elevation="sm" style={styles.statTile}>
      <AppText variant="caption" color="tertiary">{label}</AppText>
      <AppText variant="heading3" style={{ color }}>{value}</AppText>
    </AppCard>
  )
}

// ─── trend chart ────────────────────────────────────────────────────────────

function TrendBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  return (
    <MotiView
      from={{ height: "0%" }}
      animate={{ height: `${Math.max(pct, 2)}%` }}
      transition={{ type: "timing", duration: 600, delay, easing: Easing.out(Easing.cubic) }}
      style={[styles.trendBarFill, { backgroundColor: color }]}
    />
  )
}

function TrendChart({ trend }: { trend: AttendanceDashboardResponse["data"]["trend"] }) {
  const { colors } = useTheme()
  if (trend.length === 0) return null

  return (
    <AppCard elevation="sm" style={styles.card}>
      <AppText variant="bodyMedium" style={{ marginBottom: spacing[4] }}>Daily attendance rate</AppText>
      <View style={styles.trendRow}>
        {trend.map((day, i) => (
          <View key={day.date} style={styles.trendCol}>
            <View style={[styles.trendTrack, { backgroundColor: colors.border }]}>
              <TrendBar pct={day.attendanceRate} color={palette.primary[600]} delay={i * 20} />
            </View>
            <AppText variant="caption" color="tertiary" style={styles.trendLabel} numberOfLines={1}>
              {moment(day.date).format("D")}
            </AppText>
          </View>
        ))}
      </View>
    </AppCard>
  )
}

// ─── staff breakdown row ────────────────────────────────────────────────────

function StaffRow({ entry }: { entry: AttendanceDashboardResponse["data"]["staffBreakdown"][number] }) {
  const { colors } = useTheme()
  const rateColor =
    entry.attendanceRate >= 90 ? palette.success.default
    : entry.attendanceRate >= 75 ? palette.warning.default
    : palette.error.default

  return (
    <View style={[styles.staffRow, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" numberOfLines={1}>{entry.staffName}</AppText>
        <AppText variant="caption" color="tertiary">
          {entry.presentDays}P · {entry.lateDays}L · {entry.halfDayDays}HD · {entry.absentDays}A · {entry.onLeaveDays}OL
        </AppText>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <AppText variant="bodyMedium" style={{ color: rateColor }}>{entry.attendanceRate.toFixed(0)}%</AppText>
        <AppText variant="caption" color="tertiary">{entry.totalWorkHours.toFixed(1)}h</AppText>
        {entry.totalApprovedOvertimeMinutes > 0 && (
          <AppText variant="caption" style={{ color: palette.success.default }}>
            +{(entry.totalApprovedOvertimeMinutes / 60).toFixed(1)}h OT
          </AppText>
        )}
        {entry.totalPendingOvertimeMinutes > 0 && (
          <AppText variant="caption" style={{ color: palette.warning.default }}>
            {(entry.totalPendingOvertimeMinutes / 60).toFixed(1)}h OT pending
          </AppText>
        )}
        {entry.missedCheckoutDays > 0 && (
          <AppText variant="caption" style={{ color: palette.error.default }}>
            {entry.missedCheckoutDays} missed checkout{entry.missedCheckoutDays > 1 ? "s" : ""}
          </AppText>
        )}
        {(entry.totalTeaBreakExcessMinutes + entry.totalLunchBreakExcessMinutes) > 0 && (
          <AppText variant="caption" style={{ color: palette.warning.default }}>
            {entry.totalTeaBreakExcessMinutes + entry.totalLunchBreakExcessMinutes}m over break
          </AppText>
        )}
      </View>
    </View>
  )
}

// ─── flags section ───────────────────────────────────────────────────────────

function FlagsCard({ flags }: { flags: AttendanceDashboardResponse["data"]["flags"] }) {
  const { colors } = useTheme()
  const sections = [
    { key: "chronicallyLate", label: "Chronically Late", color: palette.warning.default, items: flags.chronicallyLate, suffix: (v: number) => `${v}d late` },
    { key: "excessiveOvertime", label: "Excessive Overtime", color: palette.info.default, items: flags.excessiveOvertime, suffix: (v: number) => `${(v / 60).toFixed(1)}h OT` },
    { key: "pendingOvertimeApprovals", label: "Pending Overtime Approvals", color: palette.warning.default, items: flags.pendingOvertimeApprovals, suffix: (v: number) => `${(v / 60).toFixed(1)}h pending` },
    { key: "frequentAbsentees", label: "Frequent Absentees", color: palette.error.default, items: flags.frequentAbsentees, suffix: (v: number) => `${v}d absent` },
    { key: "missedCheckouts", label: "Missed Checkouts", color: palette.error.default, items: flags.missedCheckouts, suffix: (v: number) => `${v}d missed` },
    { key: "excessiveBreaks", label: "Excessive Breaks", color: palette.warning.default, items: flags.excessiveBreaks, suffix: (v: number) => `${v}m over` },
  ] as const

  const anyFlags = sections.some((s) => s.items.length > 0)
  if (!anyFlags) return null

  return (
    <AppCard elevation="sm" style={styles.card}>
      <AppText variant="bodyMedium" style={{ marginBottom: spacing[3] }}>Flagged staff</AppText>
      <View style={{ gap: spacing[4] }}>
        {sections.filter((s) => s.items.length > 0).map((s) => (
          <View key={s.key}>
            <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>{s.label}</AppText>
            <View style={styles.pillRow}>
              {s.items.map((item: any) => (
                <View key={item.staffId} style={[styles.pill, { backgroundColor: s.color + "18", borderColor: colors.border }]}>
                  <AppText variant="caption" style={{ color: s.color, fontSize: 11 }}>
                    {item.staffName} · {s.suffix(item.lateDays ?? item.totalApprovedOvertimeMinutes ?? item.totalPendingOvertimeMinutes ?? item.absentDays ?? item.missedCheckoutDays ?? item.totalBreakExcessMinutes)}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </AppCard>
  )
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AttendanceDashboardScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const [startDate, setStartDate] = useState<Date>(moment().startOf("month").toDate())
  const [endDate, setEndDate] = useState<Date>(moment().toDate())

  const { data, isLoading, isError, refetch, isRefetching } = useAttendanceDashboard(
    toAPIDate(startDate),
    toAPIDate(endDate)
  )
  const dash = data?.data

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Attendance Dashboard</AppText>
          <AppText variant="caption" color="tertiary">Trends, breakdown &amp; flags</AppText>
        </View>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }}>
        <View style={[styles.dateRow, !isTablet && styles.dateRowMobile]}>
          <View style={{ flex: 1 }}>
            <DatePickerField label="From" value={startDate} onChange={setStartDate} />
          </View>
          <View style={{ flex: 1 }}>
            <DatePickerField label="To" value={endDate} onChange={setEndDate} />
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
        ) : isError ? (
          <View style={styles.center}>
            <AppText color="secondary">Couldn't load the attendance dashboard.</AppText>
          </View>
        ) : dash ? (
          <>
            <View style={styles.statRow}>
              <StatTile label="Present" value={String(dash.summary.totalPresent)} color={palette.success.default} />
              <StatTile label="Late" value={String(dash.summary.totalLate)} color={palette.warning.default} />
              <StatTile label="Half-day" value={String(dash.summary.totalHalfDay)} color={palette.info.default} />
              <StatTile label="Absent" value={String(dash.summary.totalAbsent)} color={palette.error.default} />
              <StatTile label="On Leave" value={String(dash.summary.totalOnLeave)} color={palette.neutral[500]} />
            </View>
            <View style={styles.statRow}>
              <StatTile label="Attendance Rate" value={`${dash.summary.overallAttendanceRate.toFixed(1)}%`} color={colors.text.primary as string} />
              <StatTile label="Total Staff" value={String(dash.totalStaff)} color={colors.text.primary as string} />
            </View>

            <TrendChart trend={dash.trend} />

            <FlagsCard flags={dash.flags} />

            <AppCard elevation="sm" style={styles.card}>
              <AppText variant="bodyMedium" style={{ marginBottom: spacing[2] }}>Staff breakdown</AppText>
              <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>
                Sorted by attendance rate, lowest first
              </AppText>
              {dash.staffBreakdown.map((entry) => (
                <StaffRow key={entry.staffId} entry={entry} />
              ))}
            </AppCard>
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  dateRowMobile: {
    flexDirection: "column",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
  statRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statTile: {
    flex: 1,
    gap: spacing[1],
  },
  card: {
    marginBottom: spacing[3],
  },

  trendRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 140,
  },
  trendCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    gap: spacing[1],
  },
  trendTrack: {
    width: "100%",
    flex: 1,
    borderRadius: radii.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  trendBarFill: {
    width: "100%",
    borderRadius: radii.sm,
  },
  trendLabel: {
    fontSize: 9,
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  pill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },

  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})
