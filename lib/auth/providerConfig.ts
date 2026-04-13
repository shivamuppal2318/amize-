import Constants from "expo-constants";
import { Platform } from "react-native";

type ExpoExtra = {
  facebookAppId?: string;
  googleWebClientId?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
};

const expoExtra = (Constants.expoConfig?.extra || {}) as ExpoExtra;

export const isNonPlaceholderValue = (value?: string | null) => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const upper = trimmed.toUpperCase();
  return !(
    upper.includes("YOUR_") ||
    upper.includes("REPLACE_") ||
    upper.includes("EXAMPLE") ||
    trimmed === "YOUR_FACEBOOK_APP_ID"
  );
};

export const authProviderConfig = {
  facebookAppId:
    expoExtra.facebookAppId || process.env.EXPO_FACEBOOK_APP_ID || "",
  googleWebClientId:
    expoExtra.googleWebClientId || process.env.EXPO_GOOGLE_WEB_CLIENT_ID || "",
  googleAndroidClientId:
    expoExtra.googleAndroidClientId ||
    process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID ||
    "",
  googleIosClientId:
    expoExtra.googleIosClientId || process.env.EXPO_GOOGLE_IOS_CLIENT_ID || "",
};

export const isFacebookConfigured = isNonPlaceholderValue(
  authProviderConfig.facebookAppId
);

export const isGoogleConfiguredForCurrentPlatform = () => {
  if (Platform.OS === "android") {
    return isNonPlaceholderValue(authProviderConfig.googleAndroidClientId);
  }

  if (Platform.OS === "ios") {
    return isNonPlaceholderValue(authProviderConfig.googleIosClientId);
  }

  return isNonPlaceholderValue(authProviderConfig.googleWebClientId);
};

export const isAnyGoogleProviderConfigured =
  isNonPlaceholderValue(authProviderConfig.googleWebClientId) ||
  isNonPlaceholderValue(authProviderConfig.googleAndroidClientId) ||
  isNonPlaceholderValue(authProviderConfig.googleIosClientId);
