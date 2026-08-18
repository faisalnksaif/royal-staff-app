import { useEffect, useState } from "react"
import { View, ScrollView, ActivityIndicator, StyleSheet, Pressable, Platform } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { Check, X, CircleCheck, Clock, ThumbsUp } from "lucide-react-native"
import AppText from "../../components/ui/AppText"
import AppButton from "../../components/ui/AppButton"
import AppCard from "../../components/ui/AppCard"
import { useTheme } from "../../providers/ThemeProvider"
import { spacing, radii, colors as palette } from "../../constants/theme"
import { feedbackService } from "../../services/feedbackService"
import { APP_CONFIG } from "../../constants/config"

type LoadState = "loading" | "ready" | "not-found" | "unavailable"

function getOrCreateDeviceFingerprint(): string {
  if (Platform.OS !== "web" || typeof window === "undefined") return ""
  try {
    const key = "rp_device_fp"
    let fp = window.localStorage.getItem(key)
    if (!fp) {
      fp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(key, fp)
    }
    return fp
  } catch {
    return ""
  }
}

export default function CustomerFeedbackScreen() {
  const { colors } = useTheme()
  const { token } = useLocalSearchParams<{ token: string }>()

  const [state, setState] = useState<LoadState>("loading")
  const [customerName, setCustomerName] = useState("")
  const [questions, setQuestions] = useState<{ questionId: string; text: string }[]>([])
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    feedbackService
      .getFeedbackByToken(token)
      .then((res) => {
        const data = res.data
        if (data.status !== "pending") {
          setState("unavailable")
          return
        }
        setCustomerName(data.customerName)
        setQuestions(data.questions)
        setState("ready")
      })
      .catch(() => setState("not-found"))
  }, [token])

  function toggle(questionId: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.questionId] !== undefined)

  async function handleSubmit() {
    if (!token || !allAnswered || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await feedbackService.submitFeedback(token, {
        answers: questions.map((q) => ({ questionId: q.questionId, answer: answers[q.questionId] })),
        deviceFingerprint: getOrCreateDeviceFingerprint(),
      })
      setSubmitted(true)
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <AppText variant="heading3" style={{ color: colors.accent }}>{APP_CONFIG.company ?? "Royal"}</AppText>
          <AppText variant="caption" color="tertiary">We'd love your feedback</AppText>
        </View>

        {state === "loading" && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        {state === "not-found" && (
          <View style={styles.center}>
            <AppText variant="heading3" style={{ textAlign: "center" }}>Link not found</AppText>
            <AppText color="tertiary" style={{ textAlign: "center", marginTop: spacing[2] }}>
              This feedback link doesn't look right. Please check with the store staff.
            </AppText>
          </View>
        )}

        {state === "unavailable" && !submitted && (
          <View style={styles.center}>
            <Clock size={40} color={colors.text.tertiary} strokeWidth={1.25} />
            <AppText variant="heading3" style={{ textAlign: "center", marginTop: spacing[3] }}>
              This link is no longer active
            </AppText>
            <AppText color="tertiary" style={{ textAlign: "center", marginTop: spacing[2] }}>
              It's already been used or has expired. Ask a staff member to send a new one if you'd still like to share feedback.
            </AppText>
          </View>
        )}

        {state === "ready" && !submitted && (
          <>
            <AppText variant="body" color="secondary" style={{ marginBottom: spacing[5] }}>
              Hi{customerName ? ` ${customerName}` : ""}, a couple of quick questions about your visit.
            </AppText>

            <View style={{ gap: spacing[3] }}>
              {questions.map((q, i) => {
                const value = answers[q.questionId]
                return (
                  <AppCard key={q.questionId} elevation="sm" style={styles.questionCard}>
                    <AppText variant="bodyMedium" style={{ marginBottom: spacing[3] }}>
                      {i + 1}. {q.text}
                    </AppText>
                    <View style={styles.answerRow}>
                      <Pressable
                        onPress={() => toggle(q.questionId, true)}
                        style={[
                          styles.answerBtn,
                          {
                            backgroundColor: value === true ? palette.success.default + "1f" : colors.background.secondary,
                            borderColor: value === true ? palette.success.default : colors.border,
                          },
                        ]}
                      >
                        <Check size={16} color={value === true ? palette.success.default : colors.text.secondary} strokeWidth={2.5} />
                        <AppText variant="bodyMedium" style={{ color: value === true ? palette.success.default : colors.text.secondary }}>
                          Yes
                        </AppText>
                      </Pressable>
                      <Pressable
                        onPress={() => toggle(q.questionId, false)}
                        style={[
                          styles.answerBtn,
                          {
                            backgroundColor: value === false ? palette.error.default + "1f" : colors.background.secondary,
                            borderColor: value === false ? palette.error.default : colors.border,
                          },
                        ]}
                      >
                        <X size={16} color={value === false ? palette.error.default : colors.text.secondary} strokeWidth={2.5} />
                        <AppText variant="bodyMedium" style={{ color: value === false ? palette.error.default : colors.text.secondary }}>
                          No
                        </AppText>
                      </Pressable>
                    </View>
                  </AppCard>
                )
              })}
            </View>

            {error && (
              <AppText variant="caption" style={{ color: palette.error.default, marginTop: spacing[3], textAlign: "center" }}>
                {error}
              </AppText>
            )}

            <AppButton
              label={submitting ? "Submitting…" : "Submit Feedback"}
              onPress={handleSubmit}
              disabled={!allAnswered || submitting}
              style={{ marginTop: spacing[5] }}
            />
          </>
        )}

        {submitted && (
          <View style={styles.center}>
            <CircleCheck size={48} color={palette.success.default} strokeWidth={1.5} />
            <AppText variant="heading3" style={{ textAlign: "center", marginTop: spacing[3] }}>
              Thank you!
            </AppText>
            <AppText color="tertiary" style={{ textAlign: "center", marginTop: spacing[2] }}>
              Your feedback has been submitted.
            </AppText>
            <ThumbsUp size={20} color={colors.accent} strokeWidth={1.5} style={{ marginTop: spacing[4] }} />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing[5],
    paddingTop: spacing[10],
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  brand: { alignItems: "center", marginBottom: spacing[8] },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: spacing[10] },
  questionCard: { padding: spacing[4] },
  answerRow: { flexDirection: "row", gap: spacing[3] },
  answerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
  },
})
