import { useState, useRef } from "react"
import { View, Pressable, StyleSheet } from "react-native"
import { MoreVertical, CheckCircle, XCircle } from "lucide-react-native"
import ActionMenu, { ActionMenuItem, ActionMenuAnchor } from "../shared/ActionMenu"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../constants/theme"
import { formatWorkHours } from "./helpers"
import type { AttendanceRecord } from "../../types"

export default function OvertimeDecisionChip({
  record, onApprove, onReject,
}: {
  record: AttendanceRecord
  onApprove: (record: AttendanceRecord) => void
  onReject: (record: AttendanceRecord) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<ActionMenuAnchor | null>(null)
  const btnRef = useRef<View>(null)
  const pending = record.pendingOvertimeMinutes ?? 0

  function openMenu() {
    btnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height })
      setMenuOpen(true)
    })
  }

  const items: ActionMenuItem[] = [
    {
      label: "Approve overtime",
      icon: <CheckCircle size={18} color={palette.success.default} strokeWidth={2} />,
      onPress: () => onApprove(record),
    },
    {
      label: "Reject overtime",
      icon: <XCircle size={18} color={palette.error.default} strokeWidth={2} />,
      color: palette.error.default,
      onPress: () => onReject(record),
    },
  ]

  return (
    <View ref={btnRef} collapsable={false}>
      <Pressable
        onPress={openMenu}
        hitSlop={4}
        style={[styles.otChip, { backgroundColor: palette.warning.default + "1a" }]}
      >
        <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 11 }}>
          {formatWorkHours(pending / 60)} OT pending
        </AppText>
        <MoreVertical size={13} color={palette.warning.default} strokeWidth={2} />
      </Pressable>
      <ActionMenu visible={menuOpen} onClose={() => setMenuOpen(false)} items={items} anchor={menuAnchor} />
    </View>
  )
}

const styles = StyleSheet.create({
  otChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
    marginLeft: spacing[1],
  },
})
