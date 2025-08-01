import apiClient from '@/lib/api/client';

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

export interface UserStatusResponse {
    success: boolean;
    creator: {
        isCreator: boolean;
        isEligibleForCreator: boolean;
        creatorVerified: boolean;
        monetizationEnabled: boolean;
        creatorCategory: string | null;
        username?: string;
        stats: {
            subscribers: number;
            totalContent: number;
        };
        subscriptionPlans?: SubscriptionPlan[];
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
    subscribeToPlan: async (creatorId: string, planId: string): Promise<boolean> => {
        try {
            const response = await apiClient.post('/subscriptions', {
                creatorId,
                planId,
                paymentMethodId: 'pm_card_visa', // In a real app, this would come from the payment form
            });
            return response.data.success;
        } catch (error) {
            console.error('Error subscribing to plan:', error);
            return false;
        }
    },

    /**
     * Get a user's active subscriptions
     */
    getUserSubscriptions: async (userId: string): Promise<any> => {
        try {
            const response = await apiClient.get(`/users/${userId}/subscriptions`, {
                params: {
                    status: 'active',
                    mode: 'subscribing'
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
    }
};