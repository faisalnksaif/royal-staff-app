import { useRef, useState } from "react"
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Calendar, Check, X, Trash2, Pencil, MoreVertical } from "lucide-react-native"
import moment from "moment"
import BackButton from "../../components/shared/BackButton"
import AnimatedListItem from "../../components/shared/AnimatedListItem"
import DatePickerField from "../../components/shared/DatePickerField"
import Popup from "../../components/shared/Popup"
import ConfirmModal from "../../components/shared/ConfirmModal"
import ActionMenu, { ActionMenuAnchor } from "../../components/shared/ActionMenu"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import AppButton from "../../components/ui/AppButton"
import { useTheme } from "../../providers/ThemeProvider"
import { useTablet } from "../../hooks/useTablet"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { todoService } from "../../services/todoService"
import type { TodoResponse, TodoStatus, TodoPriority } from "../../types"

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TodoStatus, { label: string; color: string }> = {
  planned:   { label: "Planned",   color: palette.warning.default },
  done:      { label: "Done",      color: palette.success.default },
  cancelled: { label: "Cancelled", color: palette.error.default },
}

const PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string }> = {
  low:    { label: "Low",    color: palette.neutral[400] },
  normal: { label: "Normal", color: palette.warning.default },
  high:   { label: "High",   color: palette.error.default },
}

const FILTERS: Array<{ label: string; value: TodoStatus | "all" | "overdue" }> = [
  { label: "All",     value: "all" },
  { label: "Planned", value: "planned" },
  { label: "Overdue", value: "overdue" },
  { label: "Done",     value: "done" },
  { label: "Cancelled", value: "cancelled" },
]

function PrioritySelector({
  value,
  onChange,
}: {
  value: TodoPriority
  onChange: (p: TodoPriority) => void
}) {
  const { colors } = useTheme()
  const options: TodoPriority[] = ["low", "normal", "high"]

  return (
    <View style={{ flexDirection: "row", gap: spacing[2] }}>
      {options.map((p) => {
        const isActive = p === value
        const conf = PRIORITY_CONFIG[p]
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={[
              styles.priorityOption,
              {
                borderColor: isActive ? conf.color : colors.border as string,
                backgroundColor: isActive ? conf.color + "1a" : "transparent",
              },
            ]}
          >
            <AppText variant="caption" style={{ color: isActive ? conf.color : colors.text.secondary }}>
              {conf.label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── NewTodoModal ─────────────────────────────────────────────────────────────

function NewTodoModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [plannedFor, setPlannedFor] = useState<Date | null>(null)
  const [priority, setPriority] = useState<TodoPriority>("normal")
  const { colors } = useTheme()

  const mutation = useMutation({
    mutationFn: () => todoService.createTodo({
      title: title.trim(),
      notes: notes.trim() || undefined,
      plannedFor: plannedFor ? moment(plannedFor).format("YYYY-MM-DD") : undefined,
      priority,
    }),
    onSuccess: () => { onCreated(); onClose() },
  })

  function handleCreate() {
    if (!title.trim()) return
    mutation.mutate()
  }

  return (
    <Popup title="New Todo" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>Title</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="What needs to get done?"
          placeholderTextColor={colors.text.tertiary}
          value={title}
          onChangeText={setTitle}
        />

        <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>Notes (optional)</AppText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          placeholder="Any extra detail..."
          placeholderTextColor={colors.text.tertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <View style={{ marginTop: spacing[4] }}>
          <DatePickerField
            label="Planned for (optional)"
            value={plannedFor}
            onChange={setPlannedFor}
            placeholder="No date set"
          />
        </View>

        <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>Priority</AppText>
        <PrioritySelector value={priority} onChange={setPriority} />

        <AppButton
          label={mutation.isPending ? "Adding…" : "Add Todo"}
          onPress={handleCreate}
          disabled={!title.trim() || mutation.isPending}
          style={{ marginTop: spacing[5] }}
        />
        <View style={{ height: spacing[4] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── EditTodoModal ────────────────────────────────────────────────────────────

function EditTodoModal({
  todo,
  onClose,
  onSaved,
}: {
  todo: TodoResponse
  onClose: () => void
  onSaved: () => void
}) {
  const { colors } = useTheme()
  const [title, setTitle] = useState(todo.title)
  const [notes, setNotes] = useState(todo.notes ?? "")
  const [plannedFor, setPlannedFor] = useState<Date | null>(todo.plannedFor ? moment(todo.plannedFor).toDate() : null)
  const [priority, setPriority] = useState<TodoPriority>(todo.priority ?? "normal")

  const mutation = useMutation({
    mutationFn: () => todoService.updateTodo(todo._id, {
      title: title.trim(),
      notes: notes.trim() || null,
      plannedFor: plannedFor ? moment(plannedFor).format("YYYY-MM-DD") : null,
      priority,
    }),
    onSuccess: () => { onSaved(); onClose() },
  })

  return (
    <Popup title="Edit Todo" onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="caption" color="tertiary" style={{ marginBottom: spacing[2] }}>Title</AppText>
        <TextInput
          style={[styles.input, { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          value={title}
          onChangeText={setTitle}
        />

        <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>Notes</AppText>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <View style={{ marginTop: spacing[4] }}>
          <DatePickerField
            label="Planned for"
            value={plannedFor}
            onChange={setPlannedFor}
            placeholder="No date set"
          />
        </View>

        <AppText variant="caption" color="tertiary" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>Priority</AppText>
        <PrioritySelector value={priority} onChange={setPriority} />

        <AppButton
          label={mutation.isPending ? "Saving…" : "Save Changes"}
          onPress={() => mutation.mutate()}
          disabled={!title.trim() || mutation.isPending}
          style={{ marginTop: spacing[5] }}
        />
        <View style={{ height: spacing[4] }} />
      </ScrollView>
    </Popup>
  )
}

// ─── CompleteModal ────────────────────────────────────────────────────────────

function CompleteModal({
  todo,
  onClose,
  onCompleted,
}: {
  todo: TodoResponse
  onClose: () => void
  onCompleted: () => void
}) {
  const { colors } = useTheme()
  const [actionNote, setActionNote] = useState("")

  const mutation = useMutation({
    mutationFn: () => todoService.completeTodo(todo._id, "done", actionNote.trim() || undefined),
    onSuccess: () => { onCompleted(); onClose() },
  })

  return (
    <Popup title="Mark as Done" onClose={onClose}>
      <AppText variant="body" color="secondary" style={{ marginBottom: spacing[4] }}>
        What did you actually do? (optional)
      </AppText>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: colors.border as string, color: colors.text.primary, backgroundColor: colors.background.secondary, outline: "none" } as any]}
        placeholder="e.g. Called vendor, shipment arriving Monday"
        placeholderTextColor={colors.text.tertiary}
        value={actionNote}
        onChangeText={setActionNote}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <AppButton
        label={mutation.isPending ? "Saving…" : "Mark Done"}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
        style={{ marginTop: spacing[4] }}
      />
    </Popup>
  )
}

// ─── TodoCard ─────────────────────────────────────────────────────────────────

function TodoCard({
  item,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
}: {
  item: TodoResponse
  onEdit: () => void
  onComplete: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  const { colors } = useTheme()
  const status = STATUS_CONFIG[item.status]
  const isPlanned = item.status === "planned"
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<ActionMenuAnchor | null>(null)
  const menuBtnRef = useRef<View>(null)

  function openMenu() {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height })
      setMenuOpen(true)
    })
  }

  const menuItems = isPlanned
    ? [
        { label: "Edit", icon: <Pencil size={16} color={colors.text.secondary} strokeWidth={1.75} />, onPress: onEdit },
        { label: "Mark Done", icon: <Check size={16} color={palette.success.default} strokeWidth={2.5} />, color: palette.success.default, onPress: onComplete },
        { label: "Cancel", icon: <X size={16} color={palette.error.default} strokeWidth={2} />, color: palette.error.default, onPress: onCancel },
      ]
    : [
        { label: "Delete", icon: <Trash2 size={16} color={palette.error.default} strokeWidth={1.75} />, color: palette.error.default, onPress: onDelete },
      ]

  return (
    <AppCard elevation="sm" style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <AppText
            variant="bodyMedium"
            style={item.status !== "planned" ? { textDecorationLine: "line-through", opacity: 0.6 } : undefined}
          >
            {item.title}
          </AppText>
          {item.notes ? (
            <AppText variant="caption" color="tertiary" numberOfLines={2}>{item.notes}</AppText>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], marginTop: spacing[1] }}>
            <View style={[styles.statusBadge, { backgroundColor: status.color + "22" }]}>
              <AppText variant="caption" style={{ color: status.color, fontSize: 11 }}>{status.label}</AppText>
            </View>
            {item.priority && item.priority !== "normal" && (
              <View style={[styles.statusBadge, { backgroundColor: PRIORITY_CONFIG[item.priority].color + "22" }]}>
                <AppText variant="caption" style={{ color: PRIORITY_CONFIG[item.priority].color, fontSize: 11 }}>
                  {PRIORITY_CONFIG[item.priority].label}
                </AppText>
              </View>
            )}
            {item.plannedFor && (
              <View style={styles.metaRow}>
                <Calendar size={12} color={colors.text.tertiary} strokeWidth={1.5} />
                <AppText variant="caption" color="tertiary">{moment(item.plannedFor).format("D MMM")}</AppText>
              </View>
            )}
          </View>
          {item.status === "done" && item.actionNote ? (
            <AppText variant="caption" color="secondary" style={{ marginTop: spacing[1] }}>
              {item.actionNote}
            </AppText>
          ) : null}
        </View>
        <View ref={menuBtnRef} collapsable={false}>
          <Pressable onPress={openMenu} hitSlop={8} style={styles.menuBtn}>
            <MoreVertical size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      <ActionMenu visible={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} anchor={menuAnchor} />
    </AppCard>
  )
}

// ─── TodoScreen ───────────────────────────────────────────────────────────────

export default function TodoScreen() {
  const { colors } = useTheme()
  const { isTablet, isDesktop } = useTablet()
  const numColumns = isDesktop ? 2 : 1
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<TodoStatus | "all" | "overdue">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TodoResponse | null>(null)
  const [completeTarget, setCompleteTarget] = useState<TodoResponse | null>(null)
  const [cancelTarget, setCancelTarget] = useState<TodoResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TodoResponse | null>(null)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["todos", filter],
    queryFn: () => {
      if (filter === "all") return todoService.getTodos()
      if (filter === "overdue") return todoService.getTodos({ overdue: true })
      return todoService.getTodos({ status: filter })
    },
  })

  const todos = data?.data ?? []

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["todos"] })
  }

  const cancelMutation = useMutation({
    mutationFn: (id: string) => todoService.completeTodo(id, "cancelled"),
    onSuccess: () => { invalidate(); setCancelTarget(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => todoService.deleteTodo(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
  })

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isTablet && <BackButton />}
        <View style={{ flex: 1 }}>
          <AppText variant="heading3">Todo</AppText>
          <AppText variant="caption" color="tertiary">{data?.count ?? 0} total</AppText>
        </View>
        <Pressable onPress={() => setCreateOpen(true)} hitSlop={8} style={styles.addBtn}>
          <Plus size={20} color={colors.accent} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => {
          const isActive = f.value === filter
          return (
            <Pressable key={f.value} onPress={() => setFilter(f.value)} style={styles.filterTab}>
              <AppText
                variant={isActive ? "bodyMedium" : "body"}
                style={{
                  color: isActive ? colors.accent : colors.text.tertiary,
                  paddingBottom: spacing[2],
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: colors.accent,
                }}
              >
                {f.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      <FlatList
        key={`todo-grid-${numColumns}`}
        data={todos}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        keyExtractor={(item, index) => item._id ?? `todo-${index}`}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index} style={numColumns > 1 ? styles.gridCell : undefined}>
            <TodoCard
              item={item}
              onEdit={() => setEditTarget(item)}
              onComplete={() => setCompleteTarget(item)}
              onCancel={() => setCancelTarget(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          </AnimatedListItem>
        )}
        contentContainerStyle={[styles.list, isDesktop && styles.listDesktop]}
        ItemSeparatorComponent={numColumns > 1 ? undefined : () => <View style={{ height: spacing[3] }} />}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
          ) : (
            <View style={styles.center}>
              <AppText color="tertiary">No todos yet</AppText>
            </View>
          )
        }
      />

      {createOpen && (
        <NewTodoModal onClose={() => setCreateOpen(false)} onCreated={invalidate} />
      )}

      {editTarget && (
        <EditTodoModal todo={editTarget} onClose={() => setEditTarget(null)} onSaved={invalidate} />
      )}

      {completeTarget && (
        <CompleteModal todo={completeTarget} onClose={() => setCompleteTarget(null)} onCompleted={invalidate} />
      )}

      <ConfirmModal
        visible={cancelTarget != null}
        title="Cancel Todo"
        message="This will mark the todo as cancelled. You can't undo this."
        confirmLabel="Cancel Todo"
        onConfirm={() => { if (cancelTarget) cancelMutation.mutate(cancelTarget._id) }}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmModal
        visible={deleteTarget != null}
        title="Delete Todo"
        message="This will permanently delete this todo."
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget._id) }}
        onCancel={() => setDeleteTarget(null)}
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
  addBtn: { padding: spacing[2] },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[5],
  },
  filterTab: { paddingTop: spacing[3] },

  list: { padding: spacing[4], paddingBottom: spacing[16] },
  listDesktop: {
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  gridRow: { gap: spacing[4], marginBottom: spacing[4] },
  gridCell: { flex: 1 },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },

  card: { padding: 0, overflow: "hidden" },
  cardTop: { padding: spacing[4], flexDirection: "row", alignItems: "flex-start" },
  menuBtn: { padding: spacing[1] },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[1] },

  priorityOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
  },

  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
})
