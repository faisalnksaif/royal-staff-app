import { useWindowDimensions } from "react-native"

export function useTablet(): { isTablet: boolean; isDesktop: boolean; isLandscape: boolean } {
  const { width, height } = useWindowDimensions()
  return {
    isTablet: width >= 768,
    isDesktop: width >= 1024,
    isLandscape: width > height,
  }
}
