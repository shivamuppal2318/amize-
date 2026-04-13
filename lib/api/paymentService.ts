import apiClient from "@/lib/api/client";

export type PaymentAttempt = {
  id: string;
  purpose: string;
  provider: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: "succeeded" | "requires_action" | "failed";
  transactionId?: string | null;
  clientSecret?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type PaymentAttemptsResponse = {
  success: boolean;
  attempts: PaymentAttempt[];
};

type PaymentAttemptResponse = {
  success: boolean;
  attempt?: PaymentAttempt | null;
};

type ConfirmPaymentResponse = {
  success: boolean;
  message?: string;
  paymentAttempt?: PaymentAttempt;
};

export const PaymentAPI = {
  async getAttempts(params?: {
    purpose?: "wallet_top_up" | "subscription_initial" | "subscription_renewal" | "all";
    limit?: number;
  }): Promise<PaymentAttempt[]> {
    const response = await apiClient.get<PaymentAttemptsResponse>("/payments", {
      params,
    });

    return response.data.attempts ?? [];
  },

  async getAttempt(paymentAttemptId: string): Promise<PaymentAttempt | null> {
    const response = await apiClient.get<PaymentAttemptResponse>(
      `/payments/${paymentAttemptId}`
    );

    return response.data.attempt ?? null;
  },

  async confirmAttempt(paymentAttemptId: string): Promise<ConfirmPaymentResponse> {
    const response = await apiClient.post<ConfirmPaymentResponse>("/payments/confirm", {
      paymentAttemptId,
    });

    return response.data;
  },
};
