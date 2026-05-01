import apiClient from './client';
import { isTokenAuthenticated } from "@/lib/auth/tokens";
import {
    ApiCommentRequest,
    ApiCommentResponse,
    ApiCommentsResponse,
    ApiLikeResponse,
    ApiPaginatedResponse,
    ApiCursorPaginatedResponse,
    ApiSharePlatform,
    ApiShareRequest,
    ApiShareResponse,
    ApiSuccessResponse,
    ApiVideo,
    ApiVideoResponse,
    ApiViewRequest
} from './types/video';

/**
 * Video Service - Handles all video-related API calls with authentication awareness
 * Uses the same token validation logic as AuthContext for consistency
 */
const VideoService = {
    // Helper function to check if user is authenticated - uses shared logic
    isAuthenticated: async (): Promise<boolean> => {
        try {
            return await isTokenAuthenticated();
        } catch {
            return false;
        }
    },

    // Legacy feed endpoints (page-based pagination) - Public access
    getFeed: async (page = 1, limit = 20, userId?: string): Promise<ApiPaginatedResponse<ApiVideo>> => {
        let params: any = { page, limit };
        if (userId) params.userId = userId;

        const response = await apiClient.get<ApiPaginatedResponse<ApiVideo>>('/videos', { params });
        return response.data;
    },

    // Get trending videos - Public access
    getTrending: async (period = 'week', limit = 20): Promise<ApiPaginatedResponse<ApiVideo>> => {
        const params = { period, limit };
        const response = await apiClient.get<ApiPaginatedResponse<ApiVideo>>('/videos/trending', { params });
        return response.data;
    },

    // Get personalized For You feed (cursor-based pagination) - Backend handles auth
    getForYouFeed: async (cursor?: string, limit = 10): Promise<ApiCursorPaginatedResponse<ApiVideo>> => {
        const params: any = { limit };
        if (cursor) params.cursor = cursor;

        const response = await apiClient.get<ApiCursorPaginatedResponse<ApiVideo>>('/videos/feed/for-you', { params });
        console.log("For You feed response:", response.data);
        return response.data;
    },

    // Get Following feed (videos from creators you follow) - Requires auth
    getFollowingFeed: async (cursor?: string, limit = 10): Promise<ApiCursorPaginatedResponse<ApiVideo>> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required for following feed');
        }

        const params: any = { limit };
        if (cursor) params.cursor = cursor;

        const response = await apiClient.get<ApiCursorPaginatedResponse<ApiVideo>>('/videos/feed/following', { params });
        return response.data;
    },

    // Get Subscribed feed (premium content from your subscriptions) - Requires auth
    getSubscribedFeed: async (cursor?: string, limit = 10): Promise<ApiCursorPaginatedResponse<ApiVideo>> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required for subscribed feed');
        }

        const params: any = { limit };
        if (cursor) params.cursor = cursor;

        const response = await apiClient.get<ApiCursorPaginatedResponse<ApiVideo>>('/videos/feed/subscribed', { params });
        return response.data;
    },

    // Get single video details - Public access with optional view recording
    getVideo: async (id: string, recordView = false): Promise<ApiVideoResponse> => {
        const isAuth = await VideoService.isAuthenticated();

        // Only record view if authenticated and requested
        const params = { recordView: (recordView && isAuth) ? 'true' : 'false' };
        const response = await apiClient.get<ApiVideoResponse>(`/videos/${id}`, { params });
        return response.data;
    },

    // Check if a video is liked by the current user - Requires auth
    checkLikeStatus: async (id: string): Promise<{liked: boolean}> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            // Return default state for unauthenticated users
            return { liked: false };
        }

        try {
            const response = await apiClient.get<{success: boolean, liked: boolean}>(`/videos/${id}/like`);
            return {
                liked: response.data.liked
            };
        } catch (error: any) {
            // If 401, user is not authenticated, return default
            if (error.response?.status === 401) {
                return { liked: false };
            }
            throw error;
        }
    },

    // Record detailed view analytics - Optional auth (anonymous views allowed)
    recordView: async (id: string, watchTime: number, completionRate?: number): Promise<ApiSuccessResponse> => {
        const data: ApiViewRequest = { watchTime };
        if (completionRate !== undefined) data.completionRate = completionRate;

        try {
            const response = await apiClient.post<ApiSuccessResponse>(`/videos/${id}/view`, data);
            return response.data;
        } catch (error: any) {
            // If not authenticated, still allow view recording (might be anonymous)
            if (error.response?.status === 401) {
                console.log('Recording anonymous view for video:', id);
                // Return success for anonymous views
                return { success: true };
            }
            throw error;
        }
    },

    // Toggle like on a video - Requires auth with consistent validation
    toggleLike: async (id: string): Promise<ApiLikeResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to like videos');
        }

        const response = await apiClient.post<ApiLikeResponse>(`/videos/${id}/like`, {});
        return response.data;
    },

    // Share a video to a platform - Requires auth for tracking
    shareVideo: async (id: string, platform: ApiSharePlatform): Promise<ApiShareResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            // For unauthenticated users, we can still provide share functionality
            // but without server-side tracking
            console.log('Sharing video without user tracking:', id, platform);
            return {
                success: true,
                message: 'Share initiated',
                sharesCount: 0
            };
        }

        const data: ApiShareRequest = { platform };
        const response = await apiClient.post<ApiShareResponse>(`/videos/${id}/share`, data);
        return response.data;
    },

    // Get comments for a video - Public access
    getComments: async (videoId: string, page = 1, limit = 20, parentId?: string): Promise<ApiCommentsResponse> => {
        let params: any = { page, limit };
        if (parentId) params.parentId = parentId;

        const response = await apiClient.get<ApiCommentsResponse>(`/videos/${videoId}/comment`, { params });
        return response.data;
    },

    // Add a comment to a video - Requires auth
    addComment: async (videoId: string, text: string, parentId?: string): Promise<ApiCommentResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to comment');
        }

        const data: ApiCommentRequest = { text };
        if (parentId) data.parentId = parentId;

        const response = await apiClient.post<ApiCommentResponse>(`/videos/${videoId}/comment`, data);
        return response.data;
    },

    // Delete a comment from a video - Requires auth
    deleteComment: async (videoId: string, commentId: string): Promise<ApiSuccessResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to delete comments');
        }

        const response = await apiClient.delete<ApiSuccessResponse>(
            `/videos/${videoId}/comment/${commentId}`
        );
        return response.data;
    },

    // Create a new video from an upload - Requires auth
    createVideo: async (uploadId: string, title?: string, description?: string, soundId?: string, isPublic = true): Promise<ApiVideoResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to create videos');
        }

        const data = {
            uploadId,
            title,
            description,
            soundId,
            isPublic
        };

        const response = await apiClient.post<ApiVideoResponse>('/videos', data);
        return response.data;
    },

    // Update a video's details - Requires auth
    updateVideo: async (id: string, data: {
        title?: string;
        description?: string;
        isPublic?: boolean;
        soundId?: string | null;
    }): Promise<ApiVideoResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to update videos');
        }

        const response = await apiClient.patch<ApiVideoResponse>(`/videos/${id}`, data);
        return response.data;
    },

    // Repost a video to the current user's profile/feed - Requires auth
    repostVideo: async (id: string): Promise<ApiVideoResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to repost videos');
        }

        const response = await apiClient.post<ApiVideoResponse>(`/videos/${id}/repost`, {});
        return response.data;
    },

    // Delete a video - Requires auth
    deleteVideo: async (id: string): Promise<ApiSuccessResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to delete videos');
        }

        const response = await apiClient.delete<ApiSuccessResponse>(`/videos/${id}`);
        return response.data;
    },

    // Bookmark/Save a video - Requires auth
    toggleBookmark: async (id: string): Promise<{success: boolean, bookmarked: boolean}> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to bookmark videos');
        }

        const response = await apiClient.post<{success: boolean, bookmarked: boolean}>(`/videos/${id}/bookmark`, {});
        return response.data;
    },

    // Check if a video is bookmarked - Requires auth
    checkBookmarkStatus: async (id: string): Promise<{bookmarked: boolean}> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            return { bookmarked: false };
        }

        try {
            const response = await apiClient.get<{success: boolean, bookmarked: boolean}>(`/videos/${id}/bookmark`);
            return { bookmarked: response.data.bookmarked };
        } catch (error: any) {
            if (error.response?.status === 401) {
                return { bookmarked: false };
            }
            throw error;
        }
    },

    // Report a video - Requires auth
    reportVideo: async (id: string, reason: string, description?: string): Promise<ApiSuccessResponse> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to report videos');
        }

        const data = { reason, description };
        const response = await apiClient.post<ApiSuccessResponse>(`/videos/${id}/report`, data);
        return response.data;
    },

    // Get video analytics (for creators) - Requires auth
    getVideoAnalytics: async (id: string): Promise<any> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to view analytics');
        }

        const response = await apiClient.get(`/videos/${id}/analytics`);
        return response.data;
    },

    // Follow/Unfollow user from video context - Requires auth
    toggleUserFollow: async (userId: string): Promise<{success: boolean, following: boolean}> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            throw new Error('Authentication required to follow users');
        }

        const response = await apiClient.post<{success: boolean, following: boolean}>(`/users/${userId}/follow`, {});
        return response.data;
    },

    // Check if following a user - Requires auth
    checkFollowStatus: async (userId: string): Promise<{following: boolean}> => {
        const isAuth = await VideoService.isAuthenticated();
        if (!isAuth) {
            return { following: false };
        }

        try {
            const response = await apiClient.get<{success: boolean, following: boolean}>(`/users/${userId}/follow`);
            return { following: response.data.following };
        } catch (error: any) {
            if (error.response?.status === 401) {
                return { following: false };
            }
            throw error;
        }
    }
};

export default VideoService;
