import { useMemo, useState } from "react"
import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import moment from "moment"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  Settings2,
  Building2,
} from "lucide-react-native"
import BackButton from "../../../components/shared/BackButton"
import AppText from "../../../components/ui/AppText"
import AppCard from "../../../components/ui/AppCard"
import AppButton from "../../../components/ui/AppButton"
import AppInput from "../../../components/ui/AppInput"
import { useTheme } from "../../../providers/ThemeProvider"
import { useTablet } from "../../../hooks/useTablet"
import { spacing, radii } from "../../../constants/theme"
import { scoreService } from "../../../services/scoreService"
import type { ScoringConfig, ScoringConfigUpdatePayload, ScoringRubricRule } from "../../../types"

const DEPARTMENTS = ["Store", "Plywood Godown", "Glass Godown"] as const

// The rubric's ruleKeys map 1:1 to ScoringConfig keys now (timeKeeping, attendanceLeave
// replaced the legacy attendance/leaves keys as the editable rule sections).
function configKeyFor(ruleKey: string): string {
  return ruleKey
}

const STORE_DEPARTMENT = "Store"

// customerDealing is stored under one config key, but Store staff are scored from customer
// feedback (pointsPerBadFeedback) while everyone else is scored from the daily check
// (mode + pointsPerBadDay) - pick which field set/mode-default applies per department.
function fieldsKeyFor(configKey: string, department: string): string {
  if (configKey === "customerDealing" && department !== STORE_DEPARTMENT) {
    return "customerDealingDailyCheck"
  }
  return configKey
}

type FieldDef = {
  key: string
  label: string
  hint?: string
}

// Field-set keys (see fieldsKeyFor) that support a "flat" (forfeit once) vs
// "perDay"/"perExcess" (recurring) mode.
const MODE_KEYS = new Set([
  "timeKeeping",
  "appearance",
  "cleaning",
  "welcomingCustomer",
  "customerDealingDailyCheck",
  "customerQuotationFollowup",
  "stockMaintenance",
  "salesReturnHandling",
  "wastage",
  "stockTaking",
  "workflowStatus",
])

// attendanceLeave has a nested casual/medical shape and is rendered by its own
// dedicated section rather than the generic flat field list.
const NESTED_LEAVE_KEY = "attendanceLeave"

// Which numeric/boolean fields to expose per config key, in display order.
// "mode" fields are rendered separately as a Flat/Daily toggle, not a text input.
const FIELDS_BY_CONFIG_KEY: Record<string, FieldDef[]> = {
  timeKeeping: [
    { key: "maxLateCases", label: "Max late case-days allowed" },
    { key: "pointsIfWithinLimit", label: "Points if within limit" },
    { key: "penaltyIfExceeds", label: "Penalty if exceeded", hint: "Applied once when mode is Flat" },
    { key: "pointsPerExtraCase", label: "Points per extra case-day", hint: "Used when mode is Daily" },
  ],
  appearance: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerViolation", label: "Points per violation", hint: "Deducted per the mode below" },
  ],
  cleaning: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
  welcomingCustomer: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
  customerDealing: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadFeedback", label: "Points lost per bad feedback", hint: "Store department only" },
  ],
  // Non-Store departments score customerDealing from the daily check instead of
  // customer feedback, so they get pointsPerBadDay + a mode toggle instead.
  customerDealingDailyCheck: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
  customerQuotationFollowup: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadMark", label: "Points lost per bad day", hint: "Deducted per the mode below" },
  ],
  meeting: [
    { key: "maxPoints", label: "Max points" },
    { key: "maxMissedAllowed", label: "Max missed meetings allowed" },
  ],
  extraPerformance: [
    { key: "maxPointsAllowed", label: "Max points allowed / month" },
    { key: "pointsPerPerformance", label: "Points per approved entry" },
  ],
  testimonial: [
    { key: "maxPointsAllowed", label: "Max points allowed / month" },
    { key: "pointsPerTestimonial", label: "Points per approved testimonial" },
  ],
  stockMaintenance: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
  salesReturnHandling: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
  wastage: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
  stockTaking: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
  workflowStatus: [
    { key: "maxPoints", label: "Max points" },
    { key: "pointsPerBadDay", label: "Points per bad day", hint: "Deducted per the mode below" },
  ],
}

// Matches each config key's documented `mode` default in swagger.yaml. The "recurring"
// value's literal name differs per key (perDay vs perExcess) but always pairs with "flat".
const DEFAULT_MODE_BY_CONFIG_KEY: Record<string, string> = {
  timeKeeping: "flat",
  attendanceLeave: "flat",
  appearance: "perDay",
  cleaning: "flat",
  welcomingCustomer: "flat",
  customerDealingDailyCheck: "flat",
  customerQuotationFollowup: "perDay",
  stockMaintenance: "flat",
  salesReturnHandling: "flat",
  wastage: "flat",
  stockTaking: "flat",
  workflowStatus: "flat",
}

const RECURRING_MODE_BY_CONFIG_KEY: Record<string, string> = {
  timeKeeping: "perExcess",
  attendanceLeave: "perExcess",
  appearance: "perDay",
  cleaning: "perDay",
  welcomingCustomer: "perDay",
  customerDealingDailyCheck: "perDay",
  customerQuotationFollowup: "perDay",
  stockMaintenance: "perDay",
  salesReturnHandling: "perDay",
  wastage: "perDay",
  stockTaking: "perDay",
  workflowStatus: "perDay",
}

type DraftValues = Record<string, Record<string, string>>

// attendanceLeave's casual/medical sub-fields are stored in the draft as dotted keys
// ("casual.maxAllowedPerMonth") since the generic draft shape is flat per config key.
const LEAVE_TYPE_FIELDS: Record<"casual" | "medical", FieldDef[]> = {
  casual: [
    { key: "maxAllowedPerMonth", label: "Max casual leaves / month" },
    { key: "pointsIfWithinLimit", label: "Points if within limit" },
    { key: "penaltyIfExceeds", label: "Penalty if exceeded", hint: "Applied once when mode is Flat" },
    { key: "pointsPerExtraLeave", label: "Points per extra leave", hint: "Used when mode is Daily" },
  ],
  medical: [
    { key: "maxAllowedPerMonth", label: "Max medical leaves / month", hint: "Beyond this, proof is required to avoid penalty" },
    { key: "penaltyIfExceeds", label: "Penalty if exceeded", hint: "Applied once when mode is Flat" },
    { key: "pointsPerExtraLeave", label: "Points per extra leave", hint: "Used when mode is Daily" },
  ],
}

function buildDraftFromConfig(
  config: ScoringConfig | undefined,
  rules: ScoringRubricRule[],
  department: string
): DraftValues {
  const draft: DraftValues = {}
  rules.forEach((rule) => {
    const configKey = configKeyFor(rule.ruleKey)
    const section = (config as any)?.[configKey] ?? {}
    draft[configKey] = {}

    if (configKey === NESTED_LEAVE_KEY) {
      ;(["casual", "medical"] as const).forEach((type) => {
        const typeSection = section[type] ?? {}
        LEAVE_TYPE_FIELDS[type].forEach((f) => {
          const value = typeSection[f.key]
          draft[configKey][`${type}.${f.key}`] = value === undefined || value === null ? "" : String(value)
        })
      })
      draft[configKey].mode = section.mode ?? DEFAULT_MODE_BY_CONFIG_KEY[configKey] ?? "flat"
      return
    }

    const fieldsKey = fieldsKeyFor(configKey, department)
    const fields = FIELDS_BY_CONFIG_KEY[fieldsKey] ?? []
    fields.forEach((f) => {
      const value = section[f.key]
      draft[configKey][f.key] = value === undefined || value === null ? "" : String(value)
    })
    if (MODE_KEYS.has(fieldsKey)) {
      draft[configKey].mode = section.mode ?? DEFAULT_MODE_BY_CONFIG_KEY[fieldsKey]
    }
  })
  return draft
}

function buildPayload(month: string, department: string, draft: DraftValues): ScoringConfigUpdatePayload {
  const payload: any = { month, department }
  Object.entries(draft).forEach(([configKey, fields]) => {
    if (configKey === NESTED_LEAVE_KEY) {
      const section: any = { casual: {}, medical: {} }
      Object.entries(fields).forEach(([fieldKey, value]) => {
        if (fieldKey === "mode") {
          section.mode = value
          return
        }
        const [type, subKey] = fieldKey.split(".")
        const parsed = Number(value)
        section[type][subKey] = Number.isFinite(parsed) ? parsed : 0
      })
      payload[configKey] = section
      return
    }

    const section: Record<string, number | string> = {}
    Object.entries(fields).forEach(([fieldKey, value]) => {
      if (fieldKey === "mode") {
        section.mode = value
        return
      }
      const parsed = Number(value)
      section[fieldKey] = Number.isFinite(parsed) ? parsed : 0
    })
    payload[configKey] = section
  })
  return payload
}

function ModeToggle({
  value,
  recurringMode,
  onChange,
}: {
  value: string
  recurringMode: string
  onChange: (mode: string) => void
}) {
  const { colors } = useTheme()
  const options = [
    { key: "flat", label: "Flat", hint: "Forfeited once, first excess/bad day" },
    { key: recurringMode, label: "Daily", hint: "Deducted for every excess/bad day, recurring" },
  ]

  return (
    <View style={styles.fieldRow}>
      <AppText variant="label" color="secondary" style={{ marginBottom: spacing[1] }}>
        Deduction mode
      </AppText>
      <View style={[styles.modeToggle, { borderColor: colors.border }]}>
        {options.map((opt) => {
          const active = value === opt.key
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[
                styles.modeOption,
                active && { backgroundColor: colors.accent + "18" },
              ]}
            >
              <AppText
                variant={active ? "bodyMedium" : "body"}
                style={{ color: active ? colors.accent : colors.text.secondary, fontSize: 13 }}
              >
                {opt.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>
      <AppText variant="caption" color="tertiary" style={{ fontSize: 10, marginTop: spacing[1] }}>
        {options.find((o) => o.key === value)?.hint}
      </AppText>
    </View>
  )
}

function RuleCard({
  rule,
  values,
  department,
  onChange,
}: {
  rule: ScoringRubricRule
  values: Record<string, string>
  department: string
  onChange: (fieldKey: string, value: string) => void
}) {
  const { colors } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const configKey = configKeyFor(rule.ruleKey)
  const isNestedLeave = configKey === NESTED_LEAVE_KEY
  const fieldsKey = fieldsKeyFor(configKey, department)
  const fields = isNestedLeave ? [] : FIELDS_BY_CONFIG_KEY[fieldsKey] ?? []
  const hasMode = MODE_KEYS.has(fieldsKey) || isNestedLeave

  return (
    <AppCard elevation="sm" style={styles.ruleCard}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.ruleHeader}>
        <View style={styles.ruleHeaderLeft}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
            <AppText variant="bodyMedium" numberOfLines={1}>
              {rule.category}
            </AppText>
            {hasMode && (
              <View style={[styles.modeBadge, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
                <AppText variant="caption" color="tertiary" style={{ fontSize: 10 }}>
                  {values.mode === "flat" ? "Flat" : "Daily"}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="caption" color="tertiary" style={{ fontSize: 11, marginTop: 1 }}>
            Max {rule.maxPoints} pts
          </AppText>
        </View>
        <ChevronDown
          size={16}
          color={colors.text.tertiary}
          strokeWidth={2}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {expanded && isNestedLeave && (
        <View style={[styles.ruleFields, { borderTopColor: colors.border }]}>
          {(["casual", "medical"] as const).map((type) => (
            <View key={type} style={{ gap: spacing[3] }}>
              <AppText variant="bodyMedium" style={{ fontSize: 12, textTransform: "capitalize" }}>
                {type} leave
              </AppText>
              {LEAVE_TYPE_FIELDS[type].map((f) => (
                <View key={f.key} style={styles.fieldRow}>
                  <AppInput
                    label={f.label}
                    keyboardType="number-pad"
                    value={values[`${type}.${f.key}`] ?? ""}
                    onChangeText={(t) => onChange(`${type}.${f.key}`, t.replace(/[^0-9-]/g, ""))}
                  />
                  {f.hint && (
                    <AppText variant="caption" color="tertiary" style={{ fontSize: 10, marginTop: -spacing[2] }}>
                      {f.hint}
                    </AppText>
                  )}
                </View>
              ))}
            </View>
          ))}
          <ModeToggle
            value={values.mode ?? "flat"}
            recurringMode={RECURRING_MODE_BY_CONFIG_KEY[configKey] ?? "perExcess"}
            onChange={(mode) => onChange("mode", mode)}
          />
        </View>
      )}

      {expanded && !isNestedLeave && (fields.length > 0 || hasMode) && (
        <View style={[styles.ruleFields, { borderTopColor: colors.border }]}>
          {fields.map((f) => (
            <View key={f.key} style={styles.fieldRow}>
              <AppInput
                label={f.label}
                keyboardType="number-pad"
                value={values[f.key] ?? ""}
                onChangeText={(t) => onChange(f.key, t.replace(/[^0-9-]/g, ""))}
              />
              {f.hint && (
                <AppText variant="caption" color="tertiary" style={{ fontSize: 10, marginTop: -spacing[2] }}>
                  {f.hint}
                </AppText>
              )}
            </View>
          ))}
          {hasMode && (
            <ModeToggle
              value={values.mode ?? "flat"}
              recurringMode={RECURRING_MODE_BY_CONFIG_KEY[fieldsKey] ?? "perDay"}
              onChange={(mode) => onChange("mode", mode)}
            />
          )}
        </View>
      )}

      {expanded && !isNestedLeave && fields.length === 0 && !hasMode && (
        <View style={[styles.ruleFields, { borderTopColor: colors.border }]}>
          <AppText variant="caption" color="tertiary">
            No editable parameters for this rule.
          </AppText>
        </View>
      )}
    </AppCard>
  )
}

export default function ScoringDepartmentsScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()

  const [department, setDepartment] = useState<(typeof DEPARTMENTS)[number]>("Store")
  const [month, setMonth] = useState(() => moment().startOf("month"))
  const [draft, setDraft] = useState<DraftValues | null>(null)

  const monthParam = month.format("YYYY-MM")
  const isCurrentMonth = month.isSame(moment(), "month")

  const { data: rubricData, isLoading: rubricLoading } = useQuery({
    queryKey: ["scoring-rubrics"],
    queryFn: () => scoreService.getDepartmentRubrics(),
  })

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["scoring-config", monthParam, department],
    queryFn: () => scoreService.getScoringConfig(monthParam, department),
    retry: false,
  })

  const rules = useMemo(() => rubricData?.data?.[department] ?? [], [rubricData, department])
  const config = configData?.data

  const currentDraft = useMemo(() => {
    if (draft) return draft
    return buildDraftFromConfig(config, rules, department)
  }, [draft, config, rules, department])

  const totalMaxPoints = useMemo(() => rules.reduce((sum, r) => sum + r.maxPoints, 0), [rules])

  const saveMutation = useMutation({
    mutationFn: (payload: ScoringConfigUpdatePayload) => scoreService.updateScoringConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-config", monthParam, department] })
      setDraft(null)
    },
  })

  function selectDepartment(dept: (typeof DEPARTMENTS)[number]) {
    setDepartment(dept)
    setDraft(null)
  }

  function updateField(configKey: string, fieldKey: string, value: string) {
    setDraft((prev) => {
      const base = prev ?? buildDraftFromConfig(config, rules, department)
      return {
        ...base,
        [configKey]: { ...(base[configKey] ?? {}), [fieldKey]: value },
      }
    })
  }

  function handleReset() {
    setDraft(null)
  }

  function handleSave() {
    const payload = buildPayload(monthParam, department, currentDraft)
    saveMutation.mutate(payload)
  }

  const isLoading = rubricLoading || configLoading
  const hasChanges = draft !== null

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {!isTablet && <BackButton />}
          <View>
            <AppText variant="heading3">Scoring Rules</AppText>
            <AppText variant="caption" color="tertiary">
              Configure the rubric per department
            </AppText>
          </View>
        </View>

        {/* Month navigator */}
        <View style={[styles.monthNav, { backgroundColor: colors.background.secondary, borderColor: colors.border }]}>
          <Pressable
            onPress={() => {
              setMonth((m) => m.clone().subtract(1, "month"))
              setDraft(null)
            }}
            style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.5 : 1 }]}
            hitSlop={8}
          >
            <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
          <AppText variant="bodyMedium" style={{ minWidth: 88, textAlign: "center" }}>
            {month.format("MMM YYYY")}
          </AppText>
          <Pressable
            onPress={() => {
              if (isCurrentMonth) return
              setMonth((m) => m.clone().add(1, "month"))
              setDraft(null)
            }}
            style={({ pressed }) => [styles.navBtn, { opacity: isCurrentMonth || pressed ? 0.3 : 1 }]}
            hitSlop={8}
            disabled={isCurrentMonth}
          >
            <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Department tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        {DEPARTMENTS.map((dept) => {
          const active = dept === department
          return (
            <Pressable
              key={dept}
              onPress={() => selectDepartment(dept)}
              style={[
                styles.tab,
                active && { backgroundColor: colors.accent + "18", borderColor: colors.accent },
                !active && { borderColor: colors.border },
              ]}
            >
              <Building2 size={14} color={active ? colors.accent : colors.text.tertiary} strokeWidth={1.75} />
              <AppText
                variant={active ? "bodyMedium" : "body"}
                style={{ color: active ? colors.accent : colors.text.secondary, fontSize: 13 }}
              >
                {dept}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {/* Summary strip */}
      <View style={[styles.summaryStrip, { backgroundColor: colors.background.secondary, borderBottomColor: colors.border }]}>
        <Settings2 size={14} color={colors.text.tertiary} strokeWidth={1.75} />
        <AppText variant="caption" color="secondary">
          {rules.length} rule{rules.length === 1 ? "" : "s"} · {totalMaxPoints} pts total
        </AppText>
        {hasChanges && (
          <>
            <View style={styles.dot} />
            <AppText variant="caption" style={{ color: colors.accent }}>
              Unsaved changes
            </AppText>
          </>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : rules.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText color="tertiary">No rubric defined for {department}.</AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {rules.map((rule) => {
            const configKey = configKeyFor(rule.ruleKey)
            return (
              <RuleCard
                key={rule.ruleKey}
                rule={rule}
                values={currentDraft[configKey] ?? {}}
                department={department}
                onChange={(fieldKey, value) => updateField(configKey, fieldKey, value)}
              />
            )
          })}
        </ScrollView>
      )}

      {/* Footer actions */}
      {rules.length > 0 && (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background.primary }]}>
          <AppButton
            label="Reset"
            variant="ghost"
            onPress={handleReset}
            disabled={!hasChanges || saveMutation.isPending}
            style={{ flex: 1 }}
          />
          <AppButton
            label={saveMutation.isPending ? "Saving..." : "Save changes"}
            onPress={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            isLoading={saveMutation.isPending}
            style={{ flex: 2 }}
          />
        </View>
      )}
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
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  navBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  tabsRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: "wrap",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#94A3B8" },
  center: { alignItems: "center", justifyContent: "center", paddingTop: spacing[16] },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: spacing[16] },
  list: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[3] },
  ruleCard: { padding: 0, overflow: "hidden" },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  ruleHeaderLeft: { flex: 1 },
  ruleFields: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  fieldRow: { gap: spacing[1] },
  modeToggle: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  modeOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[2],
  },
  modeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
