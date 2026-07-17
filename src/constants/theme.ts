export const colors = {
  // Royal brand gold — matched from logo swoosh
  primary: {
    50:  "#FBF7ED",
    100: "#F5ECCC",
    200: "#EAD597",
    300: "#DCBA5E",
    400: "#D4A53A",  // dark-mode accent
    500: "#C9A055",  // logo swoosh gold
    600: "#B8872A",  // light-mode accent (higher contrast)
    700: "#9A6E1E",
    800: "#7C5618",
    900: "#5E4014",
  },
  // Neutrals — clean grays, slight warmth in light end only
  neutral: {
    0:   "#FFFFFF",
    50:  "#F9F9F9",
    100: "#F2F2F2",
    200: "#E3E3E3",
    300: "#C8C8C8",
    400: "#9A9A9A",
    500: "#6E6E6E",
    600: "#494949",
    700: "#2E2E2E",
    800: "#1E1E1E",
    900: "#141414",
    950: "#0A0A0A",
  },
  // Semantic
  success: {
    light: "#D1FAE5",
    default: "#10B981",
    dark: "#065F46",
  },
  warning: {
    light: "#FEF3C7",
    default: "#F59E0B",
    dark: "#92400E",
  },
  error: {
    light: "#FEE2E2",
    default: "#EF4444",
    dark: "#7F1D1D",
  },
  info: {
    light: "#DBEAFE",
    default: "#3B82F6",
    dark: "#1E3A8A",
  },
} as const

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
} as const

export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    easeIn: "easeIn",
    easeOut: "easeOut",
    easeInOut: "easeInOut",
    spring: "spring",
  },
} as const

export const lightTheme = {
  background: {
    primary: colors.neutral[50],    // warm off-white
    secondary: colors.neutral[100],
    tertiary: colors.neutral[200],
  },
  surface: colors.neutral[0],
  border: colors.neutral[200],
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[400],
    inverse: colors.neutral[50],
  },
  accent: colors.primary[600],       // #B8872A — deep gold, readable on light
  accentSubtle: colors.primary[50],
} as const

export const darkTheme = {
  background: {
    primary: colors.neutral[950],    // #0A0A0A — clean near-black
    secondary: colors.neutral[900],  // #141414
    tertiary: colors.neutral[800],   // #1E1E1E
  },
  surface: colors.neutral[800],      // #1E1E1E — card surface, lifted from bg
  border: colors.neutral[700],       // #2E2E2E — subtle, neutral divider
  text: {
    primary: colors.neutral[50],     // #F9F9F9 — clean white
    secondary: colors.neutral[400],  // #9A9A9A
    tertiary: colors.neutral[600],   // #494949
    inverse: colors.neutral[950],
  },
  accent: colors.primary[400],       // #D4A53A — brand gold on dark
  accentSubtle: colors.primary[900],
} as const

export interface ThemeColors {
  background: { primary: string; secondary: string; tertiary: string }
  surface: string
  border: string
  text: { primary: string; secondary: string; tertiary: string; inverse: string }
  accent: string
  accentSubtle: string
}
