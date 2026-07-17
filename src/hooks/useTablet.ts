import { useWindowDimensions } from "react-native"

export function useTablet(): { isTablet: boolean; isLandscape: boolean } {
  const { width, height } = useWindowDimensions()
  return {
    isTablet: width >= 768,
    isLandscape: width > height,
  }
}
