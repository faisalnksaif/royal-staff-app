import { View, Pressable, StyleSheet } from "react-native"
import { ChevronLeft, ChevronRight } from "lucide-react-native"
import moment from "moment"
import AppText from "../ui/AppText"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii } from "../../constants/theme"

interface Props {
  /** YYYY-MM */
  month: string
  onChange: (month: string) => void
  /** YYYY-MM; the next arrow is disabled at this month. */
  maxMonth?: string
}

export default function MonthNav({ month, onChange, maxMonth = moment().format("YYYY-MM") }: Props) {
  const { colors } = useTheme()
  const atMax = month >= maxMonth
  const shift = (n: number) => onChange(moment(month, "YYYY-MM").add(n, "month").format("YYYY-MM"))

  return (
    <View style={styles.nav}>
      <Pressable onPress={() => shift(-1)} hitSlop={10} style={[styles.arrow, { backgroundColor: colors.background.secondary }]}>
        <ChevronLeft size={18} color={colors.text.secondary} strokeWidth={2} />
      </Pressable>
      <View style={[styles.pill, { backgroundColor: colors.background.secondary }]}>
        <AppText variant="bodyMedium">{moment(month, "YYYY-MM").format("MMMM YYYY")}</AppText>
      </View>
      <Pressable
        onPress={() => !atMax && shift(1)}
        hitSlop={10}
        disabled={atMax}
        style={[styles.arrow, { backgroundColor: colors.background.secondary, opacity: atMax ? 0.35 : 1 }]}
      >
        <ChevronRight size={18} color={colors.text.secondary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  nav: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  arrow: { width: 34, height: 34, borderRadius: radii.full, alignItems: "center", justifyContent: "center" },
  pill: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radii.full, minWidth: 150, alignItems: "center" },
})
