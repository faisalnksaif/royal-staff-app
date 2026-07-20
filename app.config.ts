import { ExpoConfig, ConfigContext } from "expo/config"
import appConstants from "./app.constants.json"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appConstants.name,
  slug: appConstants.slug,
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: appConstants.bundleId,
  },
  android: {
    package: appConstants.bundleId,
    googleServicesFile: "./google-services.json",
    usesCleartextTraffic: true,
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
      backgroundColor: "#000000",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
    baseUrl: "/royal-staff-app",
  },
  updates: {
    url: "https://u.expo.dev/b25217cd-b963-4c83-9e11-650f8bdf097f",
    checkAutomatically: "ON_LOAD",
  },
  runtimeVersion: "1.0.0",
  plugins: [
    ["expo-router", { root: "src/app" }],
    "expo-font",
    "expo-updates",
    "expo-notifications",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#000000",
        image: "./assets/splash-icon.png",
        imageWidth: 400,
      },
    ],
  ],
  scheme: appConstants.slug,
  extra: {
    eas: {
      projectId: "b25217cd-b963-4c83-9e11-650f8bdf097f",
    },
  },
  experiments: {
    typedRoutes: true,
  },
})
