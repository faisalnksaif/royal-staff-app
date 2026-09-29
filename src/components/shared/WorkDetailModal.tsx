import { useMemo, useState } from "react"
import { View, ScrollView, TextInput, StyleSheet } from "react-native"
import { useMutation } from "@tanstack/react-query"
import { Clock, MessageSquare, UserPlus } from "lucide-react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import AppButton from "../ui/AppButton"
import Popup from "./Popup"
import { useTheme } from "../../providers/ThemeProvider"
import { workScheduleService } from "../../services/workScheduleService"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { WORK_STATUS_CONFIG, WORK_PRIORITY_CONFIG, describeDue } from "../../utils/work"
import type { WorkAssignment, WorkStatus } from "../../types"

const MAX_NOTE_LENGTH = 1000

const STATUS_VERB: Record<WorkStatus, string> = {
  pending: "Reopened",
  in_progress: "Started work",
  completed: "Marked completed",
  cancelled: "Cancelled",
}

type TimelineEntry = {
  key: string
  at: string
  kind: "assigned" | "status" | "note"
  heading: string
  author: string | null
  body: string | null
  color: string
}

/**
 * Everything that happened to one work, oldest first - assignment, every
 * status change and every progress note merged into one feed, so the
 * assigner reads the story in order rather than piecing it together.
 */
function buildTimeline(work: WorkAssignment, nameFor: (id: number, name?: string | null) => string): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  if (work.createdAt) {
    entries.push({
      key: "assigned",
      at: work.createdAt,
      kind: "assigned",
      heading: "Assigned",
      author: nameFor(work.assignedByStaffId, work.assignedByName),
      body: null,
      color: palette.neutral[400],
    })
  }

  work.statusHistory.forEach((event, i) => {
    entries.push({
      key: `status-${i}`,
      at: event.at,
      kind: "status",
      heading: STATUS_VERB[event.status],
      author: nameFor(event.byStaffId, event.byName),
      body: event.note,
      color: WORK_STATUS_CONFIG[event.status].color,
    })
  })

  for (const note of work.notes ?? []) {
    entries.push({
      key: `note-${note._id}`,
      at: note.at,
      kind: "note",
      heading: "Note",
      author: nameFor(note.byStaffId, note.byName),
      body: note.text,
      color: palette.info.default,
    })
  }

  return entries.sort((a, b) => moment(a.at).valueOf() - moment(b.at).valueOf())
}

/**
 * Details and activity for one work occurrence. The assignee can post
 * progress notes here while it's open; everyone else reads the timeline.
 */
export default function WorkDetailModal({
  work,
  canAddNote,
  onClose,
  onUpdated,
}: {
  work: WorkAssignment
  /** True only for the assignee - the API rejects anyone else. */
  canAddNote: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const { colors } = useTheme()
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  // The POST returns the updated work, so the new note shows immediately
  // instead of waiting on the list refetch.
  const [latest, setLatest] = useState<WorkAssignment | null>(null)
  const current = latest ?? work

  const isOpen = current.status === "pending" || current.status === "in_progress"
  const status = WORK_STATUS_CONFIG[current.status]
  const due = describeDue(current)

  const nameFor = (id: number, name?: string | null) =>
    name ??
    (id === current.assigneeStaffId ? current.assigneeName : null) ??
    (id === current.assignedByStaffId ? current.assignedByName : null) ??
    `Staff #${id}`

  const timeline = useMemo(() => buildTimeline(current, nameFor), [current])

  const mutation = useMutation({
    mutationFn: () => workScheduleService.addNote(current._id, note.trim()),
    onSuccess: (updated) => {
      setLatest(updated)
      setNote("")
      onUpdated()
    },
    onError: (e: any) => setError(e?.message ?? "Could not add the note"),
  })

  const trimmed = note.trim()

  return (
    <Popup title="Work details" onClose={onClose} maxWidth={560}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ gap: spacing[4] }}>
        {/* Summary */}
        <View style={[styles.summaryBox, { backgroundColor: colors.background.secondary }]}>
          <AppText variant="bodyMedium">{current.title}</AppText>

          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: status.color + "22" }]}>
              <AppText variant="caption" style={[styles.pillText, { color: status.color }]}>{status.label}</AppText>
            </View>
            {current.priority !== "normal" && (
              <View style={[styles.pill, { backgroundColor: WORK_PRIORITY_CONFIG[current.priority].color + "22" }]}>
                <AppText variant="caption" style={[styles.pillText, { color: WORK_PRIORITY_CONFIG[current.priority].color }]}>
                  {WORK_PRIORITY_CONFIG[current.priority].label}
                </AppText>
              </View>
            )}
          </View>

          {!!current.description && (
            <AppText variant="bodySmall" style={{ color: colors.text.secondary as string }}>
              {current.description}
            </AppText>
          )}

          <View style={styles.metaRow}>
            <Clock size={13} color={due.isUrgent ? palette.error.default : colors.text.tertiary} strokeWidth={1.5} />
            <AppText
              variant="bodySmall"
              style={{ color: (due.isUrgent ? palette.error.default : colors.text.secondary) as string }}
            >
              Due {moment(current.deadline).format("ddd, D MMM · h:mm A")} · {due.label}
            </AppText>
          </View>

          <View style={styles.metaRow}>
            <UserPlus size={13} color={colors.text.tertiary} strokeWidth={1.5} />
            <AppText variant="bodySmall" style={{ color: colors.text.secondary as string, flex: 1 }}>
              {nameFor(current.assigneeStaffId, current.assigneeName)}
              <AppText variant="bodySmall" color="tertiary">
                {"  ·  by "}{nameFor(current.assignedByStaffId, current.assignedByName)}
              </AppText>
            </AppText>
          </View>
        </View>

        {/* Activity */}
        <View>
          <AppText variant="label" color="tertiary" style={{ marginBottom: spacing[3] }}>
            ACTIVITY
          </AppText>

          {timeline.length === 0 ? (
            <AppText variant="bodySmall" color="tertiary">No activity yet</AppText>
          ) : (
            timeline.map((entry, i) => {
              const isLast = i === timeline.length - 1
              return (
                <View key={entry.key} style={styles.entry}>
                  {/* Rail: dot + connector down to the next entry */}
                  <View style={styles.rail}>
                    <View style={[styles.dot, { backgroundColor: entry.color }]}>
                      {entry.kind === "note" && <MessageSquare size={9} color="#fff" strokeWidth={2.5} />}
                    </View>
                    {!isLast && <View style={[styles.connector, { backgroundColor: colors.border as string }]} />}
                  </View>

                  <View style={[styles.entryBody, !isLast && { paddingBottom: spacing[4] }]}>
                    <View style={styles.entryHeader}>
                      <AppText variant="bodySmall" style={{ fontWeight: "600", color: colors.text.primary as string }}>
                        {entry.heading}
                      </AppText>
                      {entry.author && (
                        <AppText variant="bodySmall" color="secondary" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {entry.author}
                        </AppText>
                      )}
                    </View>
                    <AppText variant="caption" color="tertiary">
                      {moment(entry.at).format("D MMM, h:mm A")} · {moment(entry.at).fromNow()}
                    </AppText>

                    {!!entry.body && (
                      <View
                        style={[
                          styles.bubble,
                          {
                            backgroundColor: colors.background.secondary,
                            borderLeftColor: entry.color,
                          },
                        ]}
                      >
                        <AppText variant="bodySmall" style={{ color: colors.text.primary as string }}>
                          {entry.body}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Composer - assignee only, while the work is still open. Closing
          notes belong to "Mark Completed", which records them as the
          completion note. */}
      {canAddNote && isOpen && (
        <View style={[styles.composer, { borderTopColor: colors.border as string }]}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border as string,
                color: colors.text.primary,
                backgroundColor: colors.background.secondary,
                outline: "none",
              } as any,
            ]}
            placeholder="Add a progress note…"
            placeholderTextColor={colors.text.tertiary}
            value={note}
            onChangeText={(t) => {
              setNote(t)
              if (error) setError(null)
            }}
            maxLength={MAX_NOTE_LENGTH}
            multiline
            textAlignVertical="top"
          />

          {error && (
            <AppText variant="caption" style={{ color: palette.error.default }}>{error}</AppText>
          )}

          <AppButton
            label={mutation.isPending ? "Saving…" : "Add Note"}
            onPress={() => {
              setError(null)
              mutation.mutate()
            }}
            disabled={!trimmed || mutation.isPending}
            size="sm"
          />
        </View>
      )}
    </Popup>
  )
}

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  summaryBox: { padding: spacing[3], borderRadius: radii.md, gap: spacing[2] },
  pillRow: { flexDirection: "row", gap: spacing[1] },
  pill: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.full },
  pillText: { fontSize: 10, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },

  entry: { flexDirection: "row", gap: spacing[3] },
  rail: { width: 16, alignItems: "center" },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  connector: { width: 2, flex: 1, marginTop: 2 },
  entryBody: { flex: 1, gap: 2 },
  entryHeader: { flexDirection: "row", alignItems: "baseline", gap: spacing[2] },
  bubble: {
    marginTop: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    borderLeftWidth: 3,
  },

  composer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing[3],
    fontSize: 14,
    minHeight: 64,
    maxHeight: 140,
  },
})
