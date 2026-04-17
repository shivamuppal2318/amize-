import apiClient from '@/lib/api/client';
import { createIdempotencyKey } from '@/lib/network/idempotency';

// Types
export interface Creator {
    id: string;
    username: string;
    profilePhotoUrl: string;
    verified: boolean;
    category: string | null;
    subscriberCount: number;
    monetizationEnabled: boolean;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    intervalType: string;
    features: string[];
    creatorId: string | null;
    isTemplate: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Pricing {
    defaultPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
}

export interface UserSubscription {
    id: string;
    planId: string;
    startDate: string;
    endDate: string | null;
    autoRenew: boolean;
}

export interface SubscriptionPaymentRecord {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
}

export interface UserSubscriptionRecord {
    id: string;
    creatorId?: string;
    creator?: {
        id: string;
        username: string;
        profilePhotoUrl?: string | null;
        fullName?: string | null;
    };
    creatorName?: string;
    creatorUsername?: string;
    planId?: string;
    plan?: {
        id: string;
        name: string;
        price: number;
        currency: string;
        intervalType: string;
    };
    planName?: string;
    amount?: number;
    currency?: string;
    status?: string;
    autoRenew?: boolean;
    startDate?: string;
    endDate?: string | null;
    SubscriptionPayment?: SubscriptionPaymentRecord[];
}

export interface UserSubscriptionsResponse {
    success: boolean;
    subscriptions: UserSubscriptionRecord[];
    stats: {
        total: number;
        active: number;
        spending: number;
        currency?: string;
        period?: string;
    };
}

export interface SubscriberRecord {
    id: string;
    status: string;
    autoRenew: boolean;
    startDate: string;
    endDate: string | null;
    subscriber?: {
        id: string;
        username: string;
        profilePhotoUrl?: string | null;
        fullName?: string | null;
    };
    plan?: {
        id: string;
        name: string;
        price: number;
        currency: string;
        intervalType: string;
    };
    SubscriptionPayment?: SubscriptionPaymentRecord[];
}

export interface RefundSubscriptionPaymentResult {
    success: boolean;
    message: string;
    refund?: {
        id: string;
        amount: number;
        currency: string;
        originalPaymentId: string;
        transactionId: string;
        reason: string;
        status?: string;
        createdAt: string;
    };
    subscription?: {
        id: string;
        status: string;
        message: string;
    };
}

export interface CreatorSubscriberResponse {
    success: boolean;
    subscriptions: SubscriberRecord[];
    stats: {
        total: number;
        active: number;
        revenue: number;
        currency?: string;
        period?: string;
    };
}

export interface CreatorAnalyticsResponse {
    success: boolean;
    creator: {
        id: string;
        username: string;
        fullName?: string | null;
        creatorCategory?: string | null;
        isEligibleForCreator: boolean;
        monetizationEnabled: boolean;
    };
    overview: {
        periodDays: number;
        activeSubscribers: number;
        revenue: number;
        currency: string;
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        totalShares: number;
        averageWatchTime: number;
        averageCompletionRate: number;
    };
    topVideos: Array<{
        id: string;
        title: string | null;
        thumbnailUrl: string | null;
        createdAt: string;
        views: number;
        likes: number;
        comments: number;
        shares: number;
    }>;
    recentPayments: Array<{
        amount: number;
        currency: string;
        createdAt: string;
    }>;
}

export interface FollowStats {
    followers: number;
    following: number;
}

export interface FollowStatus {
    isFollowing: boolean;
    stats: FollowStats;
}

export interface RecentVideo {
    id: string;
    title: string | null;
    thumbnailUrl: string | null;
    createdAt: string;
}

export interface CreatorPlansResponse {
    success: boolean;
    creator: Creator;
    pricing: Pricing;
    plans: SubscriptionPlan[];
    userSubscription: UserSubscription | null;
    recentContent: RecentVideo[];
}

export interface CreatorSearchResult {
    id: string;
    username: string;
    fullName: string | null;
    profilePhotoUrl: string | null;
    verified: boolean;
    category: string | null;
    subscriberCount: number;
    monetizationEnabled: boolean;
    hasActivePlan: boolean;
}

export interface CreatorSearchResponse {
    success: boolean;
    creators: CreatorSearchResult[];
    total: number;
}

export interface PaymentIntentState {
    attemptId?: string;
    provider: string;
    providerName?: string;
    status: 'succeeded' | 'requires_action';
    transactionId: string;
    clientSecret?: string;
}

export interface SubscriptionActionResult {
    success: boolean;
    requiresAction?: boolean;
    message?: string;
    payment?: PaymentIntentState;
}

export interface UserStatusResponse {
    success: boolean;
    creator: {
        isCreator: boolean;
        isEligibleForCreator: boolean;
        creatorVerified: boolean;
        monetizationEnabled: boolean;
        creatorCategory: string | null;
        stripeConnect?: {
            accountId: string | null;
            chargesEnabled: boolean;
            payoutsEnabled: boolean;
            detailsSubmitted: boolean;
            onboardedAt?: string | null;
        };
        username?: string;
        stats: {
            subscribers: number;
            totalContent: number;
        };
        subscriptionPlans?: SubscriptionPlan[];
    };
}

export interface CreatorConnectStatusResponse {
    success: boolean;
    connect: {
        provider: string;
        accountId: string | null;
        onboardingUrl?: string;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
        onboardedAt?: string | null;
    };
}

export interface FollowResponse {
    success: boolean;
    message: string;
    follow?: {
        id: string;
        createdAt: string;
    };
    stats?: {
        followingCount: number;
        followerCount: number;
    };
}

export interface UnfollowResponse {
    success: boolean;
    message: string;
    stats?: {
        followingCount: number;
        followerCount: number;
    };
}

export interface GetFollowStatusResponse {
    success: boolean;
    follow: FollowStatus;
}

// API functions
export const SocialAPI = {
    /**
     * Follow a user
     */
    followUser: async (userId: string): Promise<FollowResponse> => {
        try {
            const response = await apiClient.post(`/users/${userId}/follow`);
            return response.data;
        } catch (error) {
            console.error('Error following user:', error);
            return {
                success: false,
                message: 'Failed to follow user',
            };
        }
    },

    /**
     * Unfollow a user
     */
    unfollowUser: async (userId: string): Promise<UnfollowResponse> => {
        try {
            const response = await apiClient.delete(`/users/${userId}/follow`);
            return response.data;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            return {
                success: false,
                message: 'Failed to unfollow user',
            };
        }
    },

    /**
     * Get follow status and counts
     */
    getFollowStatus: async (userId: string): Promise<GetFollowStatusResponse> => {
        try {
            const response = await apiClient.get(`/users/${userId}/follow`);
            return response.data;
        } catch (error) {
            console.error('Error getting follow status:', error);
            return {
                success: false,
                follow: {
                    isFollowing: false,
                    stats: {
                        followers: 0,
                        following: 0
                    }
                }
            };
        }
    }
};

// API functions
export const CreatorAPI = {
    /**
     * Search/browse creators with monetization enabled
     */
    searchCreators: async (query?: string, limit = 20, offset = 0): Promise<CreatorSearchResponse> => {
        try {
            const response = await apiClient.get('/creators/search', {
                params: { q: query, limit, offset }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching creators:', error);
            return {
                success: false,
                creators: [],
                total: 0
            };
        }
    },

    /**
     * Get a creator's subscription plans
     */
    getCreatorPlans: async (creatorId: string): Promise<CreatorPlansResponse> => {
        try {
            const response = await apiClient.get(`/creators/${creatorId}/subscription-plans`);
            return response.data;
        } catch (error) {
            console.error('Error fetching creator plans:', error);
            // Return a default object with empty arrays instead of throwing
            return {
                success: false,
                creator: {
                    id: creatorId,
                    username: 'Unknown',
                    profilePhotoUrl: '',
                    verified: false,
                    category: null,
                    subscriberCount: 0,
                    monetizationEnabled: false
                },
                pricing: {
                    defaultPrice: null,
                    minPrice: null,
                    maxPrice: null
                },
                plans: [],
                userSubscription: null,
                recentContent: []
            };
        }
    },

    /**
     * Get a user's creator status
     */
    getUserCreatorStatus: async (userId: string): Promise<UserStatusResponse> => {
        try {
            const response = await apiClient.get(`/users/${userId}/creator-status`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user creator status:', error);
            // Return a default object
            return {
                success: false,
                creator: {
                    isCreator: false,
                    isEligibleForCreator: false,
                    creatorVerified: false,
                    monetizationEnabled: false,
                    creatorCategory: null,
                    stats: {
                        subscribers: 0,
                        totalContent: 0
                    }
                }
            };
        }
    },

    /**
     * Check if a user is subscribed to a creator
     */
    checkSubscriptionStatus: async (userId: string, creatorId: string): Promise<boolean> => {
        try {
            const response = await apiClient.get(`/users/${userId}/subscriptions`, {
                params: {
                    status: 'active'
                }
            });

            if (response.data.success) {
                return response.data.subscriptions.some(
                    (sub: any) => sub.creatorId === creatorId && sub.status === 'active'
                );
            }
            return false;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    },

    /**
     * Subscribe to a creator's plan
     */
    subscribeToPlan: async (
        creatorId: string,
        planId: string,
        paymentMethodId?: string,
        options?: {
            receiptToken?: string;
            receiptPlatform?: "android_play" | "ios_app_store" | "web";
            retryAttempt?: number;
        }
    ): Promise<SubscriptionActionResult> => {
        try {
            const response = await apiClient.post(
                '/subscriptions',
                {
                    creatorId,
                    planId,
                    ...(paymentMethodId ? { paymentMethodId } : {}),
                    ...(options?.receiptToken
                        ? {
                            receipt: {
                                token: options.receiptToken,
                                platform: options.receiptPlatform || "android_play",
                                retryAttempt: options.retryAttempt || 0,
                            },
                        }
                        : {}),
                },
                {
                    headers: {
                        "x-idempotency-key": createIdempotencyKey("sub-create"),
                    },
                }
            );

            return {
                success: !!response.data.success,
                requiresAction: !!response.data.requiresAction,
                message: response.data.message,
                payment: response.data.payment,
            };
        } catch (error) {
            console.error('Error subscribing to plan:', error);
            return {
                success: false,
                message: 'Failed to subscribe to creator plan',
            };
        }
    },

    /**
     * Get a user's active subscriptions
     */
    getUserSubscriptions: async (
        userId: string,
        options?: {
            status?: 'active' | 'canceled' | 'expired' | 'all';
            mode?: 'subscribing' | 'subscribers';
            limit?: number;
            offset?: number;
        }
    ): Promise<UserSubscriptionsResponse> => {
        try {
            const response = await apiClient.get(`/users/${userId}/subscriptions`, {
                params: {
                    status: options?.status || 'active',
                    mode: options?.mode || 'subscribing',
                    limit: options?.limit,
                    offset: options?.offset
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user subscriptions:', error);
            return {
                success: false,
                subscriptions: [],
                stats: {
                    total: 0,
                    active: 0,
                    spending: 0
                }
            };
        }
    },

    /**
     * Get creator subscriber roster and revenue summary
     */
    getCreatorSubscribers: async (userId: string): Promise<CreatorSubscriberResponse> => {
        try {
            const response = await apiClient.get(`/users/${userId}/subscriptions`, {
                params: {
                    status: 'all',
                    mode: 'subscribers',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching creator subscribers:', error);
            return {
                success: false,
                subscriptions: [],
                stats: {
                    total: 0,
                    active: 0,
                    revenue: 0,
                    currency: 'USD',
                },
            };
        }
    },

    /**
     * Get creator analytics summary
     */
    getCreatorAnalytics: async (userId: string): Promise<CreatorAnalyticsResponse> => {
        try {
            const response = await apiClient.get(`/users/${userId}/creator-analytics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching creator analytics:', error);
            return {
                success: false,
                creator: {
                    id: userId,
                    username: 'creator',
                    fullName: null,
                    creatorCategory: null,
                    isEligibleForCreator: false,
                    monetizationEnabled: false,
                },
                overview: {
                    periodDays: 30,
                    activeSubscribers: 0,
                    revenue: 0,
                    currency: 'USD',
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    averageWatchTime: 0,
                    averageCompletionRate: 0,
                },
                topVideos: [],
                recentPayments: [],
            };
        }
    },

    /**
     * Cancel a subscription
     */
    cancelSubscription: async (subscriptionId: string): Promise<boolean> => {
        try {
            const response = await apiClient.patch(`/subscriptions/${subscriptionId}/cancel`);
            return response.data.success;
        } catch (error) {
            console.error('Error canceling subscription:', error);
            return false;
        }
    },

    refundSubscriptionPayment: async (
        paymentId: string,
        options?: {
            reason?: string;
            amount?: number;
            cancelSubscription?: boolean;
        }
    ): Promise<RefundSubscriptionPaymentResult> => {
        try {
            const response = await apiClient.post(
                `/subscription-payments/${paymentId}/refund`,
                {
                    reason: options?.reason || "Creator-issued refund",
                    amount: options?.amount,
                    cancelSubscription: options?.cancelSubscription ?? false,
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error refunding subscription payment:', error);
            return {
                success: false,
                message:
                    error?.response?.data?.message ||
                    'Failed to refund subscription payment',
            };
        }
    },

    getCreatorConnectStatus: async (): Promise<CreatorConnectStatusResponse> => {
        try {
            const response = await apiClient.get('/creators/connect');
            return response.data;
        } catch (error: any) {
            // 403 is an expected outcome for non-creator accounts; the UI renders a "not connected" state.
            if (error?.response?.status !== 403) {
                console.error('Error fetching creator connect status:', error);
            }
            return {
                success: false,
                connect: {
                    provider: 'unknown',
                    accountId: null,
                    chargesEnabled: false,
                    payoutsEnabled: false,
                    detailsSubmitted: false,
                    onboardedAt: null,
                },
            };
        }
    },

    createCreatorConnectOnboarding: async (): Promise<CreatorConnectStatusResponse> => {
        try {
            const response = await apiClient.post('/creators/connect');
            return response.data;
        } catch (error: any) {
            // 403 is an expected outcome for non-creator accounts; surface a clean fallback.
            if (error?.response?.status !== 403) {
                console.error('Error creating creator connect onboarding:', error);
            }
            return {
                success: false,
                connect: {
                    provider: 'unknown',
                    accountId: null,
                    chargesEnabled: false,
                    payoutsEnabled: false,
                    detailsSubmitted: false,
                    onboardedAt: null,
                },
            };
        }
    },
};
