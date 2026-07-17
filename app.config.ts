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
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#312E81",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    ["expo-router", { root: "src/app" }],
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#312E81",
        image: "./assets/splash-icon.png",
        imageWidth: 200,
      },
    ],
  ],
  scheme: appConstants.slug,
  experiments: {
    typedRoutes: true,
  },
})
