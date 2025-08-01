import { useState, useCallback } from 'react';
import apiClient from "@/lib/api/client";
import { VIDEO_ENDPOINTS } from "@/lib/api/config";
import { useToast } from '@/hooks/useToast';
import axios from 'axios';
import { API_CONFIG } from "@/lib/api/config";
import { getTokens } from '@/lib/auth/tokens';

// Create a separate client for heavy operations like slideshow creation
const heavyOperationsClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 120000, // 2 minutes for heavy operations
    headers: API_CONFIG.HEADERS,
});

// Add auth interceptor to the heavy operations client
heavyOperationsClient.interceptors.request.use(async (config) => {
    const tokens = await getTokens();
    if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
});

interface CreatePostData {
    uploadId: string;
    title?: string;
    description?: string;
    soundId?: string;
    isPublic?: boolean;
}

interface CreateSlideshowData {
    uploadIds: string[];
    title?: string;
    description?: string;
    soundId?: string;
    slideDuration?: number;
    transition?: string;
    isPublic?: boolean;
}

interface PostResponse {
    success: boolean;
    message: string;
    video: {
        id: string;
        title: string;
        description: string;
        videoUrl: string;
        thumbnailUrl: string;
        duration: number;
        isPublic: boolean;
        user: {
            id: string;
            username: string;
            profilePhotoUrl: string;
        };
        sound?: {
            id: string;
            title: string;
            artistName: string;
        };
        createdAt: string;
        updatedAt: string;
    };
}

export const usePostApi = () => {
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    /**
     * Create a new video post
     */
    const createPost = useCallback(async (data: CreatePostData): Promise<PostResponse> => {
        try {
            setLoading(true);

            const response = await apiClient.post<PostResponse>(
                VIDEO_ENDPOINTS.VIDEOS,
                {
                    uploadId: data.uploadId,
                    title: data.title,
                    description: data.description,
                    soundId: data.soundId,
                    isPublic: data.isPublic !== undefined ? data.isPublic : true,
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Create post error:', error);

            // Better error handling for different error types
            let errorMessage = 'Failed to create post';

            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. Please try again.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Create multiple posts from multiple uploads
     */
    const createMultiplePosts = useCallback(async (
        uploadIds: string[],
        postData: Omit<CreatePostData, 'uploadId'>
    ): Promise<PostResponse[]> => {
        const results: PostResponse[] = [];
        const errors: Error[] = [];

        try {
            setLoading(true);

            // Create posts sequentially to avoid overwhelming the server
            for (const uploadId of uploadIds) {
                try {
                    const result = await createPost({
                        ...postData,
                        uploadId,
                    });
                    results.push(result);
                } catch (error) {
                    errors.push(error as Error);
                }
            }

            if (errors.length > 0) {
                if (errors.length === uploadIds.length) {
                    throw new Error('Failed to create any posts');
                } else {
                    toast.show(
                        'Partial Success',
                        `${results.length} of ${uploadIds.length} posts created successfully`
                    );
                }
            }

            return results;
        } finally {
            setLoading(false);
        }
    }, [createPost, toast]);

    /**
     * Create a slideshow video from multiple image uploads
     */
    const createSlideshow = useCallback(async (data: CreateSlideshowData): Promise<PostResponse> => {
        try {
            setLoading(true);

            console.log("Creating slideshow with data:", data);

            // Use the heavy operations client with longer timeout
            const response = await heavyOperationsClient.post<PostResponse>(
                VIDEO_ENDPOINTS.VIDEOS + '/slideshow',
                {
                    uploadIds: data.uploadIds,
                    title: data.title,
                    description: data.description,
                    soundId: data.soundId,
                    slideDuration: data.slideDuration || 3,
                    transition: data.transition || 'fade',
                    isPublic: data.isPublic !== undefined ? data.isPublic : true,
                }
            );

            console.log("Slideshow creation successful:", response.data);
            return response.data;
        } catch (error: any) {
            console.error('Create slideshow error:', error);

            // Better error handling for different error types
            let errorMessage = 'Failed to create slideshow';

            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Slideshow creation timed out. This usually means the video is being processed in the background. Please check your posts in a few minutes.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message === 'Network Error') {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get videos with filtering
     */
    const getVideos = useCallback(async (params?: {
        userId?: string;
        isPublic?: boolean;
        soundId?: string;
        page?: number;
        limit?: number;
    }) => {
        try {
            const response = await apiClient.get(VIDEO_ENDPOINTS.VIDEOS, { params });
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch videos';
            throw new Error(errorMessage);
        }
    }, []);

    /**
     * Get video by ID
     */
    const getVideoById = useCallback(async (id: string) => {
        try {
            const response = await apiClient.get(VIDEO_ENDPOINTS.VIDEO_BY_ID(id));
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch video';
            throw new Error(errorMessage);
        }
    }, []);

    /**
     * Like/unlike a video
     */
    const toggleLike = useCallback(async (videoId: string) => {
        try {
            const response = await apiClient.post(VIDEO_ENDPOINTS.LIKE(videoId));
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to like video';
            throw new Error(errorMessage);
        }
    }, []);

    /**
     * Record a video view
     */
    const recordView = useCallback(async (videoId: string, watchTime: number) => {
        try {
            const response = await apiClient.post(VIDEO_ENDPOINTS.VIEW(videoId), {
                watchTime,
            });
            return response.data;
        } catch (error: any) {
            console.error('Failed to record view:', error);
            // Don't throw error for view recording as it's not critical
        }
    }, []);

    /**
     * Share a video
     */
    const shareVideo = useCallback(async (videoId: string, platform: string) => {
        try {
            const response = await apiClient.post(VIDEO_ENDPOINTS.SHARE(videoId), {
                platform,
            });
            return response.data;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to share video';
            throw new Error(errorMessage);
        }
    }, []);

    return {
        createPost,
        createMultiplePosts,
        createSlideshow,
        getVideos,
        getVideoById,
        toggleLike,
        recordView,
        shareVideo,
        loading,
    };
};