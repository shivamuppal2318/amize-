import apiClient from './client';
import { isTokenAuthenticated } from "@/lib/auth/tokens";
import { MixedFeedItem } from "@/lib/api/types/video";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Original types (keep for backward compatibility)
export interface SearchUser {
    id: string;
    username: string;
    fullName: string;
    bio?: string;
    profilePhotoUrl?: string;
    verified: boolean;
    category?: string;
    followersCount: number;
    videosCount: number;
    type: 'user';
}

export interface SearchVideo {
    id: string;
    title?: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    user: {
        id: string;
        username: string;
        fullName: string;
        profilePhotoUrl?: string;
        creatorVerified: boolean;
    };
    sound?: {
        id: string;
        title: string;
        artistName?: string;
        soundUrl: string;
        duration: number;
    };
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    createdAt: string;
    trendingScore?: number;
    type: 'video';
}

export interface SearchSound {
    id: string;
    title: string;
    artistName?: string;
    soundUrl: string;
    duration: number;
    isOriginal: boolean;
    videosCount: number;
    recentEngagement?: number;
    createdAt: string;
    type: 'sound';
}

export interface ExploreCreator {
    id: string;
    username: string;
    fullName: string;
    bio?: string;
    profilePhotoUrl?: string;
    verified: boolean;
    category?: string;
    followersCount: number;
    videosCount: number;
    recentEngagement: number;
    type: 'creator';
}

export interface ExploreCategory {
    name: string;
    videosCount: number;
    type: 'category';
}

export interface SearchResults {
    users: SearchUser[];
    videos: SearchVideo[];
    sounds: SearchSound[];
    total: number;
}

// New types for mixed feed
export interface MixedFeedResponse {
    success: boolean;
    feed: MixedFeedItem[];
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface ExploreContent {
    section: string;
    content: (SearchVideo | ExploreCreator | ExploreCategory | SearchSound)[];
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface SearchParams {
    q: string;
    type?: 'all' | 'users' | 'videos' | 'sounds';
    limit?: number;
    offset?: number;
    sort?: 'relevance' | 'recent' | 'popular';
}

export interface MixedFeedParams {
    limit?: number;
    offset?: number;
    query?: string;
    type?: 'all' | 'videos' | 'users' | 'sounds';
}

export interface ExploreParams {
    section?: 'trending' | 'creators' | 'categories' | 'sounds' | 'recommendations';
    category?: string;
    timeframe?: 'hour' | 'day' | 'week' | 'month' | 'all';
    limit?: number;
    offset?: number;
}

export interface ApiSearchResponse {
    success: boolean;
    query: string;
    type: string;
    results: SearchResults;
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}

export interface ApiExploreResponse {
    success: boolean;
    section: string;
    content: any[];
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

type StoredSearchHistoryItem = {
    id: string;
    query: string;
    timestamp: number;
    resultCount?: number;
    type?: 'search' | 'trending';
};

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_SEARCH_HISTORY_ITEMS = 50;

const loadStoredSearchHistory = async (): Promise<StoredSearchHistoryItem[]> => {
    const rawHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);

    if (!rawHistory) {
        return [];
    }

    try {
        const parsedHistory = JSON.parse(rawHistory) as StoredSearchHistoryItem[];
        return Array.isArray(parsedHistory) ? parsedHistory : [];
    } catch (error) {
        console.warn('Failed to parse stored search history:', error);
        return [];
    }
};

const saveStoredSearchHistory = async (
    history: StoredSearchHistoryItem[]
): Promise<void> => {
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
};

const addSearchQueryToHistory = async (
    query: string,
    resultCount?: number
): Promise<void> => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
        return;
    }

    const existingHistory = await loadStoredSearchHistory();
    const filteredHistory = existingHistory.filter(
        (item) => item.query.toLowerCase() !== trimmedQuery
    );

    const nextHistory: StoredSearchHistoryItem[] = [
        {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            query: trimmedQuery,
            timestamp: Date.now(),
            resultCount,
            type: 'search' as const,
        },
        ...filteredHistory,
    ].slice(0, MAX_SEARCH_HISTORY_ITEMS);

    await saveStoredSearchHistory(nextHistory);
};

/**
 * Enhanced Search and Explore Service with Mixed Feed Support
 */
const SearchService = {
    // Helper function to check if user is authenticated
    isAuthenticated: async (): Promise<boolean> => {
        try {
            return await isTokenAuthenticated();
        } catch {
            return false;
        }
    },

    // NEW: Get mixed feed for masonry grid
    getMixedFeed: async (params: MixedFeedParams = {}): Promise<MixedFeedResponse> => {
        const searchParams = new URLSearchParams();

        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());
        if (params.query) searchParams.append('query', params.query);
        if (params.type) searchParams.append('type', params.type);

        const response = await apiClient.get<MixedFeedResponse>(`/explore/feed?${searchParams.toString()}`);
        return response.data;
    },

    // NEW: Get mixed search results for masonry grid
    searchMixed: async (query: string, params: Omit<MixedFeedParams, 'query'> = {}): Promise<MixedFeedResponse> => {
        return SearchService.getMixedFeed({ ...params, query });
    },

    // NEW: Get suggestions for search
    getSearchSuggestions: async (query: string, limit = 5): Promise<string[]> => {
        if (query.length < 2) return [];

        try {
            // This could be a separate endpoint or derived from search results
            const results = await SearchService.search({
                q: query,
                type: 'all',
                limit: limit * 2,
                sort: 'popular'
            });

            const suggestions = new Set<string>();

            // Extract suggestions from search results
            results.videos.forEach(video => {
                if (video.title && video.title.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(video.title);
                }
            });

            results.users.forEach(user => {
                suggestions.add(user.username);
                if (user.fullName) suggestions.add(user.fullName);
            });

            results.sounds.forEach(sound => {
                suggestions.add(sound.title);
                if (sound.artistName) suggestions.add(sound.artistName);
            });

            return Array.from(suggestions).slice(0, limit);
        } catch (error) {
            console.warn('Search suggestions failed:', error);
            return [];
        }
    },

    // UPDATED: Enhanced search with better error handling
    search: async (params: SearchParams): Promise<SearchResults> => {
        const searchParams = new URLSearchParams();

        searchParams.append('q', params.q);
        if (params.type) searchParams.append('type', params.type);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());
        if (params.sort) searchParams.append('sort', params.sort);

        try {
            const response = await apiClient.get<ApiSearchResponse>(`/search?${searchParams.toString()}`);
            const totalResults = response.data.results.total;

            addSearchQueryToHistory(params.q, totalResults).catch((error) => {
                console.warn('Failed to persist search history:', error);
            });

            return response.data.results;
        } catch (error) {
            console.error('Search failed:', error);
            return { users: [], videos: [], sounds: [], total: 0 };
        }
    },

    // Get search suggestions (legacy - kept for backward compatibility)
    searchSuggestions: async (query: string, limit = 5): Promise<{
        users: SearchUser[];
        videos: SearchVideo[];
        sounds: SearchSound[];
    }> => {
        if (query.length < 2) {
            return { users: [], videos: [], sounds: [] };
        }

        try {
            const results = await SearchService.search({
                q: query,
                type: 'all',
                limit,
                sort: 'popular'
            });

            return {
                users: results.users.slice(0, limit),
                videos: results.videos.slice(0, limit),
                sounds: results.sounds.slice(0, limit),
            };
        } catch (error) {
            console.warn('Search suggestions failed:', error);
            return { users: [], videos: [], sounds: [] };
        }
    },

    // Get explore content (legacy)
    getExploreContent: async (params: ExploreParams = {}): Promise<ExploreContent> => {
        const searchParams = new URLSearchParams();

        if (params.section) searchParams.append('section', params.section);
        if (params.category) searchParams.append('category', params.category);
        if (params.timeframe) searchParams.append('timeframe', params.timeframe);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());

        const response = await apiClient.get<ApiExploreResponse>(`/explore?${searchParams.toString()}`);
        return {
            section: response.data.section,
            content: response.data.content,
            pagination: response.data.pagination
        };
    },

    // Get trending videos (legacy)
    getTrendingVideos: async (timeframe: 'hour' | 'day' | 'week' | 'month' | 'all' = 'week', limit = 20, offset = 0): Promise<SearchVideo[]> => {
        try {
            const content = await SearchService.getExploreContent({
                section: 'trending',
                timeframe,
                limit,
                offset
            });
            return content.content as SearchVideo[];
        } catch (error) {
            console.error('Failed to get trending videos:', error);
            return [];
        }
    },

    // Get popular creators (legacy)
    getPopularCreators: async (timeframe: 'week' | 'month' | 'all' = 'week', limit = 20, offset = 0): Promise<ExploreCreator[]> => {
        try {
            const content = await SearchService.getExploreContent({
                section: 'creators',
                timeframe,
                limit,
                offset
            });
            return content.content as ExploreCreator[];
        } catch (error) {
            console.error('Failed to get popular creators:', error);
            return [];
        }
    },

    // Get categories (legacy)
    getCategories: async (limit = 20, offset = 0): Promise<ExploreCategory[]> => {
        try {
            const content = await SearchService.getExploreContent({
                section: 'categories',
                limit,
                offset
            });
            return content.content as ExploreCategory[];
        } catch (error) {
            console.error('Failed to get categories:', error);
            return [];
        }
    },

    // Get category content (legacy)
    getCategoryContent: async (category: string, limit = 20, offset = 0): Promise<SearchVideo[]> => {
        try {
            const content = await SearchService.getExploreContent({
                section: 'categories',
                category,
                limit,
                offset
            });
            return content.content as SearchVideo[];
        } catch (error) {
            console.error('Failed to get category content:', error);
            return [];
        }
    },

    // Get trending sounds (legacy)
    getTrendingSounds: async (timeframe: 'week' | 'month' | 'all' = 'week', limit = 20, offset = 0): Promise<SearchSound[]> => {
        try {
            const content = await SearchService.getExploreContent({
                section: 'sounds',
                timeframe,
                limit,
                offset
            });
            return content.content as SearchSound[];
        } catch (error) {
            console.error('Failed to get trending sounds:', error);
            return [];
        }
    },

    // Get personalized recommendations (legacy)
    getRecommendations: async (limit = 20, offset = 0): Promise<SearchVideo[]> => {
        const isAuth = await SearchService.isAuthenticated();
        if (!isAuth) {
            // For unauthenticated users, return trending content
            return SearchService.getTrendingVideos('week', limit, offset);
        }

        try {
            const content = await SearchService.getExploreContent({
                section: 'recommendations',
                limit,
                offset
            });
            return content.content as SearchVideo[];
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            return SearchService.getTrendingVideos('week', limit, offset);
        }
    },

    // UPDATED: Get mixed explore content for the main explore feed
    getExploreFeed: async (limit = 20, offset = 0): Promise<{
        trending: SearchVideo[];
        creators: ExploreCreator[];
        sounds: SearchSound[];
        categories: ExploreCategory[];
    }> => {
        try {
            // Use the new mixed feed endpoint for better performance
            const mixedFeed = await SearchService.getMixedFeed({ limit: limit * 2, offset });

            // Separate by type for backward compatibility
            const trending = mixedFeed.feed
                .filter(item => item.type === 'video')
                .map(item => item.data as SearchVideo);

            const creators = mixedFeed.feed
                .filter(item => item.type === 'user')
                .map(item => ({ ...item.data, type: 'creator' }) as ExploreCreator);

            const sounds = mixedFeed.feed
                .filter(item => item.type === 'sound')
                .map(item => item.data as SearchSound);

            // Get categories separately since they're not in mixed feed
            const categories = await SearchService.getCategories(Math.ceil(limit * 0.1), 0);

            return {
                trending: trending.slice(0, Math.ceil(limit * 0.4)),
                creators: creators.slice(0, Math.ceil(limit * 0.3)),
                sounds: sounds.slice(0, Math.ceil(limit * 0.2)),
                categories,
            };
        } catch (error) {
            console.error('Error getting explore feed:', error);
            // Fallback to individual calls
            const [trending, creators, sounds, categories] = await Promise.all([
                SearchService.getTrendingVideos('week', Math.ceil(limit * 0.4), 0),
                SearchService.getPopularCreators('week', Math.ceil(limit * 0.3), 0),
                SearchService.getTrendingSounds('week', Math.ceil(limit * 0.2), 0),
                SearchService.getCategories(Math.ceil(limit * 0.1), 0),
            ]);

            return { trending, creators, sounds, categories };
        }
    },

    // Search with debouncing helper (legacy)
    debouncedSearch: (() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        return (params: SearchParams, delay = 300): Promise<SearchResults> => {
            return new Promise((resolve, reject) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                timeoutId = setTimeout(async () => {
                    try {
                        const results = await SearchService.search(params);
                        resolve(results);
                    } catch (error) {
                        reject(error);
                    }
                }, delay);
            });
        };
    })(),

    // NEW: Debounced mixed feed search
    debouncedMixedSearch: (() => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        return (query: string, params: Omit<MixedFeedParams, 'query'> = {}, delay = 300): Promise<MixedFeedResponse> => {
            return new Promise((resolve, reject) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                timeoutId = setTimeout(async () => {
                    try {
                        const results = await SearchService.searchMixed(query, params);
                        resolve(results);
                    } catch (error) {
                        reject(error);
                    }
                }, delay);
            });
        };
    })(),

    // Get search history from local storage for mobile/web persistence
    getSearchHistory: async (): Promise<string[]> => {
        try {
            const history = await loadStoredSearchHistory();
            return history
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((item) => item.query);
        } catch (error) {
            console.warn('Failed to get search history:', error);
            return [];
        }
    },

    // Clear locally stored search history
    clearSearchHistory: async (): Promise<boolean> => {
        try {
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
            return true;
        } catch (error) {
            console.warn('Failed to clear search history:', error);
            return false;
        }
    },

    saveSearchHistoryEntry: async (query: string, resultCount?: number): Promise<void> => {
        try {
            await addSearchQueryToHistory(query, resultCount);
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    },

    // Utility functions
    formatNumber: (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    },

    // Content type detection helpers
    getContentPriority: (item: MixedFeedItem): number => {
        return item.priority || 0;
    },

    getAspectRatioHeight: (aspectRatio: string, width: number): number => {
        switch (aspectRatio) {
            case '1:1': return width;
            case '1:2': return width * 2;
            case '2:3': return width * 1.5;
            case '9:16': return width * 1.78;
            case '2:1': return width * 0.5;
            default: return width;
        }
    },
};

export default SearchService;
