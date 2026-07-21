import { formatAmount } from "../../utils/helpers"
import { View, ScrollView, StyleSheet, Pressable, TouchableOpacity, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useTablet } from "../../hooks/useTablet"
import { useQuery } from "@tanstack/react-query"
import { Users, CalendarClock, ChevronRight, Award, Bell, ClipboardList } from "lucide-react-native"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import useAuthStore from "../../stores/useAuthStore"
import { useStaffBillsSummary } from "../../hooks/useStaffBillsSummary"
import { leaveService } from "../../services/leaveService"
import { extraPerformanceService } from "../../services/extraPerformanceService"
import { notificationService } from "../../services/notificationService"

// ─── helpers ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = moment().hour()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}


// ─── FeatureCard ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  label,
  subtitle,
  accent,
  onPress,
  isLoading,
  disabled,
  soon,
}: {
  icon: React.ReactNode
  label: string
  subtitle: string
  accent: string
  onPress?: () => void
  isLoading?: boolean
  disabled?: boolean
  soon?: boolean
}) {
  const { colors } = useTheme()

  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ flex: 1 }}>
      {({ pressed }) => (
        <AppCard
          elevation="sm"
          style={[
            styles.featureCard,
            { opacity: pressed && !disabled ? 0.75 : disabled ? 0.5 : 1 },
          ]}
        >
          <View style={styles.featureCardInner}>
            <View style={[styles.iconWrap, { backgroundColor: accent + "18" }]}>{icon}</View>
            {soon && (
              <View style={[styles.soonBadge, { backgroundColor: colors.border }]}>
                <AppText variant="caption" color="tertiary" style={{ fontSize: 10 }}>Soon</AppText>
              </View>
            )}
          </View>
          <AppText variant="bodyMedium" style={{ marginTop: spacing[3] }}>{label}</AppText>
          {isLoading ? (
            <ActivityIndicator size="small" color={accent} style={{ marginTop: spacing[1] }} />
          ) : (
            <AppText variant="caption" color="secondary" numberOfLines={1}>{subtitle}</AppText>
          )}
          {!disabled && (
            <ChevronRight
              size={16}
              color={colors.text.tertiary}
              strokeWidth={1.75}
              style={{ position: "absolute", top: spacing[4], right: spacing[4] } as any}
            />
          )}
        </AppCard>
      )}
    </Pressable>
  )
}

// ─── HomeScreen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const summary = useStaffBillsSummary(user?.user_id)
  const { data: unreadData } = useQuery({
    queryKey: ["unread-count", user?.user_id],
    queryFn: () => notificationService.getUnreadCount(user!.user_id!),
    enabled: user?.user_id != null,
    refetchInterval: 60_000,
  })
  const unreadCount = unreadData ?? 0

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["leave-balance", user?.user_id],
    queryFn: () => leaveService.getLeaveBalance(user!.user_id!),
    enabled: user?.user_id != null,
  })
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ["my-performances", user?.user_id],
    queryFn: () => extraPerformanceService.getStaffPerformances(),
    enabled: user?.user_id != null,
  })

  const totalCustomers = summary.data?.total_customers ?? 0
  const totalOutstanding = summary.data?.total_outstanding ?? 0
  const leaveBalance = balanceData?.data?.leaveBalance
  const pendingPerformances = performanceData?.data?.stats?.pending ?? 0

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={isTablet ? styles.desktopContent : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="tertiary">{greeting()}</AppText>
            <AppText variant="heading2">{user?.name ?? "Welcome"}</AppText>
            <AppText variant="caption" color="tertiary">{moment().format("dddd, D MMM YYYY")}</AppText>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/notifications")} style={styles.bellBtn}>
            <Bell size={22} color={colors.text.primary} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <AppText variant="caption" style={{ color: "#fff", fontSize: 10, lineHeight: 14 }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Feature cards — 2-column grid */}
      <AppText variant="bodyMedium" color="secondary" style={styles.sectionLabel}>Features</AppText>

      <View style={styles.grid}>
        {/* Row 1 */}
        <View style={styles.gridRow}>
          <FeatureCard
            icon={<Users size={24} color={colors.accent} strokeWidth={1.6} />}
            label="Customers"
            subtitle={
              summary.isLoading
                ? ""
                : `${totalCustomers} customers · ${formatAmount(totalOutstanding)} outstanding`
            }
            accent={colors.accent}
            isLoading={summary.isLoading}
            onPress={() => router.push("/(tabs)/customers")}
          />
          <FeatureCard
            icon={<ClipboardList size={24} color={palette.info.default} strokeWidth={1.6} />}
            label="Follow-ups"
            subtitle="View all logged contacts"
            accent={palette.info.default}
            onPress={() => router.push("/(tabs)/followups")}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <FeatureCard
            icon={<Award size={24} color={palette.success.default} strokeWidth={1.6} />}
            label="Performance"
            subtitle={
              performanceLoading
                ? ""
                : pendingPerformances > 0
                ? `${pendingPerformances} pending review`
                : "Log extra achievements"
            }
            accent={palette.success.default}
            isLoading={performanceLoading}
            onPress={() => router.push("/(tabs)/extra-performance")}
          />
          <FeatureCard
            icon={<CalendarClock size={24} color={palette.warning.default} strokeWidth={1.6} />}
            label="My Leaves"
            subtitle={
              balanceLoading
                ? ""
                : leaveBalance != null
                ? `${leaveBalance} days remaining`
                : "View leave requests"
            }
            accent={palette.warning.default}
            isLoading={balanceLoading}
            onPress={() => router.push("/(tabs)/leaves")}
          />
        </View>
      </View>
      </View>
    </ScrollView>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: spacing[16] },
  desktopContent: { width: "100%" },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[6],
    gap: spacing[1],
  },
  sectionLabel: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[3],
  },
  grid: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  gridRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  featureCard: {
    flex: 1,
    padding: spacing[4],
    minHeight: 120,
  },
  featureCardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  soonBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  bellBtn: { padding: spacing[2], position: "relative" },
  badge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
})
