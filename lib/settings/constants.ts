import Constants from "expo-constants";

type ExpoExtra = {
  apiUrl?: string;
  siteUrl?: string;
  socketUrl?: string;
};

const extra = (Constants.expoConfig?.extra || {}) as ExpoExtra;

export const SITE_URL =
  extra.siteUrl?.replace(/\/+$/, "") || "https://amize-next.onrender.com";
export const API_URL =
  extra.apiUrl?.replace(/\/+$/, "") || `${SITE_URL}/api`;
export const SOCKET_URL =
  extra.socketUrl?.replace(/\/+$/, "") || SITE_URL.replace(/^http/i, "ws");
export const SERVER_URL = SITE_URL;

export const HELP_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "account", label: "Account" },
  { id: "service", label: "Service" },
  { id: "video", label: "Video" },
];

export const FAQ_QUESTIONS = [
  {
    id: "create-account",
    question: "How do I create an account?",
    answer:
      "You can sign up using your email, phone number, or a third-party account like Google or Facebook. Follow the on-screen instructions to complete the setup.",
    category: "account",
  },
  {
    id: "app-free",
    question: "Is Amize free to use?",
    answer:
      "Yes, the basic version of our app is free to use. We offer premium features through subscription plans.",
    category: "general",
  },
  {
    id: "reset-password",
    question: "How do I reset my password?",
    answer:
      'Go to the login screen and tap "Forgot password". Follow the instructions sent to your email to reset your password.',
    category: "account",
  },
  {
    id: "private-account",
    question: "How do I make my account private?",
    answer:
      'Go to Settings > Privacy, then toggle "Private Account" to on. This will make your content visible only to approved followers.',
    category: "account",
  },
  {
    id: "change-username",
    question: "Can I change my username?",
    answer:
      "Yes, go to Settings > Edit Profile > Username to change your username. Note that username availability is subject to availability.",
    category: "account",
  },
];

export const CONTACT_METHODS = [
  { id: "customer-service", label: "Customer Service", icon: "Headset" },
  { id: "whatsapp", label: "Whatsapp", icon: "MessageCircle" },
  { id: "website", label: "Website", icon: "Globe" },
  { id: "facebook", label: "Facebook", icon: "Facebook" },
  { id: "twitter", label: "Twitter", icon: "Twitter" },
  { id: "instagram", label: "Instagram", icon: "Instagram" },
];

export const CONTACT_METHOD_LINKS: Record<string, string> = {
  "customer-service": `${SITE_URL}/contact`,
  whatsapp: `${SITE_URL}/contact`,
  website: SITE_URL,
  facebook: SITE_URL,
  twitter: SITE_URL,
  instagram: SITE_URL,
};

export const DEFAULT_USER_SETTINGS = {
  language: "en-US",
  darkMode: true,
  notifications: {
    push: true,
    email: true,
    marketing: false,
  },
  security: {
    biometric: false,
    faceId: false,
    rememberMe: true,
  },
  accessibility: {
    reduceMotion: false,
    largeText: false,
  },
};
