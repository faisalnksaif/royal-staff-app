import { Pressable, StyleSheet } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated"
import { useEffect } from "react"
import { useTheme } from "../../providers/ThemeProvider"

interface AppToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
}

const TRACK_WIDTH = 48
const TRACK_HEIGHT = 28
const THUMB_SIZE = 22
const THUMB_PADDING = (TRACK_HEIGHT - THUMB_SIZE) / 2

export default function AppToggle({ value, onValueChange, disabled }: AppToggleProps) {
  const { colors } = useTheme()
  const progress = useSharedValue(value ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 })
  }, [value])

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border, colors.accent]
    ),
  }))

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(
          value ? TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING : THUMB_PADDING,
          { duration: 200 }
        ),
      },
    ],
  }))

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
})
