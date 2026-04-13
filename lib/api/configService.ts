import apiClient from "@/lib/api/client";
import { SITE_URL } from "@/lib/settings/constants";

export type PaymentProviderConfig = {
  provider: string;
  displayName: string;
  isMock: boolean;
  supportsManualConfirmation: boolean;
  requiresClientSecret: boolean;
  configured: boolean;
  publishableKey?: string;
  defaults: {
    wallet_top_up: string;
    subscription_initial: string;
    subscription_renewal: string;
  };
  testPaymentMethods: Array<{
    id: string;
    label: string;
    outcome: "success" | "requires_action" | "decline";
  }>;
};

export type LiveTransportConfig = {
  provider: string;
  ingestProtocol: string;
  playbackProtocol: string;
  ingestUrl: string;
  playbackBaseUrl: string;
  requiresExternalEncoder: boolean;
  configured: boolean;
};

type AppConfigResponse = {
  payments?: PaymentProviderConfig;
  liveTransport?: LiveTransportConfig;
};

const defaultPaymentConfig: PaymentProviderConfig = {
  provider: "mock",
  displayName: "Mock Payments",
  isMock: true,
  supportsManualConfirmation: true,
  requiresClientSecret: true,
  configured: true,
  defaults: {
    wallet_top_up: "mock_wallet_default",
    subscription_initial: "mock_subscription_default",
    subscription_renewal: "mock_subscription_renewal",
  },
  testPaymentMethods: [
    {
      id: "mock_wallet_default",
      label: "Mock success",
      outcome: "success",
    },
    {
      id: "mock_action_required",
      label: "Mock requires verification",
      outcome: "requires_action",
    },
    {
      id: "mock_decline_card",
      label: "Mock decline",
      outcome: "decline",
    },
  ],
};

const defaultLiveTransportConfig: LiveTransportConfig = {
  provider: "rtmp",
  ingestProtocol: "rtmp",
  playbackProtocol: "hls",
  ingestUrl: "rtmp://localhost:1935/live",
  playbackBaseUrl: SITE_URL,
  requiresExternalEncoder: true,
  configured: false,
};

export const ConfigAPI = {
  async getAppConfig(): Promise<AppConfigResponse> {
    const response = await apiClient.get<AppConfigResponse>("/config");
    return response.data;
  },

  async getPaymentProviderConfig(): Promise<PaymentProviderConfig> {
    const config = await this.getAppConfig();
    return config.payments ?? defaultPaymentConfig;
  },

  async getLiveTransportConfig(): Promise<LiveTransportConfig> {
    const config = await this.getAppConfig();
    return config.liveTransport ?? defaultLiveTransportConfig;
  },
};
