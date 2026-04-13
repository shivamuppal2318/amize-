import { User } from "@/lib/api/types";

type DemoAccount = {
  label: string;
  identifier: string;
  password: string;
  user: User;
};

const explicitDisable =
  process.env.EXPO_PUBLIC_DISABLE_LOCAL_DEMO_AUTH === "true";
const explicitEnable =
  process.env.EXPO_PUBLIC_ENABLE_LOCAL_DEMO_AUTH === "true";
const isDevelopmentEnv = process.env.NODE_ENV !== "production";
const isDevFlagEnabled =
  typeof __DEV__ !== "undefined" && __DEV__ === true;

const isLocalDemoAuthEnabled =
  explicitEnable || (!explicitDisable && (isDevFlagEnabled || isDevelopmentEnv));

const buildDemoUser = (
  user: Partial<User> & Pick<User, "id" | "username" | "email" | "role">
): User => ({
  firstName: "",
  lastName: "",
  fullName: "",
  bio: "",
  profilePhotoUrl: "",
  phoneNumber: "",
  address: "",
  gender: "",
  verified: true,
  creatorVerified: false,
  creatorCategory: "",
  monetizationEnabled: false,
  adminPermissions: user.role === "ADMIN" ? "all" : "",
  useFingerprint: false,
  useFaceId: false,
  instagramHandle: "",
  facebookHandle: "",
  twitterHandle: "",
  isPrivate: false,
  isBusinessAccount: false,
  language: "English",
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  interests: [],
  ...user,
});

const demoAccounts: DemoAccount[] = [
  {
    label: "Demo Admin",
    identifier: "shivamuppal098@gmail.com",
    password: "muskan2318",
    user: buildDemoUser({
      id: "local-demo-admin",
      username: "shivamuppal098",
      email: "shivamuppal098@gmail.com",
      firstName: "Shivam",
      lastName: "Uppal",
      fullName: "Shivam Uppal",
      role: "ADMIN",
      verified: true,
    }),
  },
  {
    label: "Demo User",
    identifier: "demo.user@amize.local",
    password: "Demo@123",
    user: buildDemoUser({
      id: "local-demo-user",
      username: "demo_user",
      email: "demo.user@amize.local",
      firstName: "Demo",
      lastName: "User",
      fullName: "Demo User",
      role: "USER",
      verified: true,
    }),
  },
];

const normalizeIdentifier = (identifier: string) => {
  const trimmedIdentifier = identifier.trim();
  const isEmailIdentifier = /\S+@\S+\.\S+/.test(trimmedIdentifier);

  return isEmailIdentifier
    ? trimmedIdentifier.toLowerCase()
    : trimmedIdentifier.replace(/[^\d+]/g, "");
};

export const LOCAL_DEMO_ACCOUNTS = demoAccounts.map((account) => ({
  label: account.label,
  identifier: account.identifier,
  password: account.password,
}));

export const canUseLocalDemoAuth = () => isLocalDemoAuthEnabled;

export const resolveLocalDemoSession = (
  identifier: string,
  password: string
) => {
  if (!isLocalDemoAuthEnabled) {
    return null;
  }

  const normalizedIdentifier = normalizeIdentifier(identifier);
  const matchingAccount = demoAccounts.find(
    (account) =>
      normalizeIdentifier(account.identifier) === normalizedIdentifier &&
      account.password === password
  );

  if (!matchingAccount) {
    return null;
  }

  return {
    user: matchingAccount.user,
    token: `local-demo-token-${matchingAccount.user.id}`,
    refreshToken: `local-demo-refresh-${matchingAccount.user.id}`,
  };
};
