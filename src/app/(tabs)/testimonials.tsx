import { useState, useMemo } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, MessageSquareQuote, Clock, RefreshCw, Search } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import Popup from "../../components/shared/Popup"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { testimonialService } from "../../services/testimonialService"
import { staffService } from "../../services/staffService"
import useAuthStore from "../../stores/useAuthStore"
import { useTablet } from "../../hooks/useTablet"
import type { Testimonial, TestimonialStatus, StaffOption } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TestimonialStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: palette.warning.default },
  approved: { label: "Approved", color: palette.success.default },
  rejected: { label: "Rejected", color: palette.error.default },
}

type TabFilter = "received" | "given"

// ─── StatsCard ────────────────────────────────────────────────────────────────

function StatsCard({
  isLoading,
  approved,
  pending,
}: {
  isLoading: boolean
  approved: number
  pending: number
}) {
  const { colors } = useTheme()

  return (
    <View style={[styles.statsCard, { borderBottomColor: colors.border }]}>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <AppText variant="heading2" style={{ color: palette.success.default }}>{approved}</AppText>
            <AppText variant="caption" color="tertiary">Approved</AppText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <AppText variant="heading2" style={{ color: palette.warning.default }}>{pending}</AppText>
            <AppText variant="caption" color="tertiary">Pending</AppText>
          </View>
        </View>
      )}
    </View>
  )
}

// ─── SubmitModal ────────────────────────────────────────────────────────────

function SubmitModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState("")
  const [reviewee, setReviewee] = useState<StaffOption | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-options"],
    queryFn: () => staffService.getStaffOptions(),
    enabled: visible,
  })

  const colleagues = useMemo(
    () => (staffData?.data ?? []).filter((s) => s.name.toLowerCase() !== (user?.name ?? "").toLowerCase()),
    [staffData, user]
  )

  const filteredColleagues = useMemo(() => {
    if (!search.trim()) return colleagues
    const q = search.trim().toLowerCase()
    return colleagues.filter((s) => s.name.toLowerCase().includes(q))
  }, [colleagues, search])

  const mutation = useMutation({
    mutationFn: () =>
      testimonialService.submitTestimonial({
        revieweeStaffId: reviewee!.id,
        message: message.trim(),
      }),
    onSuccess: () => { onSuccess(); onClose(); reset() },
    onError: (e) => setError((e as Error).message ?? "Submission failed"),
  })

  function reset() {
    setSearch(""); setReviewee(null); setMessage(""); setError("")
  }

  function handleClose() {
    reset()
    onClose()
  }

  function validate() {
    if (!reviewee) return "Please select a colleague"
    if (!message.trim()) return "Please write your testimonial"
    return null
  }

  function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError("")
    mutation.mutate()
  }

  if (!visible) return null

  return (
    <Popup title="Write a Testimonial" onClose={handleClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Colleague picker */}
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Colleague</AppText>
        {reviewee ? (
          <Pressable
            onPress={() => setReviewee(null)}
            style={[styles.selectedChip, { borderColor: colors.accent, backgroundColor: colors.accentSubtle }]}
          >
            <AppText variant="bodyMedium" style={{ color: colors.accent }}>{reviewee.name}</AppText>
            <AppText variant="caption" style={{ color: colors.accent }}>Change</AppText>
          </Pressable>
        ) : (
          <>
            <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}>
              <Search size={15} color={colors.text.tertiary} strokeWidth={1.75} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary, outline: "none" } as any]}
                placeholder="Search colleagues..."
                placeholderTextColor={colors.text.tertiary}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <View style={[styles.colleagueList, { borderColor: colors.border }]}>
              {staffLoading ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ paddingVertical: spacing[4] }} />
              ) : filteredColleagues.length === 0 ? (
                <AppText variant="caption" color="tertiary" style={{ padding: spacing[3] }}>No colleagues found</AppText>
              ) : (
                filteredColleagues.slice(0, 20).map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setReviewee(s)}
                    style={[styles.colleagueRow, { borderBottomColor: colors.border }]}
                  >
                    <AppText variant="body">{s.name}</AppText>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}

        {/* Message */}
        <AppText variant="caption" color="tertiary" style={styles.fieldLabel}>Message</AppText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="Share what made this colleague stand out..."
          placeholderTextColor={colors.text.tertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {error ? (
          <AppText variant="caption" style={{ color: palette.error.default, marginBottom: spacing[3] }}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          label={mutation.isPending ? "Submitting…" : "Submit for Approval"}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          style={{ marginTop: spacing[4] }}
        />
        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── TestimonialCard ────────────────────────────────────────────────────────

function TestimonialCard({ item, direction }: { item: Testimonial; direction: TabFilter }) {
  const { colors } = useTheme()
  const status = STATUS_CONFIG[item.status]
  const name = direction === "received" ? item.reviewerName : item.revieweeName

  return (
    <AppCard elevation="sm" style={styles.perfCard}>
      <View style={styles.perfCardTop}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <View style={{ flexDirection: "row", gap: spacing[2], alignItems: "center" }}>
            <AppText variant="bodyMedium" numberOfLines={1}>
              {direction === "received" ? `From ${name}` : `To ${name}`}
            </AppText>
            <View style={[styles.typeBadge, { backgroundColor: status.color + "22" }]}>
              <AppText variant="caption" style={{ color: status.color, fontSize: 11 }}>{status.label}</AppText>
            </View>
          </View>
          <AppText variant="caption" color="tertiary" numberOfLines={4}>{item.message}</AppText>
        </View>
        {item.status === "approved" && (
          <AppText variant="bodyMedium" style={{ color: palette.success.default }}>
            +{item.points}
          </AppText>
        )}
      </View>

      <View style={[styles.perfCardMeta, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          <Clock size={13} color={colors.text.tertiary} strokeWidth={1.5} />
          <AppText variant="caption" color="tertiary">{moment(item.createdAt).fromNow()}</AppText>
        </View>
      </View>

      {item.status === "rejected" && item.rejectionReason ? (
        <AppText variant="caption" style={{ color: palette.error.default, paddingHorizontal: spacing[4], paddingBottom: spacing[3] }}>
          {item.rejectionReason}
        </AppText>
      ) : null}
    </AppCard>
  )
}

// ─── TestimonialsScreen ──────────────────────────────────────────────────────

export default function TestimonialsScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<TabFilter>("received")
  const [submitOpen, setSubmitOpen] = useState(false)

  const { data: receivedData, isLoading: receivedLoading, refetch: refetchReceived, isRefetching: refetchingReceived } = useQuery({
    queryKey: ["my-testimonials-received", user?.user_id],
    queryFn: () => testimonialService.getReceivedTestimonials(),
    enabled: user?.user_id != null,
  })

  const { data: givenData, isLoading: givenLoading, refetch: refetchGiven, isRefetching: refetchingGiven } = useQuery({
    queryKey: ["my-testimonials-given", user?.user_id],
    queryFn: () => testimonialService.getGivenTestimonials(),
    enabled: user?.user_id != null,
  })

  const receivedList = receivedData?.data?.testimonials ?? []
  const givenList = givenData?.data?.testimonials ?? []
  const stats = receivedData?.data?.stats

  const list = tab === "received" ? receivedList : givenList
  const isLoading = tab === "received" ? receivedLoading : givenLoading
  const isRefetching = tab === "received" ? refetchingReceived : refetchingGiven
  const onRefresh = tab === "received" ? refetchReceived : refetchGiven

  function onSubmitSuccess() {
    queryClient.invalidateQueries({ queryKey: ["my-testimonials-received"] })
    queryClient.invalidateQueries({ queryKey: ["my-testimonials-given"] })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <AppText variant="heading2" style={{ flex: 1 }}>Testimonials</AppText>
        <Pressable onPress={() => onRefresh()} hitSlop={8} style={{ padding: spacing[2] }}>
          {isRefetching
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          }
        </Pressable>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setSubmitOpen(true)}>
          <View style={[styles.addBtn, { backgroundColor: colors.accent }]}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
            <AppText variant="caption" style={{ color: "#fff" }}>Write</AppText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <StatsCard
        isLoading={receivedLoading}
        approved={stats?.approved ?? 0}
        pending={stats?.pending ?? 0}
      />

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(["received", "given"] as TabFilter[]).map((t) => {
          const isActive = t === tab
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.filterTab}>
              <AppText
                variant={isActive ? "bodyMedium" : "body"}
                style={{
                  color: isActive ? colors.accent : colors.text.tertiary,
                  paddingBottom: spacing[2],
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: colors.accent,
                  textTransform: "capitalize",
                }}
              >
                {t}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {/* List */}
      <FlatList
        data={list}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <TestimonialCard item={item} direction={tab} />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshing={isRefetching}
        onRefresh={onRefresh}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <MessageSquareQuote size={40} color={colors.text.tertiary} strokeWidth={1.25} />
              <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                {tab === "received" ? "No testimonials received yet" : "You haven't written any testimonials yet"}
              </AppText>
            </View>
          )
        }
      />

      <SubmitModal
        visible={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSuccess={onSubmitSuccess}
      />
      </View>
    </View>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mobileContent: { flex: 1 },
  desktopContent: { flex: 1 },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
  },

  statsCard: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", gap: spacing[1] },
  statDivider: { width: StyleSheet.hairlineWidth, height: 40 },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },
  filterTab: { paddingTop: spacing[3] },

  list: { padding: spacing[4], paddingBottom: spacing[16] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },

  perfCard: { padding: 0, overflow: "hidden" },
  perfCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    padding: spacing[4],
  },
  typeBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.sm },
  perfCardMeta: {
    flexDirection: "row",
    gap: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },

  fieldLabel: { marginTop: spacing[1], marginBottom: spacing[2] },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing[1],
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
  },
  searchInput: { flex: 1, paddingVertical: spacing[3], fontSize: 14 },
  colleagueList: {
    borderWidth: 1,
    borderRadius: radii.md,
    maxHeight: 180,
    marginBottom: spacing[1],
    overflow: "hidden",
  },
  colleagueRow: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    marginBottom: spacing[1],
  },
  textArea: { minHeight: 100 },
})
