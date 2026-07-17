import appConstants from "../../app.constants.json"

export const APP_CONFIG = appConstants as {
  readonly name: string
  readonly company: string
  readonly slug: string
  readonly bundleId: string
}

// const DEV_API = "http://10.0.2.2:9999/api"
const DEV_API = "http://localhost:9999/api"
const PROD_API = "http://165.22.209.234:9999/api"

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (__DEV__ ? DEV_API : PROD_API)

export const FEATURE_FLAGS = {
  faceRecognition: true,
  darkMode: true,
} as const
