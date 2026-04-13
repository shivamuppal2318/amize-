import client from "./client";

export interface AccountExportSummary {
  interests: number;
  devices: number;
  uploads: number;
  videos: number;
  walletTransactions: number;
  withdrawalRequests: number;
  subscriptions: number;
  subscribers: number;
  reports: number;
}

export interface AccountExportPayload {
  generatedAt: string;
  account: Record<string, unknown>;
  summary: AccountExportSummary;
}

export const AccountExportAPI = {
  async getExport(): Promise<AccountExportPayload> {
    const response = await client.get("/account/export");
    return response.data.export;
  },
};
