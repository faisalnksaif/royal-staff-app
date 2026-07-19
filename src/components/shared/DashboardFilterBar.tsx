import { useState } from "react"
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { SlidersHorizontal } from "lucide-react-native"
import AppText from "../ui/AppText"
import DatePickerField from "./DatePickerField"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"
import type { DashboardPeriod, ResolutionStatus } from "../../services/dashboardService"
import type { FollowupDateField } from "../../services/followupService"
import type { FollowUpOutcome } from "../../types"

export type DashboardPeriodValue = DashboardPeriod | "custom"

const PERIOD_CHIPS: { value: DashboardPeriodValue; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom" },
]

const DATE_FIELD_CHIPS: { value: FollowupDateField; label: string }[] = [
  { value: "loggedAt", label: "Logged date" },
  { value: "promisedDate", label: "Promised date" },
  { value: "resolvedAt", label: "Paid date" },
]

const RESOLUTION_CHIPS: { value: ResolutionStatus | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "resolved", label: "Paid" },
  { value: "open",     label: "Open" },
]

const OUTCOME_CHIPS: { value: FollowUpOutcome | "all"; label: string }[] = [
  { value: "all", label: "All outcomes" },
  { value: "promisedToPay", label: "Promised Full" },
  { value: "promisedPartial", label: "Promised Partial" },
  { value: "noResponse", label: "No Response" },
  { value: "dispute", label: "Dispute" },
]

export interface DashboardFilterBarProps {
  period: DashboardPeriodValue
  onPeriodChange: (p: DashboardPeriodValue) => void
  startDate: Date | null
  onStartDateChange: (d: Date) => void
  endDate: Date | null
  onEndDateChange: (d: Date) => void
  dateField: FollowupDateField
  onDateFieldChange: (f: FollowupDateField) => void
  outcome: FollowUpOutcome | "all"
  onOutcomeChange: (o: FollowUpOutcome | "all") => void
  resolutionStatus: ResolutionStatus | "all"
  onResolutionStatusChange: (r: ResolutionStatus | "all") => void
}

export default function DashboardFilterBar({
  period,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  dateField,
  onDateFieldChange,
  outcome,
  onOutcomeChange,
  resolutionStatus,
  onResolutionStatusChange,
}: DashboardFilterBarProps) {
  const { colors } = useTheme()
  const [showMore, setShowMore] = useState(false)

  const advancedActive = dateField !== "loggedAt" || outcome !== "all" || resolutionStatus !== "all"

  return (
    <View>
      <View style={styles.topRow}>
        <View style={styles.chipRow}>
          {PERIOD_CHIPS.map((chip) => {
            const active = chip.value === period
            return (
              <TouchableOpacity
                key={chip.value}
                activeOpacity={0.7}
                onPress={() => onPeriodChange(chip.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.accent + "22" : colors.background.secondary,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <AppText variant="caption" style={{ color: active ? colors.accent : colors.text.secondary }}>
                  {chip.label}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowMore((v) => !v)}
          style={[
            styles.moreBtn,
            {
              backgroundColor: showMore ? colors.accent : colors.background.secondary,
              borderColor: advancedActive ? colors.accent : colors.border,
            },
          ]}
        >
          <SlidersHorizontal
            size={14}
            color={showMore ? "#fff" : advancedActive ? colors.accent : colors.text.secondary}
            strokeWidth={1.75}
          />
        </TouchableOpacity>
      </View>

      {period === "custom" && (
        <View style={styles.dateRangeRow}>
          <View style={{ flex: 1 }}>
            <DatePickerField label="From" value={startDate} onChange={onStartDateChange} placeholder="Start date" />
          </View>
          <View style={{ flex: 1 }}>
            <DatePickerField label="To" value={endDate} onChange={onEndDateChange} placeholder="End date" />
          </View>
        </View>
      )}

      {showMore && (
        <View style={styles.advancedPanel}>
          <AppText variant="caption" color="tertiary" style={styles.filterLabel}>FILTER BY</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DATE_FIELD_CHIPS.map((chip) => {
              const active = chip.value === dateField
              return (
                <TouchableOpacity
                  key={chip.value}
                  activeOpacity={0.7}
                  onPress={() => onDateFieldChange(chip.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent + "22" : colors.background.secondary,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <AppText variant="caption" style={{ color: active ? colors.accent : colors.text.secondary }}>
                    {chip.label}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <AppText variant="caption" color="tertiary" style={styles.filterLabel}>OUTCOME</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {OUTCOME_CHIPS.map((chip) => {
              const active = chip.value === outcome
              return (
                <TouchableOpacity
                  key={chip.value}
                  activeOpacity={0.7}
                  onPress={() => onOutcomeChange(chip.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent + "22" : colors.background.secondary,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <AppText variant="caption" style={{ color: active ? colors.accent : colors.text.secondary }}>
                    {chip.label}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <AppText variant="caption" color="tertiary" style={styles.filterLabel}>RESOLUTION</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {RESOLUTION_CHIPS.map((chip) => {
              const active = chip.value === resolutionStatus
              return (
                <TouchableOpacity
                  key={chip.value}
                  activeOpacity={0.7}
                  onPress={() => onResolutionStatusChange(chip.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accent + "22" : colors.background.secondary,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <AppText variant="caption" style={{ color: active ? colors.accent : colors.text.secondary }}>
                    {chip.label}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing[2],
    flexWrap: "wrap",
    flexShrink: 1,
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    cursor: "pointer",
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[3],
  },
  advancedPanel: {
    marginTop: spacing[3],
    gap: spacing[1],
  },
  filterLabel: {
    marginTop: spacing[3],
    marginBottom: spacing[1],
    letterSpacing: 0.5,
  },
})
