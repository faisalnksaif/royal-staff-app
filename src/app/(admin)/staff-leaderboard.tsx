import { useState } from "react"
import { View, ScrollView, StyleSheet, Pressable } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import BackButton from "../../components/shared/BackButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import StaffLeaderboardRow from "../../components/shared/StaffLeaderboardRow"
import StaffLeaderboardSkeleton from "../../components/shared/StaffLeaderboardSkeleton"
import DashboardFilterBar, { type DashboardPeriodValue } from "../../components/shared/DashboardFilterBar"
import type { ResolutionStatus } from "../../services/dashboardService"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing } from "../../constants/theme"
import { useDashboardOverview } from "../../hooks/useDashboardOverview"
import { toAPIDate } from "../../utils/helpers"
import type { FollowupDateField } from "../../services/followupService"
import type { FollowUpOutcome } from "../../types"

function isDashboardPeriod(value: unknown): value is DashboardPeriodValue {
  return value === "today" || value === "yesterday" || value === "this_month" || value === "custom"
}

function isDateField(value: unknown): value is FollowupDateField {
  return value === "loggedAt" || value === "promisedDate" || value === "resolvedAt"
}

function isOutcome(value: unknown): value is FollowUpOutcome {
  return value === "promisedToPay" || value === "promisedPartial" || value === "dispute" || value === "noResponse" || value === "reminderSent"
}

function parseParamDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function StaffLeaderboardScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{
    period?: string
    startDate?: string
    endDate?: string
    dateField?: string
    outcome?: string
  }>()
  const [period, setPeriod] = useState<DashboardPeriodValue>(
    isDashboardPeriod(params.period) ? params.period : "this_month"
  )
  const [startDate, setStartDate] = useState<Date | null>(parseParamDate(params.startDate))
  const [endDate, setEndDate] = useState<Date | null>(parseParamDate(params.endDate))
  const [dateField, setDateField] = useState<FollowupDateField>(
    isDateField(params.dateField) ? params.dateField : "loggedAt"
  )
  const [outcome, setOutcome] = useState<FollowUpOutcome | "all">(
    isOutcome(params.outcome) ? params.outcome : "all"
  )
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus | "all">("all")

  const isCustom = period === "custom"

  const { data, isLoading, isError, refetch } = useDashboardOverview({
    period: isCustom ? undefined : period,
    startDate: isCustom && startDate ? toAPIDate(startDate) : undefined,
    endDate: isCustom && endDate ? toAPIDate(endDate) : undefined,
    dateField,
    outcome: outcome === "all" ? undefined : outcome,
    resolutionStatus: resolutionStatus === "all" ? undefined : resolutionStatus,
  })
  const leaderboard = data?.data.staff_leaderboard ?? []

  function goToStaffFollowups(userId: number, staffName: string) {
    router.push({
      pathname: "/(admin)/staff-followups",
      params: {
        staffId: userId,
        staffName,
        period,
        startDate: isCustom && startDate ? toAPIDate(startDate) : undefined,
        endDate: isCustom && endDate ? toAPIDate(endDate) : undefined,
        dateField,
        outcome,
      },
    })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <AppText variant="heading3">Staff Leaderboard</AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <DashboardFilterBar
          period={period}
          onPeriodChange={setPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          dateField={dateField}
          onDateFieldChange={setDateField}
          outcome={outcome}
          onOutcomeChange={setOutcome}
          resolutionStatus={resolutionStatus}
          onResolutionStatusChange={setResolutionStatus}
        />
      </View>

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          <StaffLeaderboardSkeleton />
        </ScrollView>
      ) : isError ? (
        <View style={styles.centerBox}>
          <AppText variant="body" color="secondary">Couldn't load the leaderboard.</AppText>
          <Pressable onPress={() => refetch()} style={styles.cursorPointer}>
            <AppText variant="bodyMedium" color="accent">Retry</AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <AppCard elevation="sm">
            {leaderboard.map((entry, index) => (
              <Pressable
                key={entry.staff_id}
                onPress={() => goToStaffFollowups(entry.user_id, entry.staff_name)}
                style={styles.cursorPointer}
              >
                <StaffLeaderboardRow rank={index} entry={entry} accent={colors.accent} />
              </Pressable>
            ))}
          </AppCard>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cursorPointer: {
    cursor: "pointer",
  },
  header: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  listContent: {
    padding: spacing[4],
  },
})
