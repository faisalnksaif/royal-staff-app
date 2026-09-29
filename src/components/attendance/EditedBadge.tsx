import { View, Pressable, StyleSheet } from "react-native"
import { PencilLine } from "lucide-react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { toTitleCase } from "../../utils/helpers"
import type { AttendanceRecord } from "../../types"

const ROLE_LABEL: Record<string, string> = {
  superAdmin: "Admin",
  manager: "Manager",
  hr: "HR",
}

export const EDIT_COLOR = palette.info.default

type Snapshot = { checkIn: string; checkOut: string | null }

/** What the latest manual edit did to one session, keyed by its position in the day. */
export interface SessionEditMark {
  inWas?: string | null
  outWas?: string | null
  added?: boolean
}

export interface EditMarks {
  bySession: Map<number, SessionEditMark> // sessionNumber (1-based) -> mark
  removed: Snapshot[]
}

export const fmtTime = (t: string | null | undefined) => (t ? moment(t).format("h:mm A") : "open")

const sameTime = (a: string | null, b: string | null) =>
  a === b || (!!a && !!b && moment(a).isSame(b, "minute"))

/**
 * Diffs the latest edit's before/after snapshots. Both are stored
 * chronologically (see editSessions on the backend), so sessions are paired by
 * position - which also lines up with the record's current sessionNumbers.
 */
export function editMarksFor(record: AttendanceRecord): EditMarks {
  const bySession = new Map<number, SessionEditMark>()
  const removed: Snapshot[] = []
  const edit = record.lastEdit
  if (!edit) return { bySession, removed }

  const before = edit.before ?? []
  const after = edit.after ?? []
  for (let i = 0; i < Math.max(before.length, after.length); i++) {
    const b = before[i]
    const a = after[i]
    if (b && a) {
      const mark: SessionEditMark = {}
      if (!sameTime(b.checkIn, a.checkIn)) mark.inWas = b.checkIn
      if (!sameTime(b.checkOut, a.checkOut)) mark.outWas = b.checkOut
      if ("inWas" in mark || "outWas" in mark) bySession.set(i + 1, mark)
    } else if (a) {
      bySession.set(i + 1, { added: true })
    } else if (b) {
      removed.push(b)
    }
  }
  return { bySession, removed }
}

/** Compact "Edited" pill for a card header. Pressing it (when given) opens the detail. */
export function EditedFlag({ record, onPress, small }: {
  record: AttendanceRecord
  onPress?: () => void
  small?: boolean
}) {
  if (!record.lastEdit) return null
  const count = record.editCount ?? 1
  const content = (
    <>
      <PencilLine size={small ? 10 : 11} color={EDIT_COLOR} strokeWidth={2} />
      <AppText variant="caption" style={{ color: EDIT_COLOR, fontSize: small ? 10 : 11 }}>
        Edited{count > 1 ? ` ×${count}` : ""}
      </AppText>
    </>
  )
  const style = [styles.pill, { backgroundColor: EDIT_COLOR + "1a" }, !small && { marginLeft: spacing[1] }]
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={4} style={style}>{content}</Pressable>
  ) : (
    <View style={style}>{content}</View>
  )
}

/** "was 1:34 PM" / "added" annotations shown beneath a session's times in a timeline. */
export function SessionEditNote({ mark, indent }: { mark: SessionEditMark | undefined; indent: number }) {
  if (!mark) return null
  const parts: string[] = []
  if (mark.added) parts.push("Added manually")
  if (mark.inWas !== undefined) parts.push(`In was ${fmtTime(mark.inWas)}`)
  if (mark.outWas !== undefined) parts.push(`Out was ${fmtTime(mark.outWas)}`)
  return (
    <AppText variant="caption" color="tertiary" style={{ marginLeft: indent, marginTop: -spacing[2], fontSize: 11 }}>
      {parts.join("  ·  ")}
    </AppText>
  )
}

/** One line saying who made the latest edit, when, and why - plus any sessions it removed. */
export function EditedFooter({ record }: { record: AttendanceRecord }) {
  const edit = record.lastEdit
  if (!edit) return null

  const who = edit.editedByName
    ? toTitleCase(edit.editedByName)
    : ROLE_LABEL[edit.editedByRole] ?? edit.editedByRole
  const when = moment(edit.editedAt).format("D MMM, h:mm A")
  const { removed } = editMarksFor(record)

  return (
    <View style={styles.footer}>
      <PencilLine size={12} color={EDIT_COLOR} strokeWidth={2} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="caption" color="secondary">
          {who} · {when}
          {edit.reason ? (
            <AppText variant="caption" color="primary">{"  —  "}“{edit.reason}”</AppText>
          ) : (
            <AppText variant="caption" color="tertiary">{"  —  "}no reason given</AppText>
          )}
        </AppText>
        {removed.map((s, i) => (
          <AppText key={i} variant="caption" color="tertiary" style={{ fontSize: 11 }}>
            Removed session{" "}
            <AppText variant="caption" color="tertiary" style={[styles.strike, { fontSize: 11 }]}>
              {fmtTime(s.checkIn)} – {fmtTime(s.checkOut)}
            </AppText>
          </AppText>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  footer: {
    flexDirection: "row",
    gap: spacing[2],
  },
  strike: {
    textDecorationLine: "line-through",
  },
})
