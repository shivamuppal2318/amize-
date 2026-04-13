import client from "./client";

export interface AdminOverview {
  totals: {
    totalUsers: number;
    totalCreators: number;
    totalVideos: number;
    activeSubscriptions: number;
    activeLiveSessions: number;
  };
  moderation: {
    pendingReports: number;
    actionedReports: number;
    hiddenVideos: number;
    suspendedUsers: number;
  };
  payouts: {
    pendingWithdrawals: number;
    processingWithdrawals: number;
    completedWithdrawals: number;
    monthlyPayoutVolume: number;
  };
  revenue: {
    monthlySubscriptionRevenue: number;
  };
  recentReports: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    video?: {
      id: string;
      title: string | null;
      isPublic: boolean;
    } | null;
    user?: {
      id: string;
      username: string;
      deactivatedAt: string | null;
    } | null;
  }>;
  recentWithdrawals: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    username: string;
  }>;
}

export interface AdminSystemHealth {
  database: {
    status: "ready" | "error";
    reachable: boolean;
    error?: string | null;
  };
  payments: {
    provider: string;
    stripeConfigured: boolean;
    stripeConnectConfigured: boolean;
  };
  liveTransport: {
    provider: string;
    ingestProtocol: string;
    playbackProtocol: string;
    ingestUrl: string;
    playbackBaseUrl: string;
    requiresExternalEncoder: boolean;
    configured: boolean;
  };
  providers: Record<
    string,
    {
      label: string;
      configured: boolean;
      status: "ready" | "missing";
      details?: string;
    }
  >;
  release: {
    appName: string;
    appVersion: string;
    maintenanceMode: boolean;
    supportEmail?: string | null;
    privacyPolicyUrl?: string | null;
    termsOfServiceUrl?: string | null;
  };
}

export interface AdminReleaseReadiness {
  generatedAt: string;
  summary: {
    total: number;
    ready: number;
    blocked: number;
    criticalBlocked: number;
    warningBlocked: number;
  };
  migrationStatus: {
    localCount: number;
    appliedCount: number;
    latestLocalMigration: string | null;
    latestAppliedMigration: string | null;
    tableReachable: boolean;
    driftDetected: boolean;
  };
  deploymentSteps: string[];
  items: Array<{
    id: string;
    label: string;
    ready: boolean;
    severity: "critical" | "warning";
    details?: string;
  }>;
}

export const AdminAPI = {
  async getOverview(): Promise<AdminOverview> {
    const response = await client.get("/admin/overview");
    return response.data.overview;
  },

  async getSystemHealth(): Promise<AdminSystemHealth> {
    const response = await client.get("/admin/system-health");
    return response.data.health;
  },

  async getReleaseReadiness(): Promise<AdminReleaseReadiness> {
    const response = await client.get("/admin/release-readiness");
    return response.data.readiness;
  },
};
