import { useMemo, useState } from "react"
import { View, SectionList, ActivityIndicator, Pressable, StyleSheet } from "react-native"
import { useQueryClient } from "@tanstack/react-query"
import { Play, CheckCircle2, ClipboardList } from "lucide-react-native"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import WorkCard from "../../components/shared/WorkCard"
import WorkStatusModal from "../../components/shared/WorkStatusModal"
import type { ActionMenuItem } from "../../components/shared/ActionMenu"
import AppText from "../../components/ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { useMyWork } from "../../hooks/useWork"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { groupByDue, isOverdue } from "../../utils/work"
import type { WorkAssignment, WorkStatus } from "../../types"

const FILTERS: Array<{ label: string; value: WorkStatus | "all" | "open" }> = [
  { label: "Open", value: "open" },
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

/** Compact at-a-glance counts above the list. */
function SummaryStrip({ items }: { items: WorkAssignment[] }) {
  const { colors } = useTheme()

  const stats = useMemo(() => {
    const open = items.filter((w) => w.status === "pending" || w.status === "in_progress")
    return {
      overdue: open.filter(isOverdue).length,
      today: open.filter((w) => w.dueDate === new Date().toISOString().slice(0, 10)).length,
      open: open.length,
    }
  }, [items])

  const tiles = [
    { label: "Overdue", value: stats.overdue, color: palette.error.default },
    { label: "Due today", value: stats.today, color: palette.warning.default },
    { label: "Open", value: stats.open, color: colors.text.primary as string },
  ]

  return (
    <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
      {tiles.map((tile) => (
        <View key={tile.label} style={styles.summaryTile}>
          <AppText variant="heading3" style={{ color: tile.color }}>{tile.value}</AppText>
          <AppText variant="caption" color="tertiary">{tile.label}</AppText>
        </View>
      ))}
    </View>
  )
}

export default function MyWorkScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<WorkStatus | "all" | "open">("open")
  const [statusTarget, setStatusTarget] = useState<{
    work: WorkAssignment
    intent: "in_progress" | "completed"
  } | null>(null)

  // "Open" spans two statuses, so it's filtered client-side off the full list;
  // the others map straight to a server-side status filter.
  const { data, isLoading, refetch, isRefetching } = useMyWork(
    filter === "all" || filter === "open" ? undefined : { status: filter }
  )

  const all = data?.data ?? []
  const items = filter === "open"
    ? all.filter((w) => w.status === "pending" || w.status === "in_progress")
    : all

  const sections = useMemo(() => groupByDue(items), [items])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["work"] })
  }

  function menuFor(work: WorkAssignment): ActionMenuItem[] {
    if (work.status === "completed" || work.status === "cancelled") return []

    const items: ActionMenuItem[] = []
    if (work.status === "pending") {
      items.push({
        label: "Start Work",
        icon: <Play size={16} color={palette.info.default} strokeWidth={2} />,
        color: palette.info.default,
        onPress: () => setStatusTarget({ work, intent: "in_progress" }),
      })
    }
    items.push({
      label: "Mark Completed",
      icon: <CheckCircle2 size={16} color={palette.success.default} strokeWidth={2} />,
      color: palette.success.default,
      onPress: () => setStatusTarget({ work, intent: "completed" }),
    })
    return items
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">My Work</AppText>
          <AppText variant="caption" color="tertiary">
            {items.length} {items.length === 1 ? "item" : "items"}
          </AppText>
        </View>
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => {
          const isActive = f.value === filter
          return (
            <Pressable key={f.value} onPress={() => setFilter(f.value)} style={styles.filterTab}>
              <AppText
                variant={isActive ? "bodyMedium" : "body"}
                style={{
                  color: (isActive ? colors.accent : colors.text.tertiary) as string,
                  paddingBottom: spacing[2],
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: colors.accent as string,
                }}
              >
                {f.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {all.length > 0 && <SummaryStrip items={all} />}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background.primary }]}>
            <AppText
              variant="caption"
              style={{
                color: (section.title === "Overdue" ? palette.error.default : colors.text.tertiary) as string,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: "600",
              }}
            >
              {section.title} · {section.data.length}
            </AppText>
          </View>
        )}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <WorkCard item={item} index={index} menuItems={menuFor(item)} />
          </AnimatedListItem>
        )}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
                <ClipboardList size={28} color={colors.text.tertiary} strokeWidth={1.5} />
              </View>
              <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                {filter === "open" ? "No open work — you're all caught up" : "Nothing here yet"}
              </AppText>
            </View>
          )
        }
      />

      {statusTarget && (
        <WorkStatusModal
          work={statusTarget.work}
          intent={statusTarget.intent}
          onClose={() => setStatusTarget(null)}
          onUpdated={invalidate}
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
    gap: spacing[3],
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },
  filterTab: { paddingTop: spacing[3] },

  summaryRow: {
    flexDirection: "row",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryTile: { flex: 1, alignItems: "center", gap: spacing[1] },

  sectionHeader: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },

  list: { paddingBottom: spacing[16] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
})
