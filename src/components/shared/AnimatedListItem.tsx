import { useEffect, useRef } from "react"
import { Animated, Easing } from "react-native"

const STAGGER_MS = 40
const DURATION = 320
const SLIDE_OFFSET = 18

interface Props {
  index: number
  children: React.ReactNode
}

export default function AnimatedListItem({ index, children }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(SLIDE_OFFSET)).current

  useEffect(() => {
    const delay = Math.min(index * STAGGER_MS, 400)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: DURATION,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: DURATION,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View pointerEvents="box-none" style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  )
}
