import appConstants from "../../app.constants.json"

export const APP_CONFIG = appConstants as {
  readonly name: string
  readonly company: string
  readonly slug: string
  readonly bundleId: string
}

// const DEV_API = "http://192.168.1.101:9999/api"
const DEV_API = "http://localhost:9999/api"
const PROD_API = "https://api.sulthanpages.com/project/royal/api"

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (__DEV__ ? DEV_API : PROD_API)

// Base URL the web build of this app is hosted at — used to build the
// customer-facing feedback link shared over WhatsApp.
const DEV_WEB = "http://localhost:8081"
const PROD_WEB = "https://faisalnksaif.github.io/royal-staff-app"

export const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ??
  (__DEV__ ? DEV_WEB : PROD_WEB)

export const FEATURE_FLAGS = {
  faceRecognition: true,
  darkMode: true,
} as const
