import { useCallback } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native"
import { useRouter } from "expo-router"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Bell, CheckCheck } from "lucide-react-native"
import AppText from "../components/ui/AppText"
import AppCard from "../components/ui/AppCard"
import { useTheme } from "../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../constants/theme"
import useAuthStore from "../stores/useAuthStore"
import { notificationService } from "../services/notificationService"
import { formatDate } from "../utils/helpers"
import type { AppNotification, NotificationsResponse } from "../types"

function NotificationCard({
  item,
  onPress,
}: {
  item: AppNotification
  onPress: () => void
}) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <AppCard
        elevation="sm"
        style={[
          styles.card,
          !item.isRead && { borderLeftWidth: 3, borderLeftColor: colors.accent },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSubtle }]}>
            <Bell size={16} color={colors.accent} strokeWidth={1.75} />
          </View>
          <View style={styles.cardBody}>
            <AppText variant="bodyMedium" style={!item.isRead ? { color: colors.text.primary } : undefined}>
              {item.title}
            </AppText>
            <AppText variant="caption" color="secondary" style={{ marginTop: 2 }}>
              {item.message}
            </AppText>
            <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[1] }}>
              {formatDate(item.createdAt)}
            </AppText>
          </View>
          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
          )}
        </View>
      </AppCard>
    </TouchableOpacity>
  )
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
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

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.75} />
        </TouchableOpacity>
        <AppText variant="heading2" style={{ flex: 1 }}>Notifications</AppText>
        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => markAllMutation.mutate()}
            style={styles.markAllBtn}
          >
            <CheckCheck size={16} color={colors.accent} strokeWidth={1.75} />
            <AppText variant="caption" style={{ color: colors.accent }}>Mark all read</AppText>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationCard item={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Bell size={40} color={colors.text.tertiary} strokeWidth={1.25} />
              <AppText color="tertiary" style={{ marginTop: spacing[3] }}>No notifications yet</AppText>
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
  backBtn: { padding: spacing[2] },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: spacing[1], paddingHorizontal: spacing[2] },
  list: { padding: spacing[4], paddingBottom: spacing[10] },
  card: { padding: spacing[4] },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
  iconWrap: { width: 36, height: 36, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
})
