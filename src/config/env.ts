import Constants from "expo-constants";

type ExtraConfig = {
  apiBaseUrl?: string;
  appEnv?: string;
  scheme?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const appEnv = extra.appEnv ?? process.env.EXPO_PUBLIC_APP_ENV ?? "dev";
export const apiBaseUrl =
  extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://www.jojaemin.com";
export const appScheme = extra.scheme ?? process.env.APP_SCHEME ?? "eodi-dev";

export const authCallbackUrl = `${appScheme}://auth/callback`;
export const isDevApp = appEnv !== "prod";
