import { useCallback, useMemo } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Bell, CheckCheck, CalendarClock, User } from "lucide-react-native"
import AppText from "../components/ui/AppText"
import { useTheme } from "../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../constants/theme"
import useAuthStore from "../stores/useAuthStore"
import { notificationService } from "../services/notificationService"
import type { AppNotification, NotificationsResponse } from "../types"
import moment from "moment"
import RefreshButton from "../components/shared/RefreshButton"
import AnimatedListItem from "../components/shared/AnimatedListItem"

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string) {
  const m = moment(dateStr)
  const now = moment()
  const diffDays = now.startOf("day").diff(m.clone().startOf("day"), "days")
  if (diffDays === 0) return m.format("h:mm A")
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return m.format("dddd")
  return m.format("D MMM")
}

function dateGroupLabel(dateStr: string) {
  const m = moment(dateStr)
  const diffDays = moment().startOf("day").diff(m.clone().startOf("day"), "days")
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return "This Week"
  if (diffDays < 30) return "Earlier"
  return m.format("MMMM YYYY")
}

type ListItem =
  | { type: "header"; label: string }
  | { type: "notification"; data: AppNotification }

function buildListItems(notifications: AppNotification[]): ListItem[] {
  const items: ListItem[] = []
  let lastGroup = ""
  for (const n of notifications) {
    const group = dateGroupLabel(n.createdAt)
    if (group !== lastGroup) {
      items.push({ type: "header", label: group })
      lastGroup = group
    }
    items.push({ type: "notification", data: n })
  }
  return items
}

function NotificationIcon({ type, colors }: { type: string; colors: any }) {
  if (type === "leave_requested" || type === "leave_approved") {
    return (
      <View style={[styles.iconWrap, { backgroundColor: palette.warning.default + "22" }]}>
        <CalendarClock size={16} color={palette.warning.default} strokeWidth={1.75} />
      </View>
    )
  }
  if (type === "followup" || type === "customer") {
    return (
      <View style={[styles.iconWrap, { backgroundColor: palette.info.default + "22" }]}>
        <User size={16} color={palette.info.default} strokeWidth={1.75} />
      </View>
    )
  }
  return (
    <View style={[styles.iconWrap, { backgroundColor: colors.accentSubtle }]}>
      <Bell size={16} color={colors.accent} strokeWidth={1.75} />
    </View>
  )
}

// ─── NotificationRow ──────────────────────────────────────────────────────────

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const { colors } = useTheme()
  const unread = !item.isRead

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View
        style={[
          styles.row,
          { borderBottomColor: colors.border as string },
          unread && { backgroundColor: colors.accent + "08" },
        ]}
      >
        {unread && <View style={[styles.unreadBar, { backgroundColor: colors.accent }]} />}
        <NotificationIcon type={item.type} colors={colors} />
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <AppText
              variant={unread ? "bodyMedium" : "body"}
              numberOfLines={1}
              style={{ flex: 1, color: unread ? (colors.text.primary as string) : (colors.text.secondary as string) }}
            >
              {item.title}
            </AppText>
            <AppText variant="caption" color="tertiary" style={styles.timeText}>
              {relativeTime(item.createdAt)}
            </AppText>
          </View>
          {!!item.message && (
            <AppText variant="caption" color="secondary" numberOfLines={2} style={styles.rowMessage}>
              {item.message}
            </AppText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data, isLoading, isRefetching, refetch, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<NotificationsResponse>({
      queryKey: ["notifications", user?.user_id],
      queryFn: ({ pageParam }) =>
        notificationService.getNotifications(user!.user_id!, {
          page: pageParam as number,
          limit: 30,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const { page, pages } = lastPage.pagination
        return page < pages ? page + 1 : undefined
      },
      enabled: user?.user_id != null,
    })

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(user!.user_id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["unread-count"] })
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["unread-count"] })
    },
  })

  const handlePress = useCallback(
    (item: AppNotification) => {
      if (!item.isRead) markReadMutation.mutate(item._id)
      if (item.type === "leave_requested" || item.type === "leave_approved") {
        const role = useAuthStore.getState().user?.role
        router.push(role === "staff" ? "/(tabs)/leaves" : "/(admin)/leaves")
      } else if (item.ledgerName) {
        router.push({
          pathname: "/customer/[name]",
          params: { name: item.ledgerName, totalBalance: "0", drCr: "Dr", customerId: String(item.ledgerId ?? ""), mobile: "" },
        })
      }
    },
    [markReadMutation, router]
  )

  const notifications = data?.pages.flatMap((p) => p.data) ?? []
  const unreadCount = data?.pages[0]?.unread_count ?? 0
  const listItems = useMemo(() => buildListItems(notifications), [notifications])

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.75} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Notifications</AppText>
          {unreadCount > 0 && (
            <AppText variant="caption" color="tertiary">{unreadCount} unread</AppText>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => markAllMutation.mutate()}
            style={styles.markAllBtn}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck size={16} color={colors.accent} strokeWidth={1.75} />
            <AppText variant="caption" style={{ color: colors.accent }}>Mark all read</AppText>
          </TouchableOpacity>
        )}
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item, i) => item.type === "header" ? `h-${item.label}` : item.data._id}
          renderItem={({ item, index }) => {
            if (item.type === "header") {
              return (
                <View style={[styles.sectionHeader, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
                  <AppText variant="caption" color="tertiary" style={{ fontSize: 11, letterSpacing: 0.5 }}>
                    {item.label.toUpperCase()}
                  </AppText>
                </View>
              )
            }
            return (
              <AnimatedListItem index={index}>
                <NotificationRow item={item.data} onPress={() => handlePress(item.data)} />
              </AnimatedListItem>
            )
          }}
          contentContainerStyle={{ paddingBottom: spacing[10] }}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.background.secondary }]}>
                <Bell size={32} color={colors.text.tertiary} strokeWidth={1.25} />
              </View>
              <AppText variant="bodyMedium" color="secondary" style={{ marginTop: spacing[4] }}>
                You're all caught up
              </AppText>
              <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[1] }}>
                No notifications yet
              </AppText>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
            ) : null
          }
        />
      )}
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
    gap: spacing[2],
  },
  iconBtn: { padding: spacing[2] },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },

  sectionHeader: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing[4],
    paddingRight: spacing[5],
    paddingLeft: spacing[5],
    borderBottomWidth: 1,
    gap: spacing[3],
    position: "relative",
  },
  unreadBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowBody: { flex: 1, gap: spacing[1] },
  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing[2] },
  timeText: { fontSize: 11, flexShrink: 0, marginTop: 2 },
  rowMessage: { lineHeight: 18 },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[20],
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
})
