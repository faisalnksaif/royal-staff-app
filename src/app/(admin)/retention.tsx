import { formatAmount } from "../../utils/helpers"
import { useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Pressable } from "react-native"
import AppText from "../../components/ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { useRetention } from "../../hooks/useRetention"
import type { RetentionCustomer, RetentionStatus, RetentionResponse } from "../../types"
import { Search, ChevronRight } from "lucide-react-native"
import { useRouter } from "expo-router"

// ─── helpers ──────────────────────────────────────────────────────────────────


function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_LABEL: Record<RetentionStatus, string> = {
  active: "Active",
  at_risk: "At Risk",
  churned: "Inactive",
  never_purchased: "Never Purchased",
}

const STATUS_COLOR: Record<RetentionStatus, string> = {
  active: palette.success.default,
  at_risk: palette.warning.default,
  churned: palette.error.default,
  never_purchased: palette.neutral[500],
}

type FilterValue = "all" | RetentionStatus

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "at_risk", label: "At Risk" },
  { value: "churned", label: "Inactive" },
  { value: "never_purchased", label: "Never Purchased" },
]

// ─── summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  summary,
  onFilter,
  activeFilter,
}: {
  summary: RetentionResponse["summary"]
  onFilter: (s: FilterValue) => void
  activeFilter: FilterValue
}) {
  const { colors } = useTheme()

  const buckets: { key: FilterValue; label: string; count: number; color: string; pct?: string }[] = [
    { key: "active", label: "Active", count: summary.active, color: palette.success.default, pct: `${summary.active_pct.toFixed(0)}%` },
    { key: "at_risk", label: "At Risk", count: summary.at_risk, color: palette.warning.default },
    { key: "churned", label: "Inactive", count: summary.churned, color: palette.error.default, pct: `${summary.churn_pct.toFixed(0)}%` },
    { key: "never_purchased", label: "Never", count: summary.never_purchased, color: palette.neutral[500] },
  ]

  return (
    <View style={[styles.strip, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
      {buckets.map((b, i) => {
        const isActive = activeFilter === b.key
        return (
          <TouchableOpacity
            key={b.key}
            activeOpacity={0.7}
            onPress={() => onFilter(isActive ? "all" : b.key)}
            style={[styles.stripCell, isActive && { backgroundColor: b.color + "18" }, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}
          >
            <AppText variant="heading3" style={{ color: b.color }}>{formatAmount(b.count)}</AppText>
            <AppText variant="caption" color="tertiary">{b.label}</AppText>
            {b.pct && <AppText variant="caption" style={{ color: b.color, fontSize: 10 }}>{b.pct}</AppText>}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

// ─── customer row ─────────────────────────────────────────────────────────────

function CustomerRow({ customer }: { customer: RetentionCustomer }) {
  const { colors } = useTheme()
  const router = useRouter()
  const color = STATUS_COLOR[customer.status]

  function handlePress() {
    router.push({
      pathname: "/customer/[name]",
      params: {
        name: customer.name,
        totalBalance: "",
        drCr: "Dr",
        customerId: String(customer.ledger_id),
        mobile: customer.mobile ?? "",
        initialTab: "ledger",
      },
    })
  }

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <View style={[styles.row, { borderBottomColor: colors.border as string }]}>
      <View style={styles.rowMain}>
        <View style={styles.rowTop}>
          <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {customer.name}
          </AppText>
          <View style={[styles.statusPill, { backgroundColor: color + "18" }]}>
            <AppText variant="caption" numberOfLines={1} style={{ color, fontSize: 11 }}>
              {STATUS_LABEL[customer.status]}
            </AppText>
          </View>
          <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={1.75} />
        </View>
        <View style={styles.rowMeta}>
          {customer.days_since_last_purchase != null ? (
            <AppText variant="caption" color="secondary" style={{ fontSize: 12 }}>
              Last purchase{" "}
              <AppText variant="caption" style={{ color, fontSize: 12 }}>
                {customer.days_since_last_purchase}d ago
              </AppText>
            </AppText>
          ) : (
            <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>No purchases recorded</AppText>
          )}
          <AppText variant="caption" color="tertiary" style={{ fontSize: 12 }}>
            {customer.total_purchases} purchase{customer.total_purchases !== 1 ? "s" : ""}
          </AppText>
        </View>
        {customer.last_purchase_date && (
          <AppText variant="caption" color="tertiary" style={{ fontSize: 11 }}>
            Last: {formatDate(customer.last_purchase_date)}
          </AppText>
        )}
      </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function RetentionScreen() {
  const { colors } = useTheme()
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimer = useState<ReturnType<typeof setTimeout> | null>(null)

  function handleSearch(text: string) {
    setSearch(text)
    if (searchTimer[0]) clearTimeout(searchTimer[0])
    searchTimer[1](setTimeout(() => setDebouncedSearch(text), 350))
  }

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useRetention({
    status: activeFilter,
    search: debouncedSearch || undefined,
  })

  const customers = data?.pages.flatMap((p) => p.data) ?? []
  const summary = data?.pages[0]?.summary

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppText variant="heading2">Retention</AppText>
        <AppText variant="caption" color="tertiary">Based on Sales voucher activity</AppText>
      </View>

      {summary && (
        <SummaryStrip summary={summary} onFilter={setActiveFilter} activeFilter={activeFilter} />
      )}

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.value
          return (
            <TouchableOpacity
              key={f.value}
              activeOpacity={0.7}
              onPress={() => setActiveFilter(f.value)}
              style={[styles.filterTab, { borderBottomColor: isActive ? colors.accent : "transparent" }]}
            >
              <AppText
                variant={isActive ? "bodyMedium" : "body"}
                style={{ color: isActive ? colors.accent : colors.text.secondary, fontSize: 13 }}
              >
                {f.label}
              </AppText>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
        <Search size={15} color={colors.text.tertiary} strokeWidth={1.75} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search customers…"
          placeholderTextColor={colors.text.tertiary as string}
          style={[styles.searchInput, { color: colors.text.primary as string }]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : isError ? (
        <View style={styles.center}>
          <AppText color="secondary">Couldn't load retention data.</AppText>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={customers}
          keyExtractor={(item) => String(item.ledger_id)}
          renderItem={({ item }) => <CustomerRow customer={item} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.3}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage() }}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing[4] }} />
              : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color="tertiary">No customers found</AppText>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
  },
  strip: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stripCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    gap: 2,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  list: { paddingBottom: spacing[12] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
  row: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  rowMain: { gap: spacing[1] },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  statusPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
})
