import { useRef, useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Check, X, Flag, MessageSquareQuote, Clock, CircleCheck } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import AppText from "../../components/ui/AppText"
import AppInput from "../../components/ui/AppInput"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { feedbackService } from "../../services/feedbackService"
import { toTitleCase } from "../../utils/helpers"
import type { FeedbackRequest, FeedbackRequestStatus } from "../../types"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type StatusFilter = "all" | FeedbackRequestStatus

const STATUS_META: Record<FeedbackRequestStatus, { label: string; color: string; icon: typeof CircleCheck }> = {
  completed: { label: "Completed", color: palette.success.default, icon: CircleCheck },
  pending: { label: "Pending", color: palette.warning.default, icon: Clock },
  expired: { label: "Expired", color: palette.neutral[400], icon: Clock },
}

// ─── ReplyCard ────────────────────────────────────────────────────────────────

function ReplyCard({ item }: { item: FeedbackRequest }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const anim = useRef(new Animated.Value(0)).current
  const meta = STATUS_META[item.status]
  const StatusIcon = meta.icon

  const yesCount = item.answers?.filter((a) => a.answer).length ?? 0
  const noCount = (item.answers?.length ?? 0) - yesCount

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    Animated.timing(anim, {
      toValue: open ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
    setOpen((v) => !v)
  }

  const chevronRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] })

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={toggle} style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
              {toTitleCase(item.customerName)}
            </AppText>
            {item.flagged && (
              <View style={styles.flagPill}>
                <Flag size={10} color={palette.error.default} strokeWidth={2} />
                <AppText variant="caption" style={{ color: palette.error.default }}>Flagged</AppText>
              </View>
            )}
          </View>
          <AppText variant="caption" color="tertiary" numberOfLines={1}>
            Sent by {item.staffName ? toTitleCase(item.staffName) : "unknown staff"} · {moment(item.sentAt).fromNow()}
          </AppText>
        </View>

        <View style={styles.headerRight}>
          {item.status === "completed" && (
            <View style={styles.answerCounts}>
              <View style={styles.countChip}>
                <Check size={11} color={palette.success.default} strokeWidth={2.5} />
                <AppText variant="caption" style={{ color: palette.success.default }}>{yesCount}</AppText>
              </View>
              <View style={styles.countChip}>
                <X size={11} color={palette.error.default} strokeWidth={2.5} />
                <AppText variant="caption" style={{ color: palette.error.default }}>{noCount}</AppText>
              </View>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: meta.color + "18" }]}>
            <StatusIcon size={11} color={meta.color} strokeWidth={2} />
            <AppText variant="caption" style={{ color: meta.color }}>{meta.label}</AppText>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <ChevronDown size={16} color={colors.text.tertiary} strokeWidth={2} />
          </Animated.View>
        </View>
      </Pressable>

      {open && (
        <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
          {item.flagged && item.flagReason && (
            <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[3] }}>
              {item.flagReason}
            </AppText>
          )}
          {item.questions.map((q) => {
            const answer = item.answers?.find((a) => a.questionId === q.questionId)?.answer
            return (
              <View key={q.questionId} style={styles.questionRow}>
                <AppText variant="bodySmall" color="secondary" style={{ flex: 1 }}>{q.text}</AppText>
                {answer === true ? (
                  <Check size={16} color={palette.success.default} strokeWidth={2.5} />
                ) : answer === false ? (
                  <X size={16} color={palette.error.default} strokeWidth={2.5} />
                ) : (
                  <AppText variant="caption" color="tertiary">—</AppText>
                )}
              </View>
            )
          })}
          <View style={styles.metaFooter}>
            <AppText variant="caption" color="tertiary">
              {item.completedAt ? `Completed ${moment(item.completedAt).format("D MMM YYYY, h:mm A")}` : `Expires ${moment(item.expiresAt).format("D MMM YYYY")}`}
            </AppText>
          </View>
        </View>
      )}
    </View>
  )
}

// ─── TeamFeedbackRepliesScreen ────────────────────────────────────────────────

export default function TeamFeedbackRepliesScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("completed")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["feedback-requests", statusFilter, page],
    queryFn: () =>
      feedbackService.getAllFeedbackRequests({
        page,
        limit: 30,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  })

  const allItems = data?.data ?? []
  const query = search.trim().toLowerCase()
  const items = query
    ? allItems.filter(
        (r) =>
          r.customerName?.toLowerCase().includes(query) ||
          r.staffName?.toLowerCase().includes(query)
      )
    : allItems

  const pagination = data?.pagination

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Customer Feedback</AppText>
          <AppText variant="caption" color="tertiary">
            {pagination ? `${pagination.total} repl${pagination.total === 1 ? "y" : "ies"}` : "…"}
          </AppText>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <AppInput placeholder="Search customer or staff name…" value={search} onChangeText={setSearch} returnKeyType="search" />
      </View>

      {/* Status filter */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(["completed", "pending", "expired", "all"] as StatusFilter[]).map((s) => {
          const isActive = statusFilter === s
          const label = s === "all" ? "All" : STATUS_META[s].label
          return (
            <Pressable
              key={s}
              onPress={() => { setStatusFilter(s); setPage(1) }}
              style={[
                styles.filterChip,
                { backgroundColor: isActive ? colors.accent + "18" : colors.background.secondary, borderColor: isActive ? colors.accent : colors.border },
              ]}
            >
              <AppText variant="caption" style={{ color: isActive ? colors.accent : colors.text.secondary }}>
                {label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <ReplyCard item={item} />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (pagination && pagination.page < pagination.pages) setPage((p) => p + 1)
        }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <MessageSquareQuote size={40} color={colors.text.tertiary} strokeWidth={1.25} />
              <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                No feedback replies found
              </AppText>
            </View>
          )
        }
      />
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

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
  searchWrap: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  list: { padding: spacing[4], paddingBottom: spacing[16], gap: spacing[3] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[3],
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    gap: spacing[3],
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  flagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: palette.error.default + "18",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  answerCounts: { flexDirection: "row", gap: spacing[2] },
  countChip: { flexDirection: "row", alignItems: "center", gap: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  cardBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    gap: spacing[2],
  },
  questionRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  metaFooter: { marginTop: spacing[2] },
})
