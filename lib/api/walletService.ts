import apiClient from '@/lib/api/client';
import { createIdempotencyKey } from '@/lib/network/idempotency';

export type WalletTransaction = {
  id: string;
  title: string;
  amount: number;
  asset: 'cash' | 'coins';
  type: 'credit' | 'debit' | 'withdrawal';
  createdAt: string;
};

export type GiftInventory = {
  roses: number;
  stars: number;
  crowns: number;
};

export type WalletState = {
  coinBalance: number;
  cashBalance: number;
  giftInventory: GiftInventory;
  payoutMethod: string;
  payoutDestination: string;
  transactions: WalletTransaction[];
};

export type WithdrawalRequest = {
  id: string;
  amount: number;
  payoutMethod: string;
  payoutDestination: string;
  status: "pending" | "processing" | "completed" | "rejected";
  provider?: string | null;
  payoutTransactionId?: string | null;
  payoutFailureReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    fullName?: string | null;
    profilePhotoUrl?: string | null;
  };
};

export type PaymentActionState = {
  attemptId?: string;
  provider: string;
  providerName?: string;
  status: 'succeeded' | 'requires_action';
  transactionId: string;
  clientSecret?: string;
  amount?: number;
  currency?: string;
};

export type GiftCatalogItem = {
  id: "rose" | "star" | "crown";
  label: string;
  coinCost: number;
  cashValue: number;
};

type GiftCatalogResponse = {
  success: boolean;
  catalog: GiftCatalogItem[];
};

type GiftSendResponse = {
  success: boolean;
  message?: string;
  wallet?: WalletState;
  gift?: {
    type: "rose" | "star" | "crown";
    quantity: number;
    coinCost: number;
    cashValue: number;
  };
};

type WalletResponse = {
  success: boolean;
  message?: string;
  wallet: WalletState;
  settledAmount?: number;
  requiresAction?: boolean;
  payment?: PaymentActionState;
};

type WithdrawalResponse = {
  success: boolean;
  withdrawals: WithdrawalRequest[];
};

type UpdateWithdrawalResponse = {
  success: boolean;
  withdrawal: WithdrawalRequest;
};

const defaultWalletState: WalletState = {
  coinBalance: 0,
  cashBalance: 0,
  giftInventory: {
    roses: 0,
    stars: 0,
    crowns: 0,
  },
  payoutMethod: '',
  payoutDestination: '',
  transactions: [],
};

export type WalletTopUpResult =
  | {
      success: true;
      wallet: WalletState;
      payment?: PaymentActionState;
      message?: string;
    }
  | {
      success: false;
      requiresAction: true;
      payment: PaymentActionState;
      message?: string;
    };

export const WalletAPI = {
  async getWallet(): Promise<WalletState> {
    const response = await apiClient.get<WalletResponse>('/wallet');
    return response.data.wallet ?? defaultWalletState;
  },

  async updatePayoutDetails(
    payoutMethod: string,
    payoutDestination: string
  ): Promise<WalletState> {
    const response = await apiClient.put<WalletResponse>('/wallet', {
      payoutMethod,
      payoutDestination,
    });
    return response.data.wallet ?? defaultWalletState;
  },

  async topUpCoins(
    coins: number,
    price: number,
    paymentMethodId?: string
  ): Promise<WalletTopUpResult> {
    const response = await apiClient.post<WalletResponse>(
      '/wallet/top-up',
      {
        coins,
        price,
        paymentMethodId,
      },
      {
        headers: {
          "x-idempotency-key": createIdempotencyKey("wallet-topup"),
        },
      }
    );

    if (response.data.requiresAction && response.data.payment) {
      return {
        success: false,
        requiresAction: true,
        payment: response.data.payment,
        message: response.data.message,
      };
    }

    return {
      success: true,
      wallet: response.data.wallet ?? defaultWalletState,
      payment: response.data.payment,
      message: response.data.message,
    };
  },

  async settleGifts(): Promise<{ wallet: WalletState; settledAmount: number }> {
    const response = await apiClient.post<WalletResponse>('/wallet/gifts/settle');
    return {
      wallet: response.data.wallet ?? defaultWalletState,
      settledAmount: response.data.settledAmount ?? 0,
    };
  },

  async getGiftCatalog(): Promise<GiftCatalogItem[]> {
    const response = await apiClient.get<GiftCatalogResponse>('/wallet/gifts/catalog');
    return response.data.catalog ?? [];
  },

  async sendGift(
    recipientId: string,
    giftType: "rose" | "star" | "crown",
    quantity = 1
  ): Promise<{ wallet: WalletState; gift?: GiftSendResponse["gift"] }> {
    const response = await apiClient.post<GiftSendResponse>(
      '/wallet/gifts/send',
      {
        recipientId,
        giftType,
        quantity,
      },
      {
        headers: {
          "x-idempotency-key": createIdempotencyKey("wallet-gift"),
        },
      }
    );

    return {
      wallet: response.data.wallet ?? defaultWalletState,
      gift: response.data.gift,
    };
  },

  async requestWithdrawal(
    amount: number,
    payoutMethod: string,
    payoutDestination: string
  ): Promise<WalletState> {
    const response = await apiClient.post<WalletResponse>(
      '/wallet/withdrawals',
      {
        amount,
        payoutMethod,
        payoutDestination,
      },
      {
        headers: {
          "x-idempotency-key": createIdempotencyKey("wallet-withdrawal"),
        },
      }
    );
    return response.data.wallet ?? defaultWalletState;
  },

  async getWithdrawals(params?: {
    scope?: "mine" | "all";
    status?: "pending" | "processing" | "completed" | "rejected" | "all";
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{ withdrawals: WithdrawalRequest[]; total?: number }> {
    const response = await apiClient.get<WithdrawalResponse>("/wallet/withdrawals", {
      params,
    });
    return { 
      withdrawals: response.data.withdrawals ?? [],
      total: response.data.withdrawals?.length
    };
  },

  async updateWithdrawalStatus(
    id: string,
    status: "processing" | "completed" | "rejected"
  ): Promise<WithdrawalRequest | null> {
    const response = await apiClient.patch<UpdateWithdrawalResponse>(
      `/wallet/withdrawals/${id}`,
      { status }
    );
    return response.data.withdrawal ?? null;
  },

  async bulkUpdateWithdrawalStatus(
    ids: string[],
    status: "processing" | "completed" | "rejected"
  ): Promise<{ success: boolean; updated: number }> {
    const response = await apiClient.patch<{ success: boolean; updated: number }>(
      `/wallet/withdrawals/bulk`,
      { ids, status }
    );
    return { success: response.data.success, updated: response.data.updated || ids.length };
  },
};
