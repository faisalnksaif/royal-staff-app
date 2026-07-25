import { formatAmount } from "../../utils/helpers"
import { useState, useRef, useMemo } from "react"
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from "react-native"
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, ChevronDown, X } from "lucide-react-native"
import DrawerMenuButton from "../../components/shared/DrawerMenuButton"
import AppText from "../../components/ui/AppText"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { mappingService, type CustomerMapping, type StaffOption } from "../../services/mappingService"

const PAGE_SIZE = 50


// ─── Staff picker modal ───────────────────────────────────────────────────────

function StaffPickerModal({
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
        <Pressable style={[styles.modalBox, { backgroundColor: colors.background.primary, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <AppText variant="bodyMedium">Assign Staff</AppText>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={18} color={colors.text.tertiary} strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}>
            <Search size={14} color={colors.text.tertiary} strokeWidth={1.75} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Search staff..."
              placeholderTextColor={colors.text.tertiary}
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

// ─── Row ──────────────────────────────────────────────────────────────────────

function MappingRow({
  item,
  staff,
  onReassign,
}: {
  item: CustomerMapping
  staff: StaffOption[]
  onReassign: (ledgerId: number, current: number | null) => void
}) {
  const { colors } = useTheme()
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.customerCol}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <AppText variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1 }}>{item.name}</AppText>
          {item.is_new && (
            <View style={[styles.badge, { backgroundColor: palette.info.default + "22" }]}>
              <AppText variant="caption" style={{ color: palette.info.default, fontSize: 9 }}>New</AppText>
            </View>
          )}
          {item.ownership_source === "unassigned" && (
            <View style={[styles.badge, { backgroundColor: palette.error.default + "22" }]}>
              <AppText variant="caption" style={{ color: palette.error.default, fontSize: 9 }}>Unassigned</AppText>
            </View>
          )}
          {item.ownership_source === "dynamic" && (
            <View style={[styles.badge, { backgroundColor: palette.warning.default + "22" }]}>
              <AppText variant="caption" style={{ color: palette.warning.default, fontSize: 9 }}>Dynamic</AppText>
            </View>
          )}
        </View>
        {item.mobile && <AppText variant="caption" color="tertiary">{item.mobile}</AppText>}
      </View>
      <AppText variant="caption" style={[styles.balanceCol, { color: palette.error.default }]}>
        ₹{formatAmount(item.balance)}
      </AppText>
      <TouchableOpacity
        style={[styles.staffCol, styles.assignBtn, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}
        onPress={() => onReassign(item.ledger_id, item.assigned_staff_id)}
        activeOpacity={0.7}
      >
        <AppText variant="caption" style={{ flex: 1, color: item.assigned_staff_name ? colors.text.primary : colors.text.tertiary }} numberOfLines={1}>
          {item.assigned_staff_name ?? "Unassigned"}
        </AppText>
        <ChevronDown size={12} color={colors.text.tertiary} strokeWidth={1.75} />
      </TouchableOpacity>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MappingsScreen() {
  const { colors } = useTheme()
  const qc = useQueryClient()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ownership, setOwnership] = useState<"all" | "assigned" | "dynamic" | "unassigned">("all")
  const [sortBy, setSortBy] = useState<"created_at" | "balance" | "name">("created_at")
  const [order, setOrder] = useState<"asc" | "desc">("desc")

  const [pickerVisible, setPickerVisible] = useState(false)
  const [pickerLedgerId, setPickerLedgerId] = useState<number | null>(null)
  const [pickerCurrentStaffId, setPickerCurrentStaffId] = useState<number | null>(null)

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["mappings", debouncedSearch, ownership, sortBy, order],
    queryFn: ({ pageParam }) =>
      mappingService.getMappings({ page: pageParam, limit: PAGE_SIZE, search: debouncedSearch || undefined, ownership, sortBy, order }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages ? lastPage.pagination.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  })

  const { data: staffData } = useQuery({
    queryKey: ["staff-options"],
    queryFn: () => mappingService.getStaffOptions(),
    staleTime: 10 * 60 * 1000,
  })

  const staff = staffData ?? []
  const items = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])
  const total = data?.pages[0]?.pagination.total

  const { mutate: reassign, isPending: isReassigning } = useMutation({
    mutationFn: ({ ledgerId, staffId }: { ledgerId: number; staffId: number }) =>
      mappingService.reassign(ledgerId, staffId),
    onSuccess: (updated) => {
      qc.setQueryData<typeof data>(["mappings", debouncedSearch], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) =>
              m.ledger_id === updated.ledger_id
                ? { ...m, assigned_staff_id: updated.assigned_staff_id, assigned_staff_name: updated.assigned_staff_name }
                : m
            ),
          })),
        }
      })
      setPickerVisible(false)
    },
  })

  function handleSearchChange(text: string) {
    setSearch(text)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text), 400)
  }

  function openPicker(ledgerId: number, currentStaffId: number | null) {
    setPickerLedgerId(ledgerId)
    setPickerCurrentStaffId(currentStaffId)
    setPickerVisible(true)
  }

  function handleSelect(s: StaffOption) {
    if (!pickerLedgerId) return
    reassign({ ledgerId: pickerLedgerId, staffId: s.staff_id })
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <DrawerMenuButton />
        <View>
          <AppText variant="heading2">Customer Mapping</AppText>
          <AppText variant="caption" color="secondary">
            {total != null ? `${total} customers` : "Assign staff to customers"}
          </AppText>
        </View>
        {isReassigning && <ActivityIndicator size="small" color={colors.accent} />}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background.secondary }]}>
          <Search size={16} color={colors.text.tertiary} strokeWidth={1.75} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search customer or staff..."
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={handleSearchChange}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")} hitSlop={8}>
              <X size={14} color={colors.text.tertiary} strokeWidth={1.75} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filterWrap, { borderBottomColor: colors.border as string }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["all", "assigned", "dynamic", "unassigned"] as const).map((v) => {
            const active = ownership === v
            return (
              <TouchableOpacity key={v} onPress={() => setOwnership(v)}
                style={[styles.chip, { borderColor: active ? colors.accent as string : colors.border as string, backgroundColor: active ? (colors.accent as string) + "18" : "transparent" }]}>
                <AppText variant="caption" style={{ color: active ? colors.accent as string : colors.text.secondary as string }}>
                  {v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
                </AppText>
              </TouchableOpacity>
            )
          })}
          <View style={[styles.chip, { borderColor: "transparent", marginLeft: spacing[2] }]}>
            <AppText variant="caption" color="tertiary">Sort:</AppText>
          </View>
          {(["created_at", "balance", "name"] as const).map((v) => {
            const active = sortBy === v
            return (
              <TouchableOpacity key={v} onPress={() => {
                if (active) setOrder(o => o === "desc" ? "asc" : "desc")
                else { setSortBy(v); setOrder("desc") }
              }}
                style={[styles.chip, { borderColor: active ? colors.accent as string : colors.border as string, backgroundColor: active ? (colors.accent as string) + "18" : "transparent" }]}>
                <AppText variant="caption" style={{ color: active ? colors.accent as string : colors.text.secondary as string }}>
                  {v === "created_at" ? "Newest" : v.charAt(0).toUpperCase() + v.slice(1)}
                  {active ? (order === "desc" ? " ↓" : " ↑") : ""}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Table header */}
      <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
        <AppText variant="caption" color="tertiary" style={styles.customerCol}>CUSTOMER</AppText>
        <AppText variant="caption" color="tertiary" style={styles.balanceCol}>BALANCE</AppText>
        <AppText variant="caption" color="tertiary" style={styles.staffCol}>ASSIGNED STAFF</AppText>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <AppText variant="body" color="secondary">Failed to load mappings.</AppText>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: spacing[3] }}>
            <AppText variant="bodyMedium" color="accent">Retry</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.ledger_id)}
          renderItem={({ item }) => (
            <MappingRow item={item} staff={staff} onReassign={openPicker} />
          )}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText variant="body" color="secondary">No customers found.</AppText>
            </View>
          }
        />
      )}

      {/* Staff picker */}
      <StaffPickerModal
        visible={pickerVisible}
        staff={staff}
        current={pickerCurrentStaffId}
        onSelect={handleSelect}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  filterRow: { flexDirection: "row", gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[2], alignItems: "center" },
  chip: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  badge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 99 },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[5],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchWrap: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
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
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  customerCol: { flex: 2, marginRight: spacing[3] },
  balanceCol: { width: 80, textAlign: "right", marginRight: spacing[3] },
  staffCol: { flex: 1.5 },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[8],
  },
  footerLoader: {
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  // modal
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
  modalList: { maxHeight: 320 },
  staffOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
})
