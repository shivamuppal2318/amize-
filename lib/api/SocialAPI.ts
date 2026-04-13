import apiClient from './client';

export interface FollowResponse {
    success: boolean;
    message?: string;
    followerCount?: number;
}

export interface FollowStatusResponse {
    success: boolean;
    follow: {
        isFollowing: boolean;
        stats: {
            followers: number;
            following: number;
        };
    };
}

export class SocialAPI {
    /**
     * Follow a user
     */
    static async followUser(userId: string): Promise<FollowResponse> {
        try {
            const response = await apiClient.post(`/api/users/${userId}/follow`);
            return response.data;
        } catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    }

    /**
     * Unfollow a user
     */
    static async unfollowUser(userId: string): Promise<FollowResponse> {
        try {
            const response = await apiClient.delete(`/api/users/${userId}/follow`);
            return response.data;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    }

    /**
     * Get follow status and stats for a user
     */
    static async getFollowStatus(userId: string): Promise<FollowStatusResponse> {
        try {
            const response = await apiClient.get(`/users/${userId}/follow`);
            return response.data;
        } catch (error) {
            console.error('Error getting follow status:', error);
            throw error;
        }
    }

    /**
     * Get user's followers list
     */
    static async getFollowers(userId: string, page: number = 1, limit: number = 20) {
        try {
            const response = await apiClient.get(`/users/${userId}/followers`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting followers:', error);
            throw error;
        }
    }

    /**
     * Get user's following list
     */
    static async getFollowing(userId: string, page: number = 1, limit: number = 20) {
        try {
            const response = await apiClient.get(`/users/${userId}/following`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting following:', error);
            throw error;
        }
    }

    /**
     * Search for users to follow
     */
    static async searchUsers(query: string, page: number = 1, limit: number = 20) {
        try {
            const response = await apiClient.get('/api/users/search', {
                params: { q: query, page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }

    /**
     * Get suggested users to follow
     */
    static async getSuggestedUsers(limit: number = 10) {
        try {
            const response = await apiClient.get('/api/users/suggested', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting suggested users:', error);
            throw error;
        }
    }

    /**
     * Block a user
     */
    static async blockUser(userId: string) {
        try {
            const response = await apiClient.post(`/api/users/${userId}/block`);
            return response.data;
        } catch (error) {
            console.error('Error blocking user:', error);
            throw error;
        }
    }

    /**
     * Unblock a user
     */
    static async unblockUser(userId: string) {
        try {
            const response = await apiClient.delete(`/api/users/${userId}/block`);
            return response.data;
        } catch (error) {
            console.error('Error unblocking user:', error);
            throw error;
        }
    }

    /**
     * Report a user
     */
    static async reportUser(userId: string, reason: string, description?: string) {
        try {
            const response = await apiClient.post(`/users/${userId}/report`, {
                reason,
                description
            });
            return response.data;
        } catch (error) {
            console.error('Error reporting user:', error);
            throw error;
        }
    }
}
