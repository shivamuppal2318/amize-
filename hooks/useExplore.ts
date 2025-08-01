import { useState, useEffect, useCallback, useRef } from 'react';
import SearchService, {
    SearchResults,
    SearchVideo,
    SearchUser,
    SearchSound,
    ExploreCreator,
    ExploreCategory,
    SearchParams,
    MixedFeedParams,
    MixedFeedResponse,
} from '@/lib/api/exploreService';
import { MixedFeedItem } from "@/lib/api/types/video";

interface UseExploreOptions {
    initialQuery?: string;
    debounceDelay?: number;
    suggestionsLimit?: number;
    contentLimit?: number;
    enableMixedFeed?: boolean;
    loadMoreThreshold?: number; // Distance from bottom to trigger load more
    minLoadInterval?: number; // Minimum time between load requests (ms)
}

interface UseExploreReturn {
    // Mixed feed data
    mixedFeed: MixedFeedItem[];
    mixedFeedLoading: boolean;
    mixedFeedHasMore: boolean;
    loadMixedFeed: (refresh?: boolean) => Promise<void>;

    // Search functionality
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: SearchResults | null;
    searchLoading: boolean;
    isSearchActive: boolean;
    hasSearchResults: boolean;

    // Search suggestions
    searchSuggestions: string[];
    hasSuggestions: boolean;

    // Legacy explore data (for backward compatibility)
    exploreData: ExploreSection[];
    exploreLoading: boolean;

    // Common functionality
    refreshing: boolean;
    handleSearch: (params?: Partial<SearchParams>) => Promise<void>;
    handleRefresh: () => Promise<void>;
    clearSearch: () => void;

    // Utility functions
    formatNumber: (num: number) => string;

    // Legacy functions (maintained for compatibility)
    getTrendingVideos: (timeframe?: string, limit?: number) => Promise<SearchVideo[]>;
    getPopularCreators: (timeframe?: string, limit?: number) => Promise<ExploreCreator[]>;
    getTrendingSounds: (timeframe?: string, limit?: number) => Promise<SearchSound[]>;
    getCategories: (limit?: number) => Promise<ExploreCategory[]>;
    getCategoryContent: (category: string, limit?: number) => Promise<SearchVideo[]>;
    getRecommendations: (limit?: number) => Promise<SearchVideo[]>;
}

interface ExploreSection {
    icon: string;
    title: string;
    data: any[];
    type: 'videos' | 'creators' | 'sounds' | 'categories';
    showAll?: boolean;
}

interface LoadMoreState {
    inProgress: boolean;
    lastAttempt: number;
    lastSuccessfulQuery: string | null;
    retryCount: number;
    throttleUntil: number;
}

export const useExplore = (options: UseExploreOptions = {}): UseExploreReturn => {
    const {
        initialQuery = '',
        debounceDelay = 300,
        suggestionsLimit = 5,
        contentLimit = 20,
        enableMixedFeed = true,
        loadMoreThreshold = 200,
        minLoadInterval = 1000, // 1 second minimum between loads
    } = options;

    // State management
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

    // Mixed feed state
    const [mixedFeed, setMixedFeed] = useState<MixedFeedItem[]>([]);
    const [mixedFeedLoading, setMixedFeedLoading] = useState(false);
    const [mixedFeedHasMore, setMixedFeedHasMore] = useState(true);
    const [mixedFeedOffset, setMixedFeedOffset] = useState(0);

    // Legacy explore state
    const [exploreData, setExploreData] = useState<ExploreSection[]>([]);
    const [exploreLoading, setExploreLoading] = useState(false);

    // Common state
    const [refreshing, setRefreshing] = useState(false);

    // Load more management state (similar to useVideoFeed)
    const loadMoreState = useRef<LoadMoreState>({
        inProgress: false,
        lastAttempt: 0,
        lastSuccessfulQuery: null,
        retryCount: 0,
        throttleUntil: 0
    });

    // Refs for cleanup and debouncing
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestionsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSearchRef = useRef<string | null>(null);
    const lastSearchQuery = useRef<string>('');
    const isMounted = useRef(true);

    // Cache to prevent duplicate requests
    const requestCache = useRef<Map<string, { data: any, timestamp: number }>>(new Map());
    // Cache TTL - 30 seconds
    const CACHE_TTL = 30000;

    useEffect(() => {
        return () => {
            isMounted.current = false;
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
            if (suggestionsTimeout.current) {
                clearTimeout(suggestionsTimeout.current);
            }
        };
    }, []);

    // Debounced logging to prevent spam
    const debouncedLog = useCallback((message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[useExplore] ${message}`, data || '');
        }
    }, []);

    // Utility function
    const formatNumber = useCallback((num: number): string => {
        return SearchService.formatNumber(num);
    }, []);

    // Enhanced load more with request management
    const loadMixedFeed = useCallback(async (refresh = false) => {
        const now = Date.now();
        const state = loadMoreState.current;

        // Skip if not mounted
        if (!isMounted.current) return;

        // Check if we're already loading or throttled
        if (!refresh && state.inProgress) {
            debouncedLog("Load more already in progress, skipping");
            return;
        }

        if (!refresh && now < state.throttleUntil) {
            debouncedLog(`Load throttled for ${state.throttleUntil - now}ms`);
            return;
        }

        // Check minimum interval since last attempt (unless refreshing)
        if (!refresh && now - state.lastAttempt < minLoadInterval) {
            debouncedLog(`Too soon since last attempt: ${now - state.lastAttempt}ms < ${minLoadInterval}ms`);
            return;
        }

        try {
            if (refresh) {
                setRefreshing(true);
                setMixedFeedOffset(0);
            } else {
                // Set loading state to prevent duplicate requests
                state.inProgress = true;
                state.lastAttempt = now;
                setMixedFeedLoading(true);
            }

            const currentOffset = refresh ? 0 : mixedFeedOffset;
            const currentQuery = searchQuery;

            // Create cache key
            const cacheKey = `${currentQuery}:${currentOffset}:${contentLimit}`;

            // Check cache first
            const cachedResult = requestCache.current.get(cacheKey);
            if (cachedResult && now - cachedResult.timestamp < CACHE_TTL) {
                debouncedLog(`Using cached result for ${cacheKey}`);

                if (refresh || currentOffset === 0) {
                    setMixedFeed(cachedResult.data.feed);
                } else {
                    setMixedFeed(prev => [...prev, ...cachedResult.data.feed]);
                }

                setMixedFeedHasMore(cachedResult.data.pagination.hasMore);
                setMixedFeedOffset(currentOffset + cachedResult.data.feed.length);
                return;
            }

            let response: MixedFeedResponse;

            if (currentQuery.length >= 2) {
                // Search mode
                response = await SearchService.searchMixed(currentQuery, {
                    limit: contentLimit,
                    offset: currentOffset,
                });
            } else {
                // Default explore mode
                response = await SearchService.getMixedFeed({
                    limit: contentLimit,
                    offset: currentOffset,
                });
            }

            // Cache the result
            requestCache.current.set(cacheKey, {
                data: response,
                timestamp: now
            });

            if (isMounted.current) {
                // Only update if the query hasn't changed during request
                if (currentQuery === searchQuery) {
                    if (refresh || currentOffset === 0) {
                        setMixedFeed(response.feed);
                    } else {
                        setMixedFeed(prev => [...prev, ...response.feed]);
                    }

                    setMixedFeedHasMore(response.pagination.hasMore);
                    setMixedFeedOffset(currentOffset + response.feed.length);

                    // Update load more state
                    state.lastSuccessfulQuery = currentQuery;
                    state.retryCount = 0;
                    state.throttleUntil = 0;
                }
            }
        } catch (error) {
            console.error('Failed to load mixed feed:', error);

            if (isMounted.current) {
                state.retryCount++;

                // Exponential backoff for retries
                if (state.retryCount > 3) {
                    state.throttleUntil = now + (minLoadInterval * 2);
                    state.retryCount = 0;
                }

                setMixedFeedHasMore(false);
            }
        } finally {
            if (isMounted.current) {
                state.inProgress = false;
                setMixedFeedLoading(false);
                setRefreshing(false);
            }
        }
    }, [searchQuery, mixedFeedOffset, contentLimit, minLoadInterval, debouncedLog]);

    // Load legacy explore content
    const loadExploreContent = useCallback(async () => {
        if (!isMounted.current || enableMixedFeed) return;

        try {
            setExploreLoading(true);
            const feedData = await SearchService.getExploreFeed(contentLimit, 0);

            const sections: ExploreSection[] = [
                {
                    icon: 'trending',
                    title: 'Trending Videos',
                    data: feedData.trending,
                    type: 'videos',
                    showAll: true,
                },
                {
                    icon: 'popular-creators',
                    title: 'Popular Creators',
                    data: feedData.creators,
                    type: 'creators',
                    showAll: true,
                },
                {
                    icon: 'trending-sounds',
                    title: 'Trending Sounds',
                    data: feedData.sounds,
                    type: 'sounds',
                    showAll: true,
                },
                {
                    icon: 'categories',
                    title: 'Categories',
                    data: feedData.categories,
                    type: 'categories',
                    showAll: true,
                },
            ];

            if (isMounted.current) {
                setExploreData(sections);
            }
        } catch (error) {
            console.error('Failed to load explore content:', error);
            if (isMounted.current) {
                setExploreData([]);
            }
        } finally {
            if (isMounted.current) {
                setExploreLoading(false);
            }
        }
    }, [contentLimit, enableMixedFeed]);

    // Search functionality with improved debouncing
    const performSearch = useCallback(async (query: string, params: Partial<SearchParams> = {}) => {
        if (query.length < 2) {
            setSearchResults(null);
            return;
        }

        setSearchLoading(true);
        lastSearchQuery.current = query;

        try {
            const results = await SearchService.search({
                q: query,
                limit: contentLimit,
                sort: 'popular',
                ...params,
            });

            if (isMounted.current && lastSearchQuery.current === query) {
                setSearchResults(results);
            }
        } catch (error) {
            console.error('Search failed:', error);
            if (isMounted.current) {
                setSearchResults(null);
            }
        } finally {
            if (isMounted.current) {
                setSearchLoading(false);
            }
        }
    }, [contentLimit]);

    // Enhanced debounce handler for search
    const handleSearch = useCallback(async (params: Partial<SearchParams> = {}) => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Store the current query to check if it changed during the timeout
        const currentQuery = searchQuery;
        pendingSearchRef.current = currentQuery;

        searchTimeout.current = setTimeout(() => {
            // Only proceed if this is still the latest query
            if (pendingSearchRef.current === currentQuery && isMounted.current) {
                if (enableMixedFeed) {
                    // For mixed feed, trigger reload instead of separate search
                    setMixedFeedOffset(0);
                    loadMixedFeed(true);
                } else {
                    // Legacy search
                    performSearch(currentQuery, params);
                }
                // Clear the pending flag
                pendingSearchRef.current = null;
            }
        }, debounceDelay);
    }, [searchQuery, performSearch, enableMixedFeed, loadMixedFeed, debounceDelay]);

    // Load search suggestions
    const loadSearchSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchSuggestions([]);
            return;
        }

        try {
            const suggestions = await SearchService.getSearchSuggestions(query, suggestionsLimit);
            if (isMounted.current) {
                setSearchSuggestions(suggestions);
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error);
            if (isMounted.current) {
                setSearchSuggestions([]);
            }
        }
    }, [suggestionsLimit]);

    // Handle search suggestions with debouncing
    const handleSearchSuggestions = useCallback((query: string) => {
        if (suggestionsTimeout.current) {
            clearTimeout(suggestionsTimeout.current);
        }

        suggestionsTimeout.current = setTimeout(() => {
            if (isMounted.current) {
                loadSearchSuggestions(query);
            }
        }, 200); // Faster debounce for suggestions
    }, [loadSearchSuggestions]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchResults(null);
        setSearchSuggestions([]);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        if (suggestionsTimeout.current) {
            clearTimeout(suggestionsTimeout.current);
        }

        // Reset mixed feed to default content
        if (enableMixedFeed) {
            setMixedFeedOffset(0);
            loadMixedFeed(true);
        }
    }, [enableMixedFeed, loadMixedFeed]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        if (enableMixedFeed) {
            await loadMixedFeed(true);
        } else {
            setRefreshing(true);
            await loadExploreContent();
            setRefreshing(false);
        }
    }, [enableMixedFeed, loadMixedFeed, loadExploreContent]);

    // Legacy functions (maintained for backward compatibility)
    const getTrendingVideos = useCallback(async (timeframe = 'week', limit = contentLimit): Promise<SearchVideo[]> => {
        try {
            return await SearchService.getTrendingVideos(timeframe as any, limit, 0);
        } catch (error) {
            console.error('Failed to get trending videos:', error);
            return [];
        }
    }, [contentLimit]);

    const getPopularCreators = useCallback(async (timeframe = 'week', limit = contentLimit): Promise<ExploreCreator[]> => {
        try {
            return await SearchService.getPopularCreators(timeframe as any, limit, 0);
        } catch (error) {
            console.error('Failed to get popular creators:', error);
            return [];
        }
    }, [contentLimit]);

    const getTrendingSounds = useCallback(async (timeframe = 'week', limit = contentLimit): Promise<SearchSound[]> => {
        try {
            return await SearchService.getTrendingSounds(timeframe as any, limit, 0);
        } catch (error) {
            console.error('Failed to get trending sounds:', error);
            return [];
        }
    }, [contentLimit]);

    const getCategories = useCallback(async (limit = contentLimit): Promise<ExploreCategory[]> => {
        try {
            return await SearchService.getCategories(limit, 0);
        } catch (error) {
            console.error('Failed to get categories:', error);
            return [];
        }
    }, [contentLimit]);

    const getCategoryContent = useCallback(async (category: string, limit = contentLimit): Promise<SearchVideo[]> => {
        try {
            return await SearchService.getCategoryContent(category, limit, 0);
        } catch (error) {
            console.error('Failed to get category content:', error);
            return [];
        }
    }, [contentLimit]);

    const getRecommendations = useCallback(async (limit = contentLimit): Promise<SearchVideo[]> => {
        try {
            return await SearchService.getRecommendations(limit, 0);
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            return [];
        }
    }, [contentLimit]);

    // Effects for search query changes with proper cleanup
    useEffect(() => {
        // Clear previous timeouts
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
            searchTimeout.current = null;
        }

        if (suggestionsTimeout.current) {
            clearTimeout(suggestionsTimeout.current);
            suggestionsTimeout.current = null;
        }

        if (searchQuery.length >= 2) {
            // Only get suggestions immediately, but debounce the actual search
            handleSearchSuggestions(searchQuery);

            // Don't trigger search on every keystroke
            // Instead, use the debounced handleSearch
            if (enableMixedFeed) {
                handleSearch();
            }
        } else {
            setSearchSuggestions([]);
            if (enableMixedFeed && searchQuery.length === 0) {
                // Only clear if completely empty
                clearSearch();
            }
        }
    }, [searchQuery, handleSearchSuggestions, handleSearch, enableMixedFeed, clearSearch]);

    // Initial load
    useEffect(() => {
        if (enableMixedFeed) {
            loadMixedFeed(true);
        } else {
            loadExploreContent();
        }
    }, [enableMixedFeed, loadMixedFeed, loadExploreContent]);

    // Clean up request cache to prevent memory leaks
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            requestCache.current.forEach((value, key) => {
                if (now - value.timestamp > CACHE_TTL) {
                    requestCache.current.delete(key);
                }
            });
        }, 60000); // Clean up every minute

        return () => clearInterval(interval);
    }, []);

    // Computed values
    const isSearchActive = searchQuery.length >= 2;
    const hasSearchResults = searchResults !== null && (
        searchResults.users.length > 0 ||
        searchResults.videos.length > 0 ||
        searchResults.sounds.length > 0
    );
    const hasSuggestions = isSearchActive && searchSuggestions.length > 0;

    return {
        // Mixed feed
        mixedFeed,
        mixedFeedLoading,
        mixedFeedHasMore,
        loadMixedFeed,

        // Search functionality
        searchQuery,
        setSearchQuery,
        searchResults,
        searchLoading,
        isSearchActive,
        hasSearchResults,

        // Search suggestions
        searchSuggestions,
        hasSuggestions,

        // Legacy explore data
        exploreData,
        exploreLoading,

        // Common functionality
        refreshing,
        handleSearch,
        handleRefresh,
        clearSearch,

        // Utility functions
        formatNumber,

        // Legacy functions
        getTrendingVideos,
        getPopularCreators,
        getTrendingSounds,
        getCategories,
        getCategoryContent,
        getRecommendations,
    };
};

export default useExplore;