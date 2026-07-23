import { useRef, useEffect } from "react"
import { View, TouchableOpacity, Animated, Easing, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { ChevronRight, MessageCircle, CheckCircle2 } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette } from "../../constants/theme"
import { formatAmount, formatDate } from "../../utils/helpers"
import { RETENTION_COLOR, RETENTION_STATUS_LABEL } from "../../constants/retention"
import { toTitleCase } from "../../utils/helpers"
import type { LedgerCustomerOutstanding } from "../../types"

interface Props {
  item: LedgerCustomerOutstanding
  index?: number
}

export default function CustomerOutstandingRow({ item, index }: Props) {
  const router = useRouter()
  const { colors } = useTheme()
  const fu = item.follow_up

  const totalPromised = fu?.total_promised_amount ?? 0
  const isFullPromise = fu?.last_outcome === "promisedToPay"
  const progressRatio = isFullPromise
    ? 1
    : item.outstanding_balance > 0
    ? Math.min(totalPromised / item.outstanding_balance, 1)
    : 0
  const progressColor = isFullPromise ? palette.success.default : palette.warning.default

  const animProgress = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: progressRatio,
      duration: 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
  }, [progressRatio])

  const hasFollowUp = fu && fu.total > 0
  const isOverdue = fu?.is_overdue ?? false
  const isSettled = item.outstanding_balance === 0 && (fu?.open ?? 0) === 0 && (fu?.resolved ?? 0) > 0
  const hasResolved = (fu?.resolved ?? 0) > 0
  const balanceColor = (isSettled || item.outstanding_dr_cr === "Cr") ? palette.success.default : palette.error.default

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/customer/[name]",
          params: {
            name: item.name,
            totalBalance: String(item.outstanding_balance),
            drCr: item.outstanding_dr_cr,
            customerId: String(item.ledger_id),
            mobile: item.mobile ?? "",
          },
        })
      }
    >
      <View style={[styles.card, { borderBottomColor: colors.border as string }]}>
        {/* Name row + balance + chevron */}
        <View style={styles.headerRow}>
          {index != null && (
            <View style={[styles.avatar, { backgroundColor: colors.background.secondary as string, borderColor: colors.border as string }]}>
              <AppText variant="caption" style={{ fontSize: 10, color: colors.text.tertiary as string }}>{index + 1}</AppText>
            </View>
          )}
          <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>{toTitleCase(item.name)}</AppText>
          {isSettled && (
            <View style={[styles.pill, { backgroundColor: palette.success.default + "22" }]}>
              <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>Settled</AppText>
            </View>
          )}
          {isOverdue && (
            <View style={[styles.pill, { backgroundColor: palette.warning.default + "22" }]}>
              <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>Overdue</AppText>
            </View>
          )}
          <AppText variant="mono" style={{ color: balanceColor, fontSize: 16 }}>
            ₹{formatAmount(item.outstanding_balance)}{item.outstanding_dr_cr === "Cr" ? " Cr" : ""}
          </AppText>
          <ChevronRight size={14} color={palette.neutral[400]} strokeWidth={1.75} />
        </View>

        {/* Retention + velocity hints */}
        {(item.retention_status || item.days_since_last_purchase != null || item.avg_days_to_clear != null) && (
          <View style={styles.metaRow}>
            {item.retention_status && item.retention_status !== "never_purchased" && (() => {
              const color = RETENTION_COLOR[item.retention_status]
              return (
                <View style={[styles.pill, { backgroundColor: color + "18" }]}>
                  <AppText variant="caption" numberOfLines={1} style={{ color, fontSize: 10 }}>
                    {RETENTION_STATUS_LABEL[item.retention_status]}
                  </AppText>
                </View>
              )
            })()}
            {item.days_since_last_purchase != null && (
              <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
                {item.days_since_last_purchase}d since purchase
              </AppText>
            )}
            {item.avg_days_to_clear != null && (
              <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
                · clears in {item.avg_days_to_clear.toFixed(0)}d
              </AppText>
            )}
          </View>
        )}

        {/* Last payment */}
        {item.days_since_last_payment != null && (
          <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
            Last paid{" "}
            <AppText variant="caption" style={{
              fontSize: 10,
              color: item.days_since_last_payment <= 30 ? palette.success.default
                : item.days_since_last_payment <= 90 ? palette.warning.default
                : palette.error.default,
            }}>
              {item.days_since_last_payment}d ago
            </AppText>
            {item.last_payment_amount != null ? ` · ₹${formatAmount(item.last_payment_amount)}` : ""}
          </AppText>
        )}

        {/* Follow-up pills */}
        {hasFollowUp && (
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: palette.neutral[400] + "22" }]}>
              <MessageCircle size={10} color={palette.neutral[500]} strokeWidth={1.75} />
              <AppText variant="caption" style={{ color: palette.neutral[500], fontSize: 10 }}>
                {fu.total} {fu.total === 1 ? "follow-up" : "follow-ups"}
              </AppText>
            </View>
            {hasResolved && (
              <View style={[styles.pill, { backgroundColor: palette.success.default + "22" }]}>
                <CheckCircle2 size={10} color={palette.success.default} strokeWidth={1.75} />
                <AppText variant="caption" style={{ color: palette.success.default, fontSize: 10 }}>
                  {fu.resolved} paid
                </AppText>
              </View>
            )}
            {totalPromised > 0 && (
              <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 10 }}>
                ₹{formatAmount(totalPromised)} promised
              </AppText>
            )}
            {fu.last_logged_at && (
              <AppText variant="caption" style={{ fontSize: 10, color: palette.neutral[400] }}>
                Last: {formatDate(fu.last_logged_at)}
              </AppText>
            )}
            {fu.next_followup_date && (fu?.open ?? 0) > 0 && (
              <AppText variant="caption" style={{ fontSize: 10, color: isOverdue ? palette.warning.default : palette.info.default }}>
                Next: {formatDate(fu.next_followup_date)}
              </AppText>
            )}
          </View>
        )}

        {/* Promise progress bar */}
        {(isFullPromise || (totalPromised > 0 && item.outstanding_balance > 0)) && (
          <View style={[styles.progressTrack, { backgroundColor: progressColor + "22" }]}>
            <Animated.View
              style={[styles.progressFill, {
                backgroundColor: progressColor,
                width: animProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              }]}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    gap: spacing[2],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing[2],
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 100,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
