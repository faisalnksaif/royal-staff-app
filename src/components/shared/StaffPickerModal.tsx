import { useState } from "react"
import { View, Modal, Pressable, TouchableOpacity, TextInput, ScrollView, StyleSheet } from "react-native"
import { Search, X } from "lucide-react-native"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"
import type { StaffOption } from "../../services/mappingService"

export default function StaffPickerModal({
  visible,
  staff,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean
  staff: StaffOption[]
  current: number | null
  onSelect: (s: StaffOption) => void
  onClose: () => void
}) {
  const { colors } = useTheme()
  const [q, setQ] = useState("")
  const filtered = q.trim()
    ? staff.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : staff

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalBox, { backgroundColor: colors.background.primary, borderColor: colors.border as string }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <AppText variant="bodyMedium">Assign Staff</AppText>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={18} color={colors.text.tertiary} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchBox, { borderColor: colors.border as string, backgroundColor: colors.background.secondary }]}>
            <Search size={14} color={colors.text.tertiary} strokeWidth={1.75} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary as string }]}
              placeholder="Search staff..."
              placeholderTextColor={colors.text.tertiary as string}
              value={q}
              onChangeText={setQ}
              autoFocus
            />
          </View>
          <ScrollView style={styles.modalList}>
            {filtered.map((s) => {
              const active = s.staff_id === current
              return (
                <TouchableOpacity
                  key={s.staff_id}
                  onPress={() => { onSelect(s); setQ("") }}
                  style={[styles.staffOption, active && { backgroundColor: colors.accent + "18" }]}
                >
                  <AppText variant="body" style={{ color: active ? colors.accent : colors.text.primary }}>{s.name}</AppText>
                  {active && <AppText variant="caption" color="accent">Current</AppText>}
                </TouchableOpacity>
              )
            })}
            {filtered.length === 0 && (
              <AppText variant="caption" color="tertiary" style={{ padding: spacing[4], textAlign: "center" }}>No staff found</AppText>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    width: 360,
    maxHeight: 480,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    margin: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Geist_400Regular",
    padding: 0,
    ...({ outlineStyle: "none" } as object),
  },
  modalList: { maxHeight: 320 },
  staffOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
})
