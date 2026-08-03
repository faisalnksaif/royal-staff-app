import { useCallback, useEffect, useRef, useState } from "react"
import { View, Animated, Easing, type LayoutChangeEvent } from "react-native"

export default function Collapsible({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current
  const contentHeight = useRef(0)
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    if (h > 0 && h !== contentHeight.current) {
      contentHeight.current = h
      setMeasuredHeight(h)
    }
  }, [])

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [expanded])

  return (
    <Animated.View
      style={{
        height: measuredHeight == null ? undefined : anim.interpolate({ inputRange: [0, 1], outputRange: [0, measuredHeight] }),
        opacity: anim,
        overflow: "hidden",
      }}
    >
      <View onLayout={onLayout} style={measuredHeight == null ? undefined : { position: "absolute", left: 0, right: 0 }}>
        {children}
      </View>
    </Animated.View>
  )
}
