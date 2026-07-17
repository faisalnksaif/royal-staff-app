import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from "@expo-google-fonts/geist"
import { GeistMono_400Regular } from "@expo-google-fonts/geist-mono"

// Geist Sans → all UI text
// Geist Mono → numbers, amounts, voucher IDs, codes
export const fontFamilies = {
  sans: {
    regular:  "Geist_400Regular",
    medium:   "Geist_500Medium",
    semiBold: "Geist_600SemiBold",
    bold:     "Geist_700Bold",
  },
  mono: {
    regular: "GeistMono_400Regular",
  },
} as const

export const fontScale = {
  heading1: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heading2: {
    fontFamily: fontFamilies.sans.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  heading3: {
    fontFamily: fontFamilies.sans.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans.medium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: fontFamilies.sans.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  // Use for: amounts, voucher IDs, counts, aging days, any numeric display
  mono: {
    fontFamily: fontFamilies.mono.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
} as const

export type FontVariant = keyof typeof fontScale

export const fontAssets = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  GeistMono_400Regular,
} as const
