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

const pickConfiguredValue = (
  envValue: string | undefined,
  extraValue: string | undefined
) => {
  if (isNonPlaceholderValue(envValue)) {
    return String(envValue).trim();
  }

  if (isNonPlaceholderValue(extraValue)) {
    return String(extraValue).trim();
  }

  return "";
};

export const authProviderConfig = {
  facebookAppId:
    pickConfiguredValue(process.env.EXPO_FACEBOOK_APP_ID, expoExtra.facebookAppId),
  googleWebClientId:
    pickConfiguredValue(
      process.env.EXPO_GOOGLE_WEB_CLIENT_ID,
      expoExtra.googleWebClientId
    ),
  googleAndroidClientId:
    pickConfiguredValue(
      process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID,
      expoExtra.googleAndroidClientId
    ),
  googleIosClientId:
    pickConfiguredValue(
      process.env.EXPO_GOOGLE_IOS_CLIENT_ID,
      expoExtra.googleIosClientId
    ),
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

export const isSecureWebAuthOrigin = () => {
  if (Platform.OS !== "web") {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const { protocol, hostname } = window.location;
  return (
    protocol === "https:" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
};

export const isGoogleWebSignInUsable = () => {
  if (Platform.OS !== "web") {
    return true;
  }

  return (
    isNonPlaceholderValue(authProviderConfig.googleWebClientId) &&
    isSecureWebAuthOrigin()
  );
};
