const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? "dev";
const scheme = process.env.APP_SCHEME ?? (appEnv === "prod" ? "eodi" : "eodi-dev");

const config = {
  name: appEnv === "prod" ? "EODI" : "EODI Dev",
  slug: "eodi-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme,
  ios: {
    supportsTablet: true,
    bundleIdentifier: appEnv === "prod" ? "kr.eodi.mobile" : "kr.eodi.mobile.dev",
  },
  android: {
    package: appEnv === "prod" ? "kr.eodi.mobile" : "kr.eodi.mobile.dev",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-secure-store", "expo-web-browser", "@react-native-community/datetimepicker"],
  extra: {
    appEnv,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
    scheme,
    eas: {
      projectId: "2ea134a9-317f-4587-9e09-9f375cb8fea6",
    },
  },
};

export default config;
