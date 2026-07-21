import { useState } from "react"
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useTablet } from "../../../hooks/useTablet"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useQueryClient } from "@tanstack/react-query"
import DatePickerField from "../../../components/shared/DatePickerField"
import ContactMethodIcon from "../../../components/shared/ContactMethodIcon"
import {
  ChevronLeft,
  MessageCircle,
} from "lucide-react-native"
import AppText from "../../../components/ui/AppText"
import AppInput from "../../../components/ui/AppInput"
import AppButton from "../../../components/ui/AppButton"
import { useTheme } from "../../../providers/ThemeProvider"
import { spacing, colors as palette, radii } from "../../../constants/theme"
import { fontFamilies } from "../../../constants/fonts"
import useAuthStore from "../../../stores/useAuthStore"
import Toast from "react-native-toast-message"
import { followupService } from "../../../services/followupService"
import { toAPIDate, formatAmount } from "../../../utils/helpers"
import type { ContactMethod, FollowUpOutcome } from "../../../types"

// ─── constants ───────────────────────────────────────────────────────────────

const CONTACT_OPTIONS: { method: ContactMethod; label: string }[] = [
  { method: "phoneCall", label: "Phone" },
  { method: "sms", label: "SMS" },
  { method: "email", label: "Email" },
  { method: "inPerson", label: "In Person" },
  { method: "whatsapp", label: "WhatsApp" },
]

const OUTCOME_OPTIONS: {
  value: FollowUpOutcome
  label: string
  description: string
  color: string
}[] = [
  {
    value: "promisedToPay",
    label: "Promised Full Payment",
    description: "Customer committed to clearing the full balance",
    color: palette.success.default,
  },
  {
    value: "promisedPartial",
    label: "Promised Partial Payment",
    description: "Customer will pay part of the outstanding amount",
    color: palette.warning.default,
  },
  {
    value: "noResponse",
    label: "No Response",
    description: "Could not reach the customer",
    color: palette.neutral[500],
  },
  {
    value: "dispute",
    label: "Dispute",
    description: "Customer disputes the bill or amount",
    color: palette.error.default,
  },
]

const QUICK_REMARKS_OPTIONS = [
  "Customer was busy",
  "Left voicemail",
  "Customer requested callback",
  "Customer out of station",
  "Needs more time",
  "Bank transfer pending",
  "Cheque being prepared",
  "Spoke to family member",
]

// ─── helpers ─────────────────────────────────────────────────────────────────


// ─── sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <AppText
      variant="label"
      color="tertiary"
      style={{ letterSpacing: 1, marginBottom: spacing[3] }}
    >
      {label}
    </AppText>
  )
}



// ─── screen ──────────────────────────────────────────────────────────────────

export default function AddFollowupScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const user = useAuthStore((s) => s.user)
  const { name, totalBalance, customerId } = useLocalSearchParams<{ name: string; totalBalance: string; customerId: string }>()

  const [contactMethod, setContactMethod] = useState<ContactMethod | null>(null)
  const [outcome, setOutcome] = useState<FollowUpOutcome | null>(null)
  const [promisedAmount, setPromisedAmount] = useState("")
  const [promisedDate, setPromisedDate] = useState<Date | null>(null)
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | null>(null)
  const [selectedRemarks, setSelectedRemarks] = useState<string[]>([])
  const [freeRemark, setFreeRemark] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const showPromisedSection = outcome === "promisedToPay" || outcome === "promisedPartial"
  const showPromisedAmount = outcome === "promisedPartial"

  function toggleRemark(remark: string) {
    setSelectedRemarks((prev) =>
      prev.includes(remark) ? prev.filter((r) => r !== remark) : [...prev, remark]
    )
  }

  function showError(message: string) {
    Toast.show({ type: "error", text1: message })
  }

  async function handleSubmit() {
    if (!contactMethod) {
      showError("Please select how you contacted the customer.")
      return
    }
    if (!outcome) {
      showError("Please select the outcome of this contact.")
      return
    }
    if (showPromisedSection && !promisedDate) {
      showError("Please enter the promised payment date.")
      return
    }
    if (showPromisedAmount && !promisedAmount) {
      showError("Please enter the promised amount.")
      return
    }

    setIsLoading(true)

    try {
      await followupService.createFollowup({
        customerId: customerId ?? name,
        customerName: name,
        staffId: user?.user_id ?? 0,
        userId: user?.user_id ?? undefined,
        staffName: user?.name ?? "",
        contactMethod,
        outcome,
        promisedAmount: outcome === "promisedToPay" ? Number(totalBalance) : promisedAmount ? Number(promisedAmount) : undefined,
        promisedDate: promisedDate ? toAPIDate(promisedDate) : null,
        nextFollowUpDate: nextFollowUpDate ? toAPIDate(nextFollowUpDate) : null,
        quickRemarks: selectedRemarks.length > 0 ? selectedRemarks : undefined,
        freeTextRemark: freeRemark.trim() || null,
      })
      await queryClient.invalidateQueries({ queryKey: ["staff-followups"] })
      await queryClient.invalidateQueries({ queryKey: ["customer-followups", customerId] })
      await queryClient.invalidateQueries({ queryKey: ["staff-outstanding"] })
      router.back()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? "Failed to save. Please try again."
      showError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={isTablet ? styles.desktopContent : styles.mobileContent}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft size={24} color={colors.text.primary} strokeWidth={1.75} />
          </Pressable>
          <View style={styles.headerInfo}>
            <AppText variant="heading3">Log Follow-up</AppText>
            <View style={styles.headerRow}>
              <AppText variant="caption" color="secondary" style={{ flex: 1 }}>
                {name}
              </AppText>
              {totalBalance && (
                <AppText variant="mono" style={{ color: palette.error.default, fontSize: 14 }}>
                  ₹{formatAmount(Number(totalBalance))}
                </AppText>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Contact Method ── */}
          <View style={styles.section}>
            <SectionLabel label="HOW DID YOU CONTACT?" />
            <View style={styles.contactRow}>
              {CONTACT_OPTIONS.map(({ method, label }) => {
                const active = contactMethod === method
                return (
                  <Pressable
                    key={method}
                    onPress={() => setContactMethod(method)}
                    style={[
                      styles.contactPill,
                      {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active
                          ? colors.accentSubtle
                          : colors.background.secondary,
                      },
                    ]}
                  >
                    <ContactMethodIcon
                      method={method}
                      color={active ? colors.accent : colors.text.tertiary}
                    />
                    <AppText
                      variant="caption"
                      style={{ color: active ? colors.accent : colors.text.secondary }}
                    >
                      {label}
                    </AppText>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* ── Outcome ── */}
          <View style={styles.section}>
            <SectionLabel label="WHAT IS THE OUTCOME?" />
            <View style={styles.outcomeList}>
              {OUTCOME_OPTIONS.map(({ value, label, description, color }) => {
                const active = outcome === value
                return (
                  <Pressable
                    key={value}
                    onPress={() => setOutcome(value)}
                    style={[
                      styles.outcomeRow,
                      {
                        borderColor: active ? color : colors.border,
                        backgroundColor: active
                          ? color + "18"
                          : colors.background.secondary,
                      },
                    ]}
                  >
                    <View
                      style={[styles.radio, { borderColor: active ? color : colors.border }]}
                    >
                      {active && (
                        <View style={[styles.radioInner, { backgroundColor: color }]} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="bodyMedium"
                        style={{ color: active ? color : colors.text.primary }}
                      >
                        {label}
                      </AppText>
                      <AppText variant="caption" color="secondary">
                        {description}
                      </AppText>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* ── Payment Promise (conditional) ── */}
          {showPromisedSection && (
            <View style={styles.section}>
              <SectionLabel label="PAYMENT PROMISE" />
              {showPromisedAmount && (
                <>
                  <AppInput
                    label="Promised Amount (₹)"
                    value={promisedAmount}
                    onChangeText={setPromisedAmount}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <View style={{ height: spacing[3] }} />
                </>
              )}
              <DatePickerField
                label="Promised Date"
                value={promisedDate}
                onChange={setPromisedDate}
                placeholder="Select date"
              />
            </View>
          )}

          {/* ── Next Follow-up Date ── */}
          {/* <View style={styles.section}>
            <SectionLabel label="NEXT FOLLOW-UP DATE (OPTIONAL)" />
            <DatePickerField
              value={nextFollowUpDate}
              onChange={setNextFollowUpDate}
              placeholder="Select date"
            />
          </View> */}

          {/* ── Quick Remarks ── */}
          <View style={styles.section}>
            <SectionLabel label="QUICK REMARKS" />
            <View style={styles.chipsWrap}>
              {QUICK_REMARKS_OPTIONS.map((remark) => {
                const active = selectedRemarks.includes(remark)
                return (
                  <Pressable
                    key={remark}
                    onPress={() => toggleRemark(remark)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? colors.accent : colors.border,
                        backgroundColor: active
                          ? colors.accentSubtle
                          : colors.background.secondary,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{ color: active ? colors.accent : colors.text.secondary }}
                    >
                      {remark}
                    </AppText>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* ── Other Remarks ── */}
          <View style={styles.section}>
            <SectionLabel label="OTHER REMARKS (OPTIONAL)" />
            <View
              style={[
                styles.textarea,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background.secondary,
                },
              ]}
            >
              <TextInput
                value={freeRemark}
                onChangeText={setFreeRemark}
                placeholder="Add any additional notes..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[styles.textareaInput, { color: colors.text.primary }]}
              />
            </View>
          </View>

          {/* ── Submit ── */}
          <AppButton
            label="Save Follow-up"
            onPress={handleSubmit}
            isLoading={isLoading}
            size="lg"
            style={{ marginTop: spacing[2] }}
          />
          <View style={{ height: spacing[10] }} />
        </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mobileContent: { flex: 1 },
  desktopContent: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
  },
  backBtn: { padding: spacing[2] },
  headerInfo: { flex: 1, gap: spacing[1] },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  content: {
    padding: spacing[5],
  },
  section: {
    marginBottom: spacing[6],
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  contactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[2] + 2,
    paddingHorizontal: spacing[4],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  outcomeList: {
    gap: spacing[2],
  },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    borderWidth: 1,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[4],
    minHeight: 108,
  },
  textareaInput: {
    fontSize: 16,
    fontFamily: fontFamilies.sans.regular,
    lineHeight: 24,
    minHeight: 80,
    ...({ outlineStyle: "none" } as object),
  },
})
