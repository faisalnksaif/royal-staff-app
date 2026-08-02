import { useState, useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
} from "react-native"
import { useRouter } from "expo-router"
import { LogOut, LogIn, CheckCircle, AlertTriangle, ScanFace, ChevronUp, ChevronDown, History } from "lucide-react-native"
import moment from "moment"
import AppText from "../components/ui/AppText"
import AppCard from "../components/ui/AppCard"
import AttendanceScanModal from "../components/shared/AttendanceScanModal"
import ConfirmModal from "../components/shared/ConfirmModal"
import AnimatedListItem from "../components/shared/AnimatedListItem"
import StaffAvatar from "../components/shared/StaffAvatar"
import { useTheme } from "../providers/ThemeProvider"
import { useTablet } from "../hooks/useTablet"
import { useRole } from "../hooks/useRole"
import { useRecentScans } from "../hooks/useRecentScans"
import { spacing, colors as palette, radii } from "../constants/theme"
import { toTitleCase } from "../utils/helpers"
import useAuthStore from "../stores/useAuthStore"
import type { RecentScanEvent } from "../types"

const SHEET_PEEK = 88

// ─── Clock ──────────────────────────────────────────────────────────────────

function LiveClock({ color }: { color: string }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15)
    return () => clearInterval(id)
  }, [])
  return (
    <View style={{ alignItems: "center" }}>
      <AppText variant="heading1" style={{ color, fontVariant: ["tabular-nums"] }}>
        {moment(now).format("h:mm A")}
      </AppText>
      <AppText variant="body" style={{ color, opacity: 0.6, marginTop: spacing[1] }}>
        {moment(now).format("dddd, D MMMM")}
      </AppText>
    </View>
  )
}

// ─── ScanEventRow ───────────────────────────────────────────────────────────

function ScanEventRow({ item }: { item: RecentScanEvent }) {
  const { colors } = useTheme()
  const isCheckIn = item.action === "checkIn"
  return (
    <AppCard elevation="none" style={[styles.eventCard, { borderColor: colors.border as string }]}>
      <StaffAvatar name={item.staffName} color={colors.accent} bgColor={colors.accentSubtle} size={38} />
      <View style={{ flex: 1, gap: spacing[1] }}>
        <AppText variant="bodyMedium" numberOfLines={1}>{toTitleCase(item.staffName)}</AppText>
        <View style={styles.eventMetaRow}>
          {isCheckIn ? (
            <LogIn size={12} color={palette.success.default} strokeWidth={2.25} />
          ) : (
            <LogOut size={12} color={palette.warning.default} strokeWidth={2.25} />
          )}
          <AppText variant="caption" color="secondary">
            {isCheckIn ? "Checked in" : "Checked out"}
          </AppText>
          <AppText variant="caption" color="tertiary" style={{ fontVariant: ["tabular-nums"] }}>
            {"  ·  "}{moment(item.timestamp).format("h:mm A")}
          </AppText>
        </View>
      </View>
      {!item.locationVerified && (
        <AlertTriangle size={16} color={palette.warning.default} strokeWidth={2} />
      )}
    </AppCard>
  )
}

// ─── RecentScansList ────────────────────────────────────────────────────────

function RecentScansList({ events, isLoading }: { events: RecentScanEvent[]; isLoading: boolean }) {
  const { colors } = useTheme()
  return (
    <FlatList
      data={events}
      keyExtractor={(item, index) => `${item.staffId}-${item.timestamp}-${index}`}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <ScanEventRow item={item} />
        </AnimatedListItem>
      )}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.emptyCenter} />
        ) : (
          <View style={styles.emptyCenter}>
            <History size={28} color={colors.text.tertiary} strokeWidth={1.5} />
            <AppText color="tertiary" style={{ marginTop: spacing[2] }}>No scans yet today</AppText>
          </View>
        )
      }
    />
  )
}

// ─── ScanHero ───────────────────────────────────────────────────────────────

function ScanHero({ onScan }: { onScan: () => void }) {
  const { colors, isDark } = useTheme()
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <View style={styles.heroCenter}>
      <LiveClock color={colors.text.primary} />

      <Pressable onPress={onScan} style={styles.heroBtnWrap}>
        {({ pressed }) => (
          <>
            <Animated.View
              style={[
                styles.heroGlow,
                { backgroundColor: colors.accent, opacity: isDark ? 0.16 : 0.12, transform: [{ scale: pulse }] },
              ]}
            />
            <View
              style={[
                styles.heroBtn,
                {
                  backgroundColor: isDark ? palette.primary[400] : palette.primary[600],
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <ScanFace size={56} color="#fff" strokeWidth={1.5} />
            </View>
          </>
        )}
      </Pressable>

      <AppText variant="heading3" style={{ marginTop: spacing[6] }}>Tap to Scan</AppText>
      <AppText variant="body" color="tertiary" style={{ marginTop: spacing[1], textAlign: "center" }}>
        Look at the camera to check in or out
      </AppText>
    </View>
  )
}

// ─── ScannerScreen ──────────────────────────────────────────────────────────

export default function ScannerScreen() {
  const { colors } = useTheme()
  const { isTablet } = useTablet()
  const router = useRouter()
  const { role, isScanner } = useRole()
  const { logout } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const { data, isLoading, refetch } = useRecentScans()
  const events = data?.data ?? []

  const screenHeight = Dimensions.get("window").height
  const sheetTranslate = useRef(new Animated.Value(screenHeight - SHEET_PEEK)).current
  const openY = 0
  const closedY = screenHeight - SHEET_PEEK

  function animateSheet(open: boolean) {
    Animated.spring(sheetTranslate, {
      toValue: open ? openY : closedY,
      useNativeDriver: true,
      bounciness: 4,
    }).start()
    setSheetOpen(open)
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 6,
      onPanResponderMove: (_, { dy }) => {
        const base = sheetOpen ? openY : closedY
        const next = Math.max(openY, Math.min(closedY, base + dy))
        sheetTranslate.setValue(next)
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const shouldOpen = sheetOpen ? !(dy > 80 || vy > 0.5) : (dy < -80 || vy < -0.5)
        animateSheet(shouldOpen)
      },
    })
  ).current

  useEffect(() => {
    if (role && !isScanner) router.replace("/")
  }, [role, isScanner])

  if (!isScanner) return null

  async function handleLogout() {
    await logout()
    router.replace("/(auth)/login")
  }

  // ── Tablet / kiosk: split-screen layout ──────────────────────────────────
  if (isTablet) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, flexDirection: "row" }]}>
        <View style={styles.heroPane}>
          <ScanHero onScan={() => setModalOpen(true)} />
        </View>

        <View style={[styles.sidePanel, { backgroundColor: colors.background.secondary, borderLeftColor: colors.border, borderLeftWidth: StyleSheet.hairlineWidth }]}>
          <View style={[styles.sidePanelHeader, { borderBottomColor: colors.border }]}>
            <AppText variant="heading3">Recent Scans</AppText>
            <AppText variant="caption" color="tertiary">Today, this department</AppText>
          </View>
          <RecentScansList events={events} isLoading={isLoading} />
          <Pressable
            onPress={() => setLogoutConfirmOpen(true)}
            hitSlop={8}
            style={[styles.logoutRow, { borderTopColor: colors.border }]}
          >
            <LogOut size={16} color={colors.text.tertiary} strokeWidth={1.75} />
            <AppText variant="caption" color="tertiary">Logout</AppText>
          </Pressable>
        </View>

        <Modal
          visible={modalOpen}
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setModalOpen(false)}
        >
          <AttendanceScanModal onClose={() => setModalOpen(false)} onSuccess={refetch} />
        </Modal>

        <ConfirmModal
          visible={logoutConfirmOpen}
          title="Logout"
          message="This will sign the scanner device out. Staff will not be able to check in or out until it signs back in."
          confirmLabel="Logout"
          onConfirm={handleLogout}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      </View>
    )
  }

  // ── Phone: hero fills screen, recent scans in a drag-up sheet ────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScanHero onScan={() => setModalOpen(true)} />

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border as string,
            transform: [{ translateY: sheetTranslate }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={() => animateSheet(!sheetOpen)} style={styles.sheetHandle}>
          <View style={[styles.sheetGrip, { backgroundColor: colors.border as string }]} />
          <View style={styles.sheetHandleRow}>
            <History size={16} color={colors.text.secondary} strokeWidth={1.75} />
            <AppText variant="bodyMedium" color="secondary">Recent Scans</AppText>
            {sheetOpen
              ? <ChevronDown size={18} color={colors.text.tertiary} strokeWidth={1.75} />
              : <ChevronUp size={18} color={colors.text.tertiary} strokeWidth={1.75} />
            }
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <RecentScansList events={events} isLoading={isLoading} />
        </View>
        <Pressable
          onPress={() => setLogoutConfirmOpen(true)}
          hitSlop={8}
          style={[styles.logoutRow, { borderTopColor: colors.border }]}
        >
          <LogOut size={16} color={colors.text.tertiary} strokeWidth={1.75} />
          <AppText variant="caption" color="tertiary">Logout</AppText>
        </Pressable>
      </Animated.View>

      <Modal
        visible={modalOpen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModalOpen(false)}
      >
        <AttendanceScanModal onClose={() => setModalOpen(false)} onSuccess={refetch} />
      </Modal>

      <ConfirmModal
        visible={logoutConfirmOpen}
        title="Logout"
        message="This will sign the scanner device out. Staff will not be able to check in or out until it signs back in."
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // Hero (shared)
  heroCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[6],
  },
  heroBtnWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 168,
    height: 168,
  },
  heroGlow: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  heroBtn: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tablet layout
  heroPane: { flex: 3 },
  sidePanel: { flex: 2 },
  sidePanelHeader: {
    paddingTop: spacing[12],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
  },

  // Phone sheet
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetHandle: {
    alignItems: "center",
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  sheetGrip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing[3],
  },
  sheetHandleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },

  list: { padding: spacing[4], paddingBottom: spacing[10] },
  emptyCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[16],
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    gap: spacing[3],
    borderRadius: radii.lg,
  },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
})
