import Constants from "expo-constants";

type ExpoExtra = {
  clerkPublishableKey?: string;
};

const expoExtra = (Constants.expoConfig?.extra || {}) as ExpoExtra;

export const clerkPublishableKey =
  expoExtra.clerkPublishableKey ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "";

export const isClerkConfigured = () => {
  return typeof clerkPublishableKey === "string" && clerkPublishableKey.trim().length > 0;
};

