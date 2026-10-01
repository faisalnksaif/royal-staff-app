import { useMemo, useState } from "react"
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Pressable } from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { ChevronDown, ChevronUp, Search, Users, Info, ExternalLink, ArrowUp, ArrowDown } from "lucide-react-native"
import moment from "moment"
import AppText from "../../components/ui/AppText"
import BackButton from "../../components/shared/BackButton"
import RefreshButton from "../../components/shared/RefreshButton"
import ErrorRetry from "../../components/shared/ErrorRetry"
import MonthNav from "../../components/shared/MonthNav"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { useSalesCollectionDetail } from "../../hooks/useSalesCollection"
import { formatAmount, toTitleCase } from "../../utils/helpers"
import type { SalesCollectionBill, SalesCollectionBillReceipt } from "../../types"

type BillFilter = "all" | "unpaid" | "partly" | "paid" | "shared"

const FILTERS: { value: BillFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Not collected" },
  { value: "partly", label: "Part collected" },
  { value: "paid", label: "Fully collected" },
  { value: "shared", label: "Shared payments" },
]

type SortField = "date" | "amount" | "collected" | "pending" | "customer"

const SORTS: { value: SortField; label: string; defaultDir: 1 | -1 }[] = [
  { value: "date", label: "Date", defaultDir: 1 },
  { value: "amount", label: "Bill amount", defaultDir: -1 },
  { value: "collected", label: "Collected", defaultDir: -1 },
  { value: "pending", label: "Not collected", defaultDir: -1 },
  { value: "customer", label: "Customer", defaultDir: 1 },
]

function compareBills(a: SalesCollectionBill, b: SalesCollectionBill, field: SortField): number {
  switch (field) {
    case "date": return a.date.localeCompare(b.date)
    case "amount": return a.amount - b.amount
    case "collected": return a.collected - b.collected
    case "pending": return a.pending - b.pending
    case "customer": return a.customerName.localeCompare(b.customerName)
  }
}

function billStatus(b: SalesCollectionBill): Exclude<BillFilter, "all" | "shared"> {
  if (b.collected <= 0) return "unpaid"
  if (b.pending > 0.5) return "partly"
  return "paid"
}

const STATUS_STYLE = {
  unpaid: { label: "Not collected", color: palette.error.default },
  partly: { label: "Part collected", color: palette.warning.default },
  paid: { label: "Collected", color: palette.success.default },
}

function formatDay(d: string) {
  return moment(d, "YYYY-MM-DD").format("D MMM")
}

function displayName(name: string, isStaff = true) {
  return isStaff ? toTitleCase(name) : name
}

function ReceiptRow({ receipt, executiveKey }: { receipt: SalesCollectionBillReceipt; executiveKey: string }) {
  const { colors } = useTheme()
  const others = receipt.shares.filter((s) => s.executiveKey !== executiveKey)
  const ownOtherBills = receipt.shares.filter((s) => s.executiveKey === executiveKey).length - 1

  return (
    <View style={[styles.receipt, { borderLeftColor: receipt.isShared ? palette.warning.default : palette.success.default }]}>
      <View style={styles.receiptTop}>
        <AppText variant="body" style={{ flex: 1 }}>
          {formatDay(receipt.date)} · Receipt {receipt.voucherNumber ?? receipt.voucherId}
        </AppText>
        <AppText variant="bodyMedium" style={{ color: palette.success.default }}>₹{formatAmount(receipt.allocated)}</AppText>
      </View>
      <AppText variant="caption" color="tertiary">
        {receipt.allocated < receipt.receiptAmount - 0.5
          ? `₹${formatAmount(receipt.allocated)} of a ₹${formatAmount(receipt.receiptAmount)} payment went to this bill`
          : `Whole ₹${formatAmount(receipt.receiptAmount)} payment went to this bill`}
        {ownOtherBills > 0 ? ` · also paid ${ownOtherBills} more of their bill${ownOtherBills !== 1 ? "s" : ""}` : ""}
      </AppText>

      {others.length > 0 && (
        <View style={[styles.shareBox, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.shareTitle}>
            <Users size={12} color={palette.warning.default} strokeWidth={2} />
            <AppText variant="caption" style={{ color: palette.warning.default }}>Shared with</AppText>
          </View>
          {others.map((s) => (
            <AppText key={s.billVoucherId} variant="caption" color="secondary">
              {displayName(s.executiveName, !s.executiveKey.startsWith("name:") && s.executiveKey !== "unscraped")} — ₹{formatAmount(s.amount)}
              <AppText variant="caption" color="tertiary"> for bill {s.billNumber ?? s.billVoucherId} ({formatDay(s.billDate)})</AppText>
            </AppText>
          ))}
        </View>
      )}
    </View>
  )
}

function BillRow({ bill, executiveKey }: { bill: SalesCollectionBill; executiveKey: string }) {
  const { colors } = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const status = STATUS_STYLE[billStatus(bill)]
  const shared = bill.receipts.some((r) => r.isShared)

  return (
    <View style={[styles.bill, { borderBottomColor: colors.border as string }]}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen((v) => !v)} style={{ gap: spacing[1] }}>
        <View style={styles.billTop}>
          <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>{bill.customerName}</AppText>
          <View style={[styles.pill, { backgroundColor: status.color + "18" }]}>
            <AppText variant="caption" style={{ color: status.color, fontSize: 11 }}>{status.label}</AppText>
          </View>
          {open
            ? <ChevronUp size={16} color={colors.text.tertiary} strokeWidth={1.75} />
            : <ChevronDown size={16} color={colors.text.tertiary} strokeWidth={1.75} />}
        </View>
        <View style={styles.billMeta}>
          <AppText variant="caption" color="tertiary" style={{ flex: 1 }}>
            {formatDay(bill.date)} · {bill.voucherNumber ?? bill.voucherId}
            {shared ? " · shared" : ""}
          </AppText>
          <AppText variant="caption" color="secondary">
            ₹{formatAmount(bill.amount)}
            <AppText variant="caption" style={{ color: palette.success.default }}>  ₹{formatAmount(bill.collected)} collected</AppText>
          </AppText>
        </View>
      </TouchableOpacity>

      {open && (
        <View style={styles.billBody}>
          {bill.receipts.length === 0 ? (
            <AppText variant="caption" color="tertiary">
              No payment counted towards this bill{bill.windowOpen ? " yet" : ""}.
            </AppText>
          ) : (
            bill.receipts.map((r) => <ReceiptRow key={r.voucherId} receipt={r} executiveKey={executiveKey} />)
          )}

          <AppText variant="caption" color="tertiary">
            {bill.pending > 0.5 ? `₹${formatAmount(bill.pending)} not collected · ` : ""}
            Payments count until {moment(bill.windowEndsOn, "YYYY-MM-DD").format("D MMM YYYY")}
            {bill.windowOpen ? " (still open)" : ""}
          </AppText>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/customer/[name]",
                params: { name: bill.customerName, totalBalance: "", drCr: "Dr", customerId: String(bill.ledgerId), mobile: "", initialTab: "ledger" },
              })
            }
            style={styles.ledgerLink}
          >
            <ExternalLink size={12} color={colors.accent} strokeWidth={2} />
            <AppText variant="caption" color="accent">Open customer ledger</AppText>
          </Pressable>
        </View>
      )}
    </View>
  )
}

export default function SalesCollectionDetailScreen() {
  const { colors } = useTheme()
  const params = useLocalSearchParams<{ key: string; month?: string }>()
  const [month, setMonth] = useState(() =>
    params.month && moment(params.month, "YYYY-MM", true).isValid() ? params.month : moment().subtract(1, "month").format("YYYY-MM"),
  )
  const [filter, setFilter] = useState<BillFilter>("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<{ field: SortField; dir: 1 | -1 }>({ field: "date", dir: 1 })

  function pickSort(field: SortField) {
    setSort((cur) =>
      cur.field === field ? { field, dir: cur.dir === 1 ? -1 : 1 } : { field, dir: SORTS.find((s) => s.value === field)!.defaultDir },
    )
  }

  const { data, isLoading, isError, error, refetch, isRefetching } = useSalesCollectionDetail(params.key, month)
  const exec = data?.executive

  const counts = useMemo(() => {
    const c = { all: 0, unpaid: 0, partly: 0, paid: 0, shared: 0 }
    for (const b of data?.bills ?? []) {
      c.all++
      c[billStatus(b)]++
      if (b.receipts.some((r) => r.isShared)) c.shared++
    }
    return c
  }, [data?.bills])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.bills ?? [])
      .filter((b) => {
        if (filter === "shared" ? !b.receipts.some((r) => r.isShared) : filter !== "all" && billStatus(b) !== filter) return false
        return !q || b.customerName.toLowerCase().includes(q) || (b.voucherNumber ?? "").toLowerCase().includes(q)
      })
      // Date as the tiebreak keeps equal amounts / same customer in bill order.
      .sort((a, b) => sort.dir * compareBills(a, b, sort.field) || compareBills(a, b, "date"))
  }, [data?.bills, filter, search, sort])

  // A month with no bills for this executive comes back 404.
  const noSales = isError && (error as any)?.code === "404"

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <AppText variant="heading3" numberOfLines={1}>
            {exec ? displayName(exec.name, exec.isStaff) : "Sales & Collection"}
          </AppText>
          <AppText variant="caption" color="tertiary">Bills and the payments counted towards them</AppText>
        </View>
        <RefreshButton onPress={() => refetch()} isRefreshing={isRefetching} />
      </View>

      <View style={[styles.controls, { borderBottomColor: colors.border }]}>
        <MonthNav month={month} onChange={setMonth} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.center} />
      ) : noSales ? (
        <View style={styles.center}>
          <AppText color="tertiary">No sales in {moment(month, "YYYY-MM").format("MMMM YYYY")}</AppText>
        </View>
      ) : isError || !data || !exec ? (
        <ErrorRetry message="Couldn't load bills." onRetry={refetch} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visible}
          keyExtractor={(b) => String(b.voucherId)}
          renderItem={({ item }) => <BillRow bill={item} executiveKey={exec.key} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <View style={[styles.strip, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
                <View style={styles.stripCell}>
                  <AppText variant="heading3">₹{formatAmount(exec.sales)}</AppText>
                  <AppText variant="caption" color="tertiary">Sales · {exec.bills} bills</AppText>
                </View>
                <View style={[styles.stripCell, styles.stripDivider, { borderLeftColor: colors.border }]}>
                  <AppText variant="heading3" style={{ color: palette.success.default }}>₹{formatAmount(exec.collected)}</AppText>
                  <AppText variant="caption" color="tertiary">
                    Collected · {exec.sales > 0 ? Math.round((exec.collected / exec.sales) * 100) : 0}%
                  </AppText>
                </View>
                <View style={[styles.stripCell, styles.stripDivider, { borderLeftColor: colors.border }]}>
                  <AppText variant="heading3" style={{ color: palette.error.default }}>₹{formatAmount(exec.sales - exec.collected)}</AppText>
                  <AppText variant="caption" color="tertiary">Not collected</AppText>
                </View>
                {exec.isStaff && (
                  <View style={[styles.stripCell, styles.stripDivider, { borderLeftColor: colors.border }]}>
                    <AppText variant="heading3" style={{ color: palette.primary[500] }}>
                      ₹{exec.incentive.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </AppText>
                    <AppText variant="caption" color="tertiary">Incentive · {data.incentiveRate * 100}%</AppText>
                  </View>
                )}
              </View>

              {exec.sharedCollected > 0 && (
                <View style={[styles.note, { backgroundColor: palette.warning.default + "14" }]}>
                  <Users size={14} color={palette.warning.default} strokeWidth={2} />
                  <AppText variant="caption" style={{ flex: 1, color: palette.warning.default }}>
                    ₹{formatAmount(exec.sharedCollected)} came from {exec.sharedReceipts} payment{exec.sharedReceipts !== 1 ? "s" : ""} that also paid other people's bills for the same customer.
                  </AppText>
                </View>
              )}
              {data.windowOpen && (
                <View style={[styles.note, { backgroundColor: palette.warning.default + "14" }]}>
                  <Info size={14} color={palette.warning.default} strokeWidth={2} />
                  <AppText variant="caption" style={{ flex: 1, color: palette.warning.default }}>
                    Still counting: payments up to {moment(data.windowClosesOn, "YYYY-MM-DD").format("D MMM YYYY")} can add to these bills.
                  </AppText>
                </View>
              )}

              <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
                {FILTERS.map((f) => {
                  const active = filter === f.value
                  return (
                    <TouchableOpacity
                      key={f.value}
                      activeOpacity={0.7}
                      onPress={() => setFilter(f.value)}
                      style={[styles.filterTab, { borderBottomColor: active ? colors.accent : "transparent" }]}
                    >
                      <AppText variant={active ? "bodyMedium" : "body"} style={{ color: active ? colors.accent : colors.text.secondary, fontSize: 13 }}>
                        {f.label} ({counts[f.value]})
                      </AppText>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={[styles.searchWrap, { borderBottomColor: colors.border, backgroundColor: colors.background.secondary }]}>
                <Search size={15} color={colors.text.tertiary} strokeWidth={1.75} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search customer or bill no…"
                  placeholderTextColor={colors.text.tertiary as string}
                  style={[styles.searchInput, { color: colors.text.primary as string }]}
                />
              </View>

              <View style={[styles.sortRow, { borderBottomColor: colors.border }]}>
                <AppText variant="caption" color="tertiary">Sort</AppText>
                {SORTS.map((o) => {
                  const active = sort.field === o.value
                  const Arrow = sort.dir === 1 ? ArrowUp : ArrowDown
                  return (
                    <Pressable
                      key={o.value}
                      onPress={() => pickSort(o.value)}
                      style={[
                        styles.sortChip,
                        { borderColor: active ? colors.accent : (colors.border as string), backgroundColor: active ? colors.accentSubtle : "transparent" },
                      ]}
                    >
                      <AppText variant="caption" style={{ color: active ? colors.accent : colors.text.secondary }}>{o.label}</AppText>
                      {active && <Arrow size={12} color={colors.accent} strokeWidth={2} />}
                    </Pressable>
                  )
                })}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText color="tertiary">No bills match</AppText>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  strip: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  stripCell: { flex: 1, alignItems: "center", paddingVertical: spacing[3], gap: 2 },
  stripDivider: { borderLeftWidth: StyleSheet.hairlineWidth },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: { paddingHorizontal: spacing[3], paddingVertical: spacing[3], borderBottomWidth: 2 },
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
    // Web draws a browser focus ring around the input; the search row is the affordance here.
    ...({ outlineStyle: "none" } as object),
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  list: { paddingBottom: spacing[12] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[16] },
  bill: { paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderBottomWidth: 1 },
  billTop: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  billMeta: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  billBody: { marginTop: spacing[3], gap: spacing[3] },
  pill: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.sm },
  receipt: { borderLeftWidth: 3, paddingLeft: spacing[3], gap: 2 },
  receiptTop: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  shareBox: { marginTop: spacing[2], padding: spacing[2], borderRadius: radii.md, gap: 2 },
  shareTitle: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  ledgerLink: { flexDirection: "row", alignItems: "center", gap: spacing[1], alignSelf: "flex-start" },
})
