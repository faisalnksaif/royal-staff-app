import { View, StyleSheet, Pressable } from "react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { formatAmount } from "../../utils/helpers"
import type {
  PayslipIncentiveDetail,
  PayslipPenaltyDetail,
  PayslipDeductionDetail,
  PayslipOvertimeDetail,
  PayslipBreakExcessDetail,
  PayslipEarlyCheckoutDetail,
  PayslipLateArrivalDetail,
} from "../../types"

/**
 * The itemised pay breakdown, shared by the admin payslip list, the staff's
 * own payslips, and the month-to-date preview, so all three explain a figure
 * the same way.
 *
 * Deliberately mirrors the arithmetic in SalaryService.computePayroll:
 *
 *   basicPayEarned = basicPay - attendance deductions
 *   grossPay       = basicPayEarned + overtimePay - breakExcessDeduction
 *                    - earlyCheckoutDeduction - lateArrivalDeduction
 *                    + incentives + leaveEncashment
 *   netPay         = grossPay - penalties - advances
 *
 * Basic and incentives are shown as separate strands because they behave
 * differently - absence reduces basic only, and never claws back incentives
 * already earned in the month. Overtime is its own strand too: only approved
 * minutes are paid, and pending minutes are shown so they aren't missed.
 * Break excess sits right under overtime because it comes out of overtime
 * first (then basic); waived minutes are shown but not charged. Early
 * checkout follows it, charged the same way.
 */

/** "2026-09-02" -> "Wed, 2 Sep"; anything that isn't an ISO date passes through. */
function formatDay(date: string): string {
  const m = moment(date, "YYYY-MM-DD", true)
  return m.isValid() ? m.format("ddd, D MMM") : date
}

/** 90 -> "1h 30m", 45 -> "45m". */
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export interface PayBreakdownProps {
  basicPay: number
  basicPayEarned: number
  deductionAmount: number
  deductionDetails?: PayslipDeductionDetail[]
  incentives: number
  incentiveDetails?: PayslipIncentiveDetail[]
  /** December only: unused paid leave paid out at year end. */
  leaveEncashmentAmount?: number
  leaveEncashmentDays?: number
  overtimePay?: number
  overtimeMinutes?: number
  hourlyRate?: number
  overtimeDetails?: PayslipOvertimeDetail[]
  pendingOvertimeMinutes?: number
  breakExcessDeduction?: number
  breakExcessMinutes?: number
  breakExcessDetails?: PayslipBreakExcessDetail[]
  waivedBreakExcessMinutes?: number
  earlyCheckoutDeduction?: number
  earlyCheckoutMinutes?: number
  earlyCheckoutDetails?: PayslipEarlyCheckoutDetail[]
  lateArrivalDeduction?: number
  lateArrivalMinutes?: number
  lateArrivalDetails?: PayslipLateArrivalDetail[]
  penaltyAmount: number
  penaltyDetails?: PayslipPenaltyDetail[]
  advanceDeducted: number
  grossPay: number
  netPay: number
  /** Show every contributing line, not just the totals. */
  expanded?: boolean
  /** Makes the pending-overtime note a link, e.g. to where it can be approved. */
  onPendingOvertimePress?: () => void
}

function Row({
  label,
  amount,
  sign,
  emphasis,
  indent,
  total,
}: {
  label: string
  amount: number
  sign?: "plus" | "minus"
  emphasis?: boolean
  indent?: boolean
  /** The closing net-pay line - tinted, no rule underneath. */
  total?: boolean
}) {
  const { colors } = useTheme()
  const amountColor =
    sign === "minus" ? palette.error.default : emphasis ? colors.accent : colors.text.primary
  const prefix = sign === "minus" ? "−" : sign === "plus" ? "+" : ""
  const variant = emphasis ? "bodyMedium" : indent ? "bodySmall" : "body"

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.border as string },
        indent && [styles.rowIndent, { backgroundColor: colors.background.secondary }],
        total && [styles.rowTotal, { backgroundColor: colors.accent + "14" }],
      ]}
    >
      <AppText
        variant={variant}
        color={indent ? "secondary" : emphasis ? "primary" : "secondary"}
        style={{ flex: 1 }}
        numberOfLines={2}
      >
        {label}
      </AppText>
      <AppText
        variant={variant}
        style={[styles.amount, { color: indent ? (colors.text.secondary as string) : amountColor }]}
      >
        {prefix}₹{formatAmount(Math.abs(amount))}
      </AppText>
    </View>
  )
}

/** A caption line inside the table (pending overtime, waived break). */
function Note({ children, color, onPress }: { children: React.ReactNode; color?: string; onPress?: () => void }) {
  const { colors } = useTheme()
  const text = (
    <AppText variant="caption" color={color ? undefined : "tertiary"} style={color ? { color } : undefined}>
      {children}
    </AppText>
  )
  const style = [styles.note, { borderBottomColor: colors.border as string }]
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={4} style={style}>
      {text}
    </Pressable>
  ) : (
    <View style={style}>{text}</View>
  )
}

export default function PayBreakdown({
  basicPay,
  basicPayEarned,
  deductionAmount,
  deductionDetails = [],
  incentives,
  incentiveDetails = [],
  leaveEncashmentAmount = 0,
  leaveEncashmentDays = 0,
  overtimePay = 0,
  overtimeMinutes = 0,
  hourlyRate = 0,
  overtimeDetails = [],
  pendingOvertimeMinutes = 0,
  breakExcessDeduction = 0,
  breakExcessMinutes = 0,
  breakExcessDetails = [],
  waivedBreakExcessMinutes = 0,
  earlyCheckoutDeduction = 0,
  earlyCheckoutMinutes = 0,
  earlyCheckoutDetails = [],
  lateArrivalDeduction = 0,
  lateArrivalMinutes = 0,
  lateArrivalDetails = [],
  penaltyAmount,
  penaltyDetails = [],
  advanceDeducted,
  grossPay,
  netPay,
  expanded = false,
  onPendingOvertimePress,
}: PayBreakdownProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { borderColor: colors.border as string, backgroundColor: colors.surface }]}>
      {/* Basic track - attendance deductions apply here and nowhere else */}
      <Row label="Basic pay" amount={basicPay} />
      {deductionAmount > 0 && (
        <>
          <Row label="Attendance deductions" amount={deductionAmount} sign="minus" />
          {expanded &&
            deductionDetails.map((d, i) => (
              <Row
                key={`${d.date}-${i}`}
                label={`${formatDay(d.date)} · ${d.reason}`}
                amount={d.amount}
                indent
              />
            ))}
          <Row label="Basic earned" amount={basicPayEarned} emphasis />
        </>
      )}

      {/* Incentive track - untouched by absence */}
      {incentives > 0 && (
        <>
          <View style={styles.sectionGap} />
          <Row label="Incentives" amount={incentives} sign="plus" />
          {expanded &&
            incentiveDetails.map((inc, i) => (
              <Row
                key={`${inc.reason}-${i}`}
                label={inc.source === "auto" ? `${inc.reason} (auto)` : inc.reason}
                amount={inc.amount}
                indent
              />
            ))}
        </>
      )}

      {/* Year-end payout of unused paid leave - December only */}
      {leaveEncashmentAmount > 0 && (
        <>
          <View style={styles.sectionGap} />
          <Row
            label={`Leave encashment · ${leaveEncashmentDays} day${leaveEncashmentDays !== 1 ? "s" : ""}`}
            amount={leaveEncashmentAmount}
            sign="plus"
          />
        </>
      )}

      {/* Overtime track - approved minutes only */}
      {(overtimePay > 0 || pendingOvertimeMinutes > 0) && (
        <>
          <View style={styles.sectionGap} />
          {overtimePay > 0 && (
            <Row
              label={`Overtime · ${formatMinutes(overtimeMinutes)} @ ₹${formatAmount(hourlyRate)}/hr`}
              amount={overtimePay}
              sign="plus"
            />
          )}
          {expanded &&
            overtimeDetails.map((o) => (
              <Row
                key={o.date}
                label={`${formatDay(o.date)} · ${formatMinutes(o.minutes)}${o.multiplier !== 1 ? ` × ${o.multiplier}` : ""}${o.isOffDay ? " (off day)" : ""}`}
                amount={o.amount}
                indent
              />
            ))}
          {pendingOvertimeMinutes > 0 && (
            <Note color={palette.warning.default} onPress={onPendingOvertimePress}>
              {formatMinutes(pendingOvertimeMinutes)} overtime awaiting approval - not paid
              {onPendingOvertimePress ? "  ·  Review ›" : ""}
            </Note>
          )}
        </>
      )}

      {/* Break excess - off overtime first, then basic */}
      {(breakExcessDeduction > 0 || waivedBreakExcessMinutes > 0) && (
        <>
          {overtimePay <= 0 && pendingOvertimeMinutes <= 0 && (
            <View style={styles.sectionGap} />
          )}
          {breakExcessDeduction > 0 && (
            <Row
              label={`Excess break · ${formatMinutes(breakExcessMinutes)}`}
              amount={breakExcessDeduction}
              sign="minus"
            />
          )}
          {expanded &&
            breakExcessDetails.map((b) => (
              <Row key={b.date} label={`${formatDay(b.date)} · ${formatMinutes(b.minutes)} over`} amount={b.amount} indent />
            ))}
          {waivedBreakExcessMinutes > 0 && (
            <Note>
              {formatMinutes(waivedBreakExcessMinutes)} excess break waived - not charged
            </Note>
          )}
        </>
      )}

      {/* Early checkout - off whatever basic + overtime break excess left */}
      {earlyCheckoutDeduction > 0 && (
        <>
          {overtimePay <= 0 &&
            pendingOvertimeMinutes <= 0 &&
            breakExcessDeduction <= 0 &&
            waivedBreakExcessMinutes <= 0 && <View style={styles.sectionGap} />}
          <Row
            label={`Early checkout · ${formatMinutes(earlyCheckoutMinutes)}`}
            amount={earlyCheckoutDeduction}
            sign="minus"
          />
          {expanded &&
            earlyCheckoutDetails.map((e) => (
              <Row key={e.date} label={`${formatDay(e.date)} · ${formatMinutes(e.minutes)} early`} amount={e.amount} indent />
            ))}
        </>
      )}

      {/* Late arrival - off whatever basic + overtime the above left; half-days excluded */}
      {lateArrivalDeduction > 0 && (
        <>
          {overtimePay <= 0 &&
            pendingOvertimeMinutes <= 0 &&
            breakExcessDeduction <= 0 &&
            waivedBreakExcessMinutes <= 0 &&
            earlyCheckoutDeduction <= 0 && <View style={styles.sectionGap} />}
          <Row
            label={`Late arrival · ${formatMinutes(lateArrivalMinutes)} charged`}
            amount={lateArrivalDeduction}
            sign="minus"
          />
          {expanded &&
            lateArrivalDetails.map((l) => (
              <Row key={l.date} label={`${formatDay(l.date)} · ${formatMinutes(l.lateMinutes ?? l.minutes)} late, ${formatMinutes(l.minutes)} charged`} amount={l.amount} indent />
            ))}
        </>
      )}

      {/* Net deductions - applied after incentives */}
      {(penaltyAmount > 0 || advanceDeducted > 0) && (
        <View style={styles.sectionGap} />
      )}
      {penaltyAmount > 0 && (
        <>
          <Row label="Penalties" amount={penaltyAmount} sign="minus" />
          {expanded &&
            penaltyDetails.map((p, i) => (
              <Row key={`${p.reason}-${i}`} label={p.reason} amount={p.amount} indent />
            ))}
        </>
      )}
      {advanceDeducted > 0 && <Row label="Advances drawn" amount={advanceDeducted} sign="minus" />}

      <Row label="Net pay" amount={netPay} emphasis total />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIndent: { paddingLeft: spacing[6], paddingVertical: spacing[2] - 2 },
  rowTotal: { borderBottomWidth: 0, paddingVertical: spacing[3] },
  amount: { fontVariant: ["tabular-nums"], textAlign: "right" },
  note: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionGap: { height: spacing[3] },
})
