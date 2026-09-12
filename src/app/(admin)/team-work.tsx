import { useMemo, useState } from "react"
import { View, FlatList, ActivityIndicator, Pressable, StyleSheet } from "react-native"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { useLocalSearchParams } from "expo-router"
import { Plus, XCircle, Repeat, ClipboardList, StopCircle, Play, CheckCircle2 } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import WorkCard from "../../components/shared/WorkCard"
import AssignWorkModal from "../../components/shared/AssignWorkModal"
import WorkStatusModal from "../../components/shared/WorkStatusModal"
import ConfirmModal from "../../components/shared/ConfirmModal"
import ListRow from "../../components/shared/ListRow"
import type { ActionMenuItem } from "../../components/shared/ActionMenu"
import AppText from "../../components/ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { useRole } from "../../hooks/useRole"
import { useAssignedWork, useMyWork, useWorkSchedules, useAssignableStaff } from "../../hooks/useWork"
import { workScheduleService } from "../../services/workScheduleService"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { describeRecurrence, isOverdue } from "../../utils/work"
import type { WorkAssignment, WorkScheduleResponse, WorkStatus } from "../../types"

type Tab = "mine" | "assigned" | "recurring"

const STATUS_FILTERS: Array<{ label: string; value: WorkStatus | "all" | "open" }> = [
  { label: "Open", value: "open" },
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
]

/** Progress tiles for a set of work - used for both incoming and outgoing. */
function TeamSummary({ items }: { items: WorkAssignment[] }) {
  const { colors } = useTheme()

  const stats = useMemo(() => {
    const open = items.filter((w) => w.status === "pending" || w.status === "in_progress")
    const completed = items.filter((w) => w.status === "completed")
    return {
      overdue: open.filter(isOverdue).length,
      open: open.length,
      completed: completed.length,
      late: completed.filter((w) => w.isLate).length,
    }
  }, [items])

  const tiles = [
    { label: "Overdue", value: stats.overdue, color: palette.error.default },
    { label: "Open", value: stats.open, color: colors.text.primary as string },
    { label: "Done", value: stats.completed, color: palette.success.default },
    { label: "Late", value: stats.late, color: palette.warning.default },
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

export default function TeamWorkScreen() {
  const { colors, isDark } = useTheme()
  const { isTablet } = useTablet()
  const { isSuperAdmin } = useRole()
  const queryClient = useQueryClient()

  // A work push deep-links here with ?tab= so the notification opens on the
  // side it concerns - incoming work vs work you handed out.
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>()
  const [tab, setTab] = useState<Tab>(tabParam === "assigned" ? "assigned" : "mine")
  const [statusTarget, setStatusTarget] = useState<{
    work: WorkAssignment
    intent: "in_progress" | "completed"
  } | null>(null)
  const [filter, setFilter] = useState<WorkStatus | "all" | "open">("open")
  const [assignOpen, setAssignOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<WorkAssignment | null>(null)
  const [stopTarget, setStopTarget] = useState<WorkScheduleResponse | null>(null)

  const statusFilter = filter === "all" || filter === "open" ? {} : { status: filter }

  // SuperAdmin oversees every assignment; managers/HR see what they assigned.
  const { data, isLoading, refetch, isRefetching } = useAssignedWork({
    ...statusFilter,
    ...(isSuperAdmin ? { all: true } : {}),
  })

  // Work assigned TO this admin - a super admin can schedule work for a
  // manager or HR, and they need somewhere to see and action it.
  const {
    data: myData,
    isLoading: myLoading,
    refetch: refetchMine,
    isRefetching: myRefetching,
  } = useMyWork(statusFilter)

  const { data: schedulesData, isLoading: schedulesLoading } = useWorkSchedules(true)
  const { data: assignable } = useAssignableStaff()

  // Assignments carry only staffId, so names come from the assignable list.
  const nameByStaffId = useMemo(() => {
    const map = new Map<number, string>()
    for (const person of assignable?.data ?? []) map.set(person.staffId, person.name)
    return map
  }, [assignable])

  const onlyOpen = (list: WorkAssignment[]) =>
    filter === "open" ? list.filter((w) => w.status === "pending" || w.status === "in_progress") : list

  const all = data?.data ?? []
  const items = onlyOpen(all)

  const myAll = myData?.data ?? []
  const myItems = onlyOpen(myAll)

  const schedules = (schedulesData?.data ?? []).filter((s) => s.recurrence.frequency !== "none")

  // A work's recurrence label lives on its schedule, not the occurrence.
  const scheduleById = useMemo(() => {
    const map = new Map<string, WorkScheduleResponse>()
    for (const s of schedulesData?.data ?? []) map.set(s._id, s)
    return map
  }, [schedulesData])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["work"] })
  }

  const cancelMutation = useMutation({
    mutationFn: (id: string) => workScheduleService.updateStatus(id, "cancelled"),
    onSuccess: () => {
      invalidate()
      setCancelTarget(null)
    },
  })

  const stopMutation = useMutation({
    mutationFn: (id: string) => workScheduleService.cancelSchedule(id),
    onSuccess: () => {
      invalidate()
      setStopTarget(null)
    },
  })

  /** Assignee actions - for work assigned TO this admin. */
  function myMenuFor(work: WorkAssignment): ActionMenuItem[] {
    if (work.status === "completed" || work.status === "cancelled") return []

    const menu: ActionMenuItem[] = []
    if (work.status === "pending") {
      menu.push({
        label: "Start Work",
        icon: <Play size={16} color={palette.info.default} strokeWidth={2} />,
        color: palette.info.default,
        onPress: () => setStatusTarget({ work, intent: "in_progress" }),
      })
    }
    menu.push({
      label: "Mark Completed",
      icon: <CheckCircle2 size={16} color={palette.success.default} strokeWidth={2} />,
      color: palette.success.default,
      onPress: () => setStatusTarget({ work, intent: "completed" }),
    })
    return menu
  }

  /** Assigner actions - for work this admin handed out. */
  function menuFor(work: WorkAssignment): ActionMenuItem[] {
    if (work.status === "completed" || work.status === "cancelled") return []
    return [
      {
        label: "Cancel Work",
        icon: <XCircle size={16} color={palette.error.default} strokeWidth={1.75} />,
        color: palette.error.default,
        onPress: () => setCancelTarget(work),
      },
    ]
  }

  const avatarColor = isDark ? colors.accent : palette.primary[700]
  const avatarBgColor = isDark ? colors.accentSubtle : palette.primary[100]

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Team Work</AppText>
          <AppText variant="caption" color="tertiary">
            {tab === "recurring"
              ? `${schedules.length} recurring`
              : tab === "mine"
                ? `${myItems.length} assigned to me`
                : `${items.length} ${items.length === 1 ? "item" : "items"}`}
          </AppText>
        </View>
        {/* Assigning is an outgoing action - not offered while viewing your
            own incoming work. */}
        {tab !== "mine" && (
          <Pressable onPress={() => setAssignOpen(true)} hitSlop={8} style={styles.addBtn}>
            <Plus size={20} color={colors.accent} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Assignments vs the recurring rules that produce them */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {([
          { key: "mine", label: "My Work" },
          { key: "assigned", label: "Assigned by Me" },
          { key: "recurring", label: "Recurring" },
        ] as Array<{ key: Tab; label: string }>).map((t) => {
          const isActive = t.key === tab
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tabItem}>
              <AppText
                variant={isActive ? "bodyMedium" : "body"}
                style={{
                  color: (isActive ? colors.accent : colors.text.tertiary) as string,
                  paddingBottom: spacing[2],
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: colors.accent as string,
                }}
              >
                {t.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      {tab !== "recurring" ? (
        <>
          <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
            {STATUS_FILTERS.map((f) => {
              const isActive = f.value === filter
              return (
                <Pressable key={f.value} onPress={() => setFilter(f.value)} style={styles.filterTab}>
                  <AppText
                    variant="caption"
                    style={{
                      color: (isActive ? colors.accent : colors.text.tertiary) as string,
                      fontWeight: isActive ? "600" : "400",
                    }}
                  >
                    {f.label}
                  </AppText>
                </Pressable>
              )
            })}
          </View>

          {(tab === "mine" ? myAll : all).length > 0 && (
            <TeamSummary items={tab === "mine" ? myAll : all} />
          )}

          <FlatList
            data={tab === "mine" ? myItems : items}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => {
              const schedule = scheduleById.get(item.scheduleId)
              return (
                <AnimatedListItem index={index}>
                  <WorkCard
                    item={item}
                    index={index}
                    // On "my work" the assignee is me, so showing my own name
                    // is noise - the assigned list is where it matters.
                    assigneeName={tab === "mine" ? undefined : nameByStaffId.get(item.assigneeStaffId)}
                    recurrenceLabel={schedule ? describeRecurrence(schedule.recurrence) : undefined}
                    dueTime={schedule?.dueTime}
                    menuItems={tab === "mine" ? myMenuFor(item) : menuFor(item)}
                    isBusy={cancelMutation.isPending && cancelTarget?._id === item._id}
                  />
                </AnimatedListItem>
              )
            }}
            contentContainerStyle={styles.list}
            refreshing={tab === "mine" ? myRefetching : isRefetching}
            onRefresh={tab === "mine" ? refetchMine : refetch}
            ListEmptyComponent={
              (tab === "mine" ? myLoading : isLoading) ? (
                <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
              ) : (
                <View style={styles.center}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
                    <ClipboardList size={28} color={colors.text.tertiary} strokeWidth={1.5} />
                  </View>
                  <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                    {tab === "mine" ? "No work assigned to you" : "No work assigned yet"}
                  </AppText>
                  {tab === "assigned" && (
                    <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[1] }}>
                      Tap + to schedule work for your team
                    </AppText>
                  )}
                </View>
              )
            }
          />
        </>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <ListRow
                number={index + 1}
                avatarColor={avatarColor}
                avatarBgColor={avatarBgColor}
                title={item.title}
                pills={[
                  {
                    key: "recurrence",
                    label: describeRecurrence(item.recurrence),
                    color: colors.accent as string,
                    bgColor: colors.accentSubtle as string,
                  },
                ]}
                menuItems={[
                  {
                    label: "Stop Repeating",
                    icon: <StopCircle size={16} color={palette.error.default} strokeWidth={1.75} />,
                    color: palette.error.default,
                    onPress: () => setStopTarget(item),
                  },
                ]}
                metaLines={[
                  <View key="assignee" style={styles.metaRow}>
                    <Repeat size={13} color={colors.text.tertiary} strokeWidth={1.5} />
                    <AppText variant="bodySmall" style={{ color: colors.text.secondary as string }}>
                      {nameByStaffId.get(item.assigneeStaffId) ?? `Staff #${item.assigneeStaffId}`}
                      {item.recurrence.until ? ` · until ${moment(item.recurrence.until).format("D MMM")}` : ""}
                    </AppText>
                  </View>,
                ]}
              />
            </AnimatedListItem>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            schedulesLoading ? (
              <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
            ) : (
              <View style={styles.center}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
                  <Repeat size={28} color={colors.text.tertiary} strokeWidth={1.5} />
                </View>
                <AppText color="tertiary" style={{ marginTop: spacing[3] }}>
                  No recurring work
                </AppText>
              </View>
            )
          }
        />
      )}

      {assignOpen && (
        <AssignWorkModal onClose={() => setAssignOpen(false)} onCreated={invalidate} />
      )}

      {statusTarget && (
        <WorkStatusModal
          work={statusTarget.work}
          intent={statusTarget.intent}
          onClose={() => setStatusTarget(null)}
          onUpdated={invalidate}
        />
      )}

      <ConfirmModal
        visible={cancelTarget != null}
        title="Cancel Work"
        message="This marks the work cancelled for the assignee. It stays in the history."
        confirmLabel="Cancel Work"
        onConfirm={() => { if (cancelTarget) cancelMutation.mutate(cancelTarget._id) }}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmModal
        visible={stopTarget != null}
        title="Stop Repeating"
        message="No new occurrences will be created. Upcoming untouched ones are removed; completed work stays in the history."
        confirmLabel="Stop"
        onConfirm={() => { if (stopTarget) stopMutation.mutate(stopTarget._id) }}
        onCancel={() => setStopTarget(null)}
      />
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
  addBtn: { padding: spacing[2] },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },
  tabItem: { paddingTop: spacing[3] },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[4],
  },
  filterTab: {},

  summaryRow: {
    flexDirection: "row",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryTile: { flex: 1, alignItems: "center", gap: spacing[1] },

  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },

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
