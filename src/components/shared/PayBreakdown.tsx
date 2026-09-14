import { View, StyleSheet } from "react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { formatAmount } from "../../utils/helpers"
import type { PayslipIncentiveDetail, PayslipPenaltyDetail, PayslipDeductionDetail } from "../../types"

/**
 * The itemised pay breakdown, shared by the admin payslip list, the staff's
 * own payslips, and the month-to-date preview, so all three explain a figure
 * the same way.
 *
 * Deliberately mirrors the arithmetic in SalaryService.computePayroll:
 *
 *   basicPayEarned = basicPay - attendance deductions
 *   grossPay       = basicPayEarned + incentives
 *   netPay         = grossPay - penalties - advances
 *
 * Basic and incentives are shown as separate strands because they behave
 * differently - absence reduces basic only, and never claws back incentives
 * already earned in the month.
 */

export interface PayBreakdownProps {
  basicPay: number
  basicPayEarned: number
  deductionAmount: number
  deductionDetails?: PayslipDeductionDetail[]
  incentives: number
  incentiveDetails?: PayslipIncentiveDetail[]
  penaltyAmount: number
  penaltyDetails?: PayslipPenaltyDetail[]
  advanceDeducted: number
  grossPay: number
  netPay: number
  /** Show every contributing line, not just the totals. */
  expanded?: boolean
}

function Row({
  label,
  amount,
  sign,
  emphasis,
  indent,
}: {
  label: string
  amount: number
  sign?: "plus" | "minus"
  emphasis?: boolean
  indent?: boolean
}) {
  const { colors } = useTheme()
  const amountColor =
    sign === "minus" ? palette.error.default : emphasis ? colors.accent : colors.text.primary
  const prefix = sign === "minus" ? "−" : sign === "plus" ? "+" : ""

  return (
    <View style={[styles.row, indent && styles.rowIndent]}>
      <AppText
        variant={emphasis ? "bodyMedium" : indent ? "caption" : "body"}
        color={indent ? "tertiary" : emphasis ? "primary" : "secondary"}
        style={{ flex: 1 }}
        numberOfLines={2}
      >
        {label}
      </AppText>
      <AppText
        variant={emphasis ? "bodyMedium" : indent ? "caption" : "body"}
        style={{ color: indent ? undefined : amountColor }}
        color={indent ? "tertiary" : undefined}
      >
        {prefix}₹{formatAmount(Math.abs(amount))}
      </AppText>
    </View>
  )
}

export default function PayBreakdown({
  basicPay,
  basicPayEarned,
  deductionAmount,
  deductionDetails = [],
  incentives,
  incentiveDetails = [],
  penaltyAmount,
  penaltyDetails = [],
  advanceDeducted,
  grossPay,
  netPay,
  expanded = false,
}: PayBreakdownProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { borderColor: colors.border as string }]}>
      {/* Basic track - attendance deductions apply here and nowhere else */}
      <Row label="Basic pay" amount={basicPay} />
      {deductionAmount > 0 && (
        <>
          <Row label="Attendance deductions" amount={deductionAmount} sign="minus" />
          {expanded &&
            deductionDetails.map((d, i) => (
              <Row
                key={`${d.date}-${i}`}
                label={`${d.date} · ${d.reason}`}
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
          <View style={[styles.divider, { backgroundColor: colors.border as string }]} />
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

      {/* Net deductions - applied after incentives */}
      {(penaltyAmount > 0 || advanceDeducted > 0) && (
        <View style={[styles.divider, { backgroundColor: colors.border as string }]} />
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

      <View style={[styles.divider, { backgroundColor: colors.border as string }]} />
      <Row label="Net pay" amount={netPay} emphasis />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing[3],
    gap: spacing[1],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  rowIndent: { paddingLeft: spacing[3] },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing[1] },
})
