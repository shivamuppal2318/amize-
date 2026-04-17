import Constants from "expo-constants";

type ExpoExtra = {
  enableLiveStreaming?: boolean | string;
  demoMode?: boolean | string;
  admobAndroidAppId?: string;
  admobIosAppId?: string;
};

const extra = (Constants.expoConfig?.extra || {}) as ExpoExtra;

const parseBoolean = (value: boolean | string | undefined, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
};

export const releaseConfig = {
  demoMode: parseBoolean(
    process.env.EXPO_PUBLIC_DEMO_MODE ?? extra.demoMode,
    false
  ),
  enableLiveStreaming: parseBoolean(
    process.env.EXPO_ENABLE_LIVE_STREAMING ?? extra.enableLiveStreaming,
    false
  ),
  admobAndroidAppId:
    extra.admobAndroidAppId || process.env.EXPO_ADMOB_ANDROID_APP_ID || "",
  admobIosAppId:
    extra.admobIosAppId || process.env.EXPO_ADMOB_IOS_APP_ID || "",
};

export const isDemoMode = () => releaseConfig.demoMode;

export const isLiveStreamingEnabled = () =>
  releaseConfig.enableLiveStreaming && !releaseConfig.demoMode;
