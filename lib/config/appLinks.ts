import Constants from "expo-constants";
import { SITE_URL } from "@/lib/settings/constants";

type ExpoExtra = {
  supportEmail?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
};

const extra = (Constants.expoConfig?.extra || {}) as ExpoExtra;

export const appLinks = {
  supportEmail: extra.supportEmail || "support@amize.com",
  privacyPolicyUrl:
    extra.privacyPolicyUrl || `${SITE_URL}/privacy`,
  termsOfServiceUrl:
    extra.termsOfServiceUrl || `${SITE_URL}/terms`,
};

export const getSupportMailtoUrl = (subject?: string) => {
  const email = encodeURIComponent(appLinks.supportEmail);
  const normalizedSubject = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${email}${normalizedSubject}`;
};
