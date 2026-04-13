import Constants from "expo-constants";

import type { AccountExportPayload } from "@/lib/api/accountExportService";
import type {
  AdminOverview,
  AdminReleaseReadiness,
  AdminSystemHealth,
} from "@/lib/api/adminService";
import type { AdminReport } from "@/lib/api/reportService";
import type { CreatorAnalyticsResponse, CreatorSubscriberResponse, UserStatusResponse, UserSubscriptionRecord } from "@/lib/api/CreatorAPI";
import type { PaymentAttempt } from "@/lib/api/paymentService";
import type { WithdrawalRequest } from "@/lib/api/walletService";
import type { LocalDataSummary } from "@/lib/storage/localData";

type CacheStats = {
  totalSize: number;
  videoCount: number;
  lastCleanup: number;
};

type LocalExportOptions = {
  user: Record<string, unknown> | null;
  localSummary: LocalDataSummary | null;
  cacheStats: CacheStats | null;
  recentlyViewedCount: number;
};

const getExpoConfig = () => Constants.expoConfig;

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export function buildLocalAdminOverview(): AdminOverview {
  return {
    totals: {
      totalUsers: 24850,
      totalCreators: 1260,
      totalVideos: 78420,
      activeSubscriptions: 412,
      activeLiveSessions: 9,
    },
    moderation: {
      pendingReports: 14,
      actionedReports: 62,
      hiddenVideos: 7,
      suspendedUsers: 3,
    },
    payouts: {
      pendingWithdrawals: 6,
      processingWithdrawals: 4,
      completedWithdrawals: 38,
      monthlyPayoutVolume: 18250,
    },
    revenue: {
      monthlySubscriptionRevenue: 32450,
    },
    recentReports: [
      {
        id: "rep-preview-1",
        reason: "Harassment",
        status: "pending",
        createdAt: daysAgo(1),
        video: {
          id: "vid-preview-22",
          title: "Live market walkthrough",
          isPublic: true,
        },
        user: null,
      },
      {
        id: "rep-preview-2",
        reason: "Copyrighted music",
        status: "reviewed",
        createdAt: daysAgo(2),
        video: {
          id: "vid-preview-11",
          title: "Studio cover session",
          isPublic: false,
        },
        user: null,
      },
      {
        id: "rep-preview-3",
        reason: "Spam account",
        status: "actioned",
        createdAt: daysAgo(3),
        video: null,
        user: {
          id: "user-preview-6",
          username: "fastpromo",
          deactivatedAt: daysAgo(2),
        },
      },
    ],
    recentWithdrawals: [
      {
        id: "wd-preview-1",
        amount: 420,
        status: "processing",
        createdAt: daysAgo(1),
        username: "creator_ace",
      },
      {
        id: "wd-preview-2",
        amount: 260,
        status: "completed",
        createdAt: daysAgo(2),
        username: "urbanchef",
      },
      {
        id: "wd-preview-3",
        amount: 120,
        status: "pending",
        createdAt: daysAgo(3),
        username: "travel_loop",
      },
    ],
  };
}

export function buildLocalAdminSystemHealth(): AdminSystemHealth {
  const expoConfig = getExpoConfig();
  const ios = expoConfig?.ios;
  const android = expoConfig?.android;
  const plugins = expoConfig?.plugins ?? [];
  const extra = expoConfig?.extra as
    | {
        eas?: { projectId?: string };
        facebookAppId?: string;
      }
    | undefined;

  const hasPlugin = (pluginName: string) =>
    plugins.some((entry) =>
      Array.isArray(entry) ? entry[0] === pluginName : entry === pluginName
    );

  return {
    database: {
      status: "error",
      reachable: false,
      error: "Backend health endpoint unavailable. Verify the deployed API or local server.",
    },
    payments: {
      provider: hasPlugin("@stripe/stripe-react-native") ? "stripe" : "not-configured",
      stripeConfigured: hasPlugin("@stripe/stripe-react-native"),
      stripeConnectConfigured: false,
    },
    liveTransport: {
      provider: "preview",
      ingestProtocol: "rtmp",
      playbackProtocol: "https",
      ingestUrl: "Not available in local preview mode",
      playbackBaseUrl: "Not available in local preview mode",
      requiresExternalEncoder: true,
      configured: false,
    },
    providers: {
      eas: {
        label: "EAS project",
        configured: Boolean(extra?.eas?.projectId),
        status: extra?.eas?.projectId ? "ready" : "missing",
        details: extra?.eas?.projectId
          ? `Project id ${extra.eas.projectId}`
          : "Missing expo.extra.eas.projectId",
      },
      firebase: {
        label: "Firebase mobile config",
        configured: Boolean(android?.googleServicesFile || ios?.googleServicesFile),
        status: android?.googleServicesFile || ios?.googleServicesFile ? "ready" : "missing",
        details:
          android?.googleServicesFile || ios?.googleServicesFile
            ? "Google services files are referenced in Expo config."
            : "Google services file is not configured in Expo config.",
      },
      facebook: {
        label: "Facebook auth",
        configured: Boolean(extra?.facebookAppId),
        status: extra?.facebookAppId ? "ready" : "missing",
        details: extra?.facebookAppId
          ? "Facebook app id is present."
          : "Facebook button exists but app id is still blank.",
      },
      apple: {
        label: "Apple sign in",
        configured: Boolean(ios?.usesAppleSignIn),
        status: ios?.usesAppleSignIn ? "ready" : "missing",
        details: ios?.usesAppleSignIn
          ? "Apple Sign In entitlement is enabled."
          : "ios.usesAppleSignIn is disabled.",
      },
      notifications: {
        label: "Push notifications",
        configured: hasPlugin("expo-notifications"),
        status: hasPlugin("expo-notifications") ? "ready" : "missing",
        details: hasPlugin("expo-notifications")
          ? "Expo notifications plugin is installed."
          : "Expo notifications plugin is missing.",
      },
    },
    release: {
      appName: expoConfig?.name || "Amize",
      appVersion: expoConfig?.version || "missing",
      maintenanceMode: false,
      supportEmail: null,
      privacyPolicyUrl: null,
      termsOfServiceUrl: null,
    },
  };
}

export function buildLocalAdminReports(): AdminReport[] {
  return [
    {
      id: "report-preview-1",
      reason: "Harassment / bullying",
      description: "Repeated abusive comments in the thread.",
      status: "pending",
      createdAt: daysAgo(1),
      reviewedAt: null,
      targetType: "video",
      reportedBy: {
        id: "user-reporter-1",
        username: "safeline",
        fullName: "Safe Line",
      },
      subject: {
        type: "video",
        video: {
          id: "video-100",
          title: "Night market live cut",
          thumbnailUrl: null,
          isPublic: true,
        },
        owner: {
          id: "user-creator-1",
          username: "cityvibes",
          fullName: "City Vibes",
        },
      },
    },
    {
      id: "report-preview-2",
      reason: "Impersonation",
      description: "Account is posing as another creator.",
      status: "actioned",
      createdAt: daysAgo(3),
      reviewedAt: daysAgo(2),
      targetType: "user",
      reportedBy: {
        id: "user-reporter-2",
        username: "trustwatch",
        fullName: "Trust Watch",
      },
      subject: {
        type: "user",
        user: {
          id: "user-imp-1",
          username: "brand-copy",
          fullName: "Brand Copy",
          deactivatedAt: daysAgo(2),
        },
      },
      actionTaken: "User account suspended",
    },
    {
      id: "report-preview-3",
      reason: "Copyrighted audio",
      description: "Contains restricted track segment.",
      status: "reviewed",
      createdAt: daysAgo(4),
      reviewedAt: daysAgo(1),
      targetType: "video",
      reportedBy: {
        id: "user-reporter-3",
        username: "rightsdesk",
        fullName: "Rights Desk",
      },
      subject: {
        type: "video",
        video: {
          id: "video-200",
          title: "Studio remix test",
          thumbnailUrl: null,
          isPublic: false,
        },
        owner: {
          id: "user-creator-2",
          username: "soundlab",
          fullName: "Sound Lab",
        },
      },
    },
  ];
}

export function buildLocalAdminWithdrawals(): WithdrawalRequest[] {
  return [
    {
      id: "wd-preview-100",
      amount: 420,
      payoutMethod: "Stripe Connect",
      payoutDestination: "acct_1Preview123",
      status: "processing",
      provider: "stripe",
      payoutTransactionId: "po_preview_001",
      payoutFailureReason: null,
      processedAt: null,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
      user: {
        id: "creator-100",
        username: "creator_ace",
        fullName: "Creator Ace",
      },
    },
    {
      id: "wd-preview-101",
      amount: 185,
      payoutMethod: "Bank Transfer",
      payoutDestination: "Chase **** 8890",
      status: "pending",
      provider: "manual",
      payoutTransactionId: null,
      payoutFailureReason: null,
      processedAt: null,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
      user: {
        id: "creator-101",
        username: "urbanchef",
        fullName: "Urban Chef",
      },
    },
    {
      id: "wd-preview-102",
      amount: 92,
      payoutMethod: "UPI",
      payoutDestination: "urbanchef@upi",
      status: "completed",
      provider: "manual",
      payoutTransactionId: "upi_98421",
      payoutFailureReason: null,
      processedAt: daysAgo(1),
      createdAt: daysAgo(4),
      updatedAt: daysAgo(1),
      user: {
        id: "creator-102",
        username: "urbanchef",
        fullName: "Urban Chef",
      },
    },
  ];
}

export function buildLocalCreatorStatusPreview(): UserStatusResponse["creator"] {
  return {
    isCreator: true,
    isEligibleForCreator: true,
    creatorVerified: true,
    monetizationEnabled: true,
    creatorCategory: "Lifestyle",
    stripeConnect: {
      accountId: "acct_preview_001",
      chargesEnabled: true,
      payoutsEnabled: false,
      detailsSubmitted: true,
      onboardedAt: daysAgo(7),
    },
    stats: {
      subscribers: 142,
      totalContent: 48,
    },
  };
}

export function buildLocalCreatorSubscriberPreview(): CreatorSubscriberResponse {
  return {
    success: true,
    subscriptions: [
      {
        id: "sub-preview-1",
        status: "active",
        autoRenew: true,
        startDate: daysAgo(20),
        endDate: daysAgo(-10),
        subscriber: {
          id: "user-sub-1",
          username: "dailyfox",
          fullName: "Daily Fox",
        },
        plan: {
          id: "plan-1",
          name: "Creator Plus",
          price: 9.99,
          currency: "USD",
          intervalType: "month",
        },
        SubscriptionPayment: [
          {
            id: "pay-preview-1",
            amount: 9.99,
            currency: "USD",
            status: "successful",
            createdAt: daysAgo(2),
          },
        ],
      },
      {
        id: "sub-preview-2",
        status: "past_due",
        autoRenew: false,
        startDate: daysAgo(35),
        endDate: daysAgo(5),
        subscriber: {
          id: "user-sub-2",
          username: "citymini",
          fullName: "City Mini",
        },
        plan: {
          id: "plan-2",
          name: "Backstage",
          price: 4.99,
          currency: "USD",
          intervalType: "month",
        },
        SubscriptionPayment: [
          {
            id: "pay-preview-2",
            amount: 4.99,
            currency: "USD",
            status: "failed",
            createdAt: daysAgo(4),
          },
        ],
      },
    ],
    stats: {
      total: 62,
      active: 45,
      revenue: 820,
      currency: "USD",
      period: "Last 30 days",
    },
  };
}

export function buildLocalCreatorAnalyticsPreview(
  userId = "creator-preview"
): CreatorAnalyticsResponse {
  return {
    success: true,
    creator: {
      id: userId,
      username: "creator_preview",
      fullName: "Creator Preview",
      creatorCategory: "Lifestyle",
      isEligibleForCreator: true,
      monetizationEnabled: true,
    },
    overview: {
      periodDays: 30,
      activeSubscribers: 45,
      revenue: 820,
      currency: "USD",
      totalViews: 184200,
      totalLikes: 12450,
      totalComments: 910,
      totalShares: 620,
      averageWatchTime: 38.5,
      averageCompletionRate: 62.4,
    },
    topVideos: [
      {
        id: "top-preview-1",
        title: "Morning routine glow-up",
        thumbnailUrl: null,
        createdAt: daysAgo(9),
        views: 48200,
        likes: 3200,
        comments: 210,
        shares: 160,
      },
      {
        id: "top-preview-2",
        title: "City market eats",
        thumbnailUrl: null,
        createdAt: daysAgo(12),
        views: 35110,
        likes: 2140,
        comments: 140,
        shares: 95,
      },
    ],
    recentPayments: [
      {
        amount: 120.5,
        currency: "USD",
        createdAt: daysAgo(3),
      },
      {
        amount: 95.75,
        currency: "USD",
        createdAt: daysAgo(10),
      },
    ],
  };
}

export function buildLocalPremiumSubscriptionsPreview(): {
  subscriptions: UserSubscriptionRecord[];
  stats: { total: number; active: number; spending: number; currency?: string };
} {
  return {
    subscriptions: [
      {
        id: "user-sub-preview-1",
        creatorName: "Travel Loop",
        creatorUsername: "travel_loop",
        planName: "Explorer",
        amount: 7.99,
        currency: "USD",
        status: "active",
        autoRenew: true,
        startDate: daysAgo(24),
        endDate: daysAgo(-6),
      },
      {
        id: "user-sub-preview-2",
        creatorName: "Chef Studio",
        creatorUsername: "chef_studio",
        planName: "Kitchen Club",
        amount: 5.99,
        currency: "USD",
        status: "active",
        autoRenew: true,
        startDate: daysAgo(10),
        endDate: daysAgo(-20),
      },
    ],
    stats: {
      total: 6,
      active: 2,
      spending: 29.97,
      currency: "USD",
    },
  };
}

export function buildLocalPaymentAttempts(
  purpose: PaymentAttempt["purpose"],
  count = 3
): PaymentAttempt[] {
  const base = [
    {
      id: `pay-attempt-${purpose}-1`,
      purpose,
      provider: "mock",
      paymentMethod: "Mock success",
      amount: 9.99,
      currency: "USD",
      status: "succeeded",
      transactionId: "txn_preview_01",
      clientSecret: null,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: `pay-attempt-${purpose}-2`,
      purpose,
      provider: "mock",
      paymentMethod: "Mock requires action",
      amount: 4.99,
      currency: "USD",
      status: "requires_action",
      transactionId: "txn_preview_02",
      clientSecret: "pi_preview_secret",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    {
      id: `pay-attempt-${purpose}-3`,
      purpose,
      provider: "mock",
      paymentMethod: "Mock decline",
      amount: 14.99,
      currency: "USD",
      status: "failed",
      transactionId: "txn_preview_03",
      clientSecret: null,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    },
  ];

  return base.slice(0, count);
}

export function buildLocalWalletWithdrawals(): WithdrawalRequest[] {
  return buildLocalAdminWithdrawals().map((withdrawal) => ({
    ...withdrawal,
    user: withdrawal.user,
  }));
}

export function buildLocalAdminReleaseReadiness(
  health: AdminSystemHealth
): AdminReleaseReadiness {
  const expoConfig = getExpoConfig();
  const ios = expoConfig?.ios;
  const android = expoConfig?.android;
  const extra = expoConfig?.extra as
    | {
        eas?: { projectId?: string };
        facebookAppId?: string;
      }
    | undefined;

  const items: AdminReleaseReadiness["items"] = [
    {
      id: "app-version",
      label: "App version configured",
      ready: Boolean(expoConfig?.version),
      severity: "critical",
      details: expoConfig?.version || "Missing expo.version",
    },
    {
      id: "android-package",
      label: "Android package configured",
      ready: Boolean(android?.package),
      severity: "critical",
      details: android?.package || "Missing android.package",
    },
    {
      id: "ios-bundle",
      label: "iOS bundle identifier configured",
      ready: Boolean(ios?.bundleIdentifier),
      severity: "critical",
      details: ios?.bundleIdentifier || "Missing ios.bundleIdentifier",
    },
    {
      id: "android-version-code",
      label: "Android version code configured",
      ready: typeof android?.versionCode === "number",
      severity: "critical",
      details:
        typeof android?.versionCode === "number"
          ? `Version code ${android.versionCode}`
          : "Missing android.versionCode",
    },
    {
      id: "database",
      label: "Backend database reachable",
      ready: health.database.reachable,
      severity: "critical",
      details: health.database.error || "Database health check passed.",
    },
    {
      id: "payments",
      label: "Payment provider configured",
      ready: health.payments.stripeConfigured,
      severity: "warning",
      details: health.payments.stripeConfigured
        ? "Stripe mobile SDK is configured."
        : "Stripe mobile SDK or backend env is still incomplete.",
    },
    {
      id: "live-transport",
      label: "Live transport configured",
      ready: health.liveTransport.configured,
      severity: "warning",
      details: health.liveTransport.configured
        ? health.liveTransport.provider
        : "Live screen works in preview mode only.",
    },
    {
      id: "eas-project",
      label: "EAS project linked",
      ready: Boolean(extra?.eas?.projectId),
      severity: "warning",
      details: extra?.eas?.projectId || "Missing expo.extra.eas.projectId",
    },
  ];

  const ready = items.filter((item) => item.ready).length;
  const blocked = items.length - ready;
  const criticalBlocked = items.filter(
    (item) => !item.ready && item.severity === "critical"
  ).length;
  const warningBlocked = items.filter(
    (item) => !item.ready && item.severity === "warning"
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: items.length,
      ready,
      blocked,
      criticalBlocked,
      warningBlocked,
    },
    migrationStatus: {
      localCount: 0,
      appliedCount: 0,
      latestLocalMigration: null,
      latestAppliedMigration: null,
      tableReachable: health.database.reachable,
      driftDetected: false,
    },
    deploymentSteps: [
      "Deploy the backend API and verify database connectivity.",
      "Add production Stripe and payout environment variables.",
      "Configure live transport provider credentials and playback URLs.",
      "Run final Android and iOS submission checks.",
    ],
    items,
  };
}

export function buildLocalAccountExport({
  user,
  localSummary,
  cacheStats,
  recentlyViewedCount,
}: LocalExportOptions): AccountExportPayload {
  return {
    generatedAt: new Date().toISOString(),
    account: {
      mode: "local-preview",
      user: user || { status: "not-signed-in" },
      deviceStorage: {
        cachedVideos: cacheStats?.videoCount ?? 0,
        cacheBytes: cacheStats?.totalSize ?? 0,
        recentlyViewedCount,
      },
    },
    summary: {
      interests: Array.isArray(user?.interests) ? user.interests.length : 0,
      devices: 1,
      uploads: 0,
      videos: cacheStats?.videoCount ?? 0,
      walletTransactions: 0,
      withdrawalRequests: 0,
      subscriptions: 0,
      subscribers: 0,
      reports:
        (localSummary?.queuedMessagesCount ?? 0) +
        (localSummary?.discoveryTopicOverrideCount ?? 0),
    },
  };
}
