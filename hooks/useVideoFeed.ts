import { useState, useEffect, useCallback, useRef } from 'react';
import VideoService from '@/lib/api/videoService';
import { adaptVideosForUI, adaptVideoForUI } from '@/lib/adapters/videoAdapter';
import { ApiVideo } from '@/lib/api/types/video';
import { VideoItemData } from '@/components/VideoFeed/VideoItem';
import { isDemoMode } from '@/lib/release/releaseConfig';
import { mockVideos, mockApiVideos } from '@/data/mockVideos';

export type FeedType = 'forYou' | 'following' | 'subscribed';

interface UseVideoFeedOptions {
    initialFeedType?: FeedType;
    pageSize?: number;
    initialVideos?: VideoItemData[];
    preloadCount?: number;
    initialVideoId?: string;
    loadMoreThreshold?: number; // How many items from end to trigger load more
    minLoadInterval?: number; // Minimum time between load requests (ms)
    maxRetries?: number; // Max retries for failed requests
}

interface LoadMoreState {
    inProgress: boolean;
    lastAttempt: number;
    lastSuccessfulCursor: string | null;
    retryCount: number;
    throttleUntil: number;
}

/**
 * Enhanced hook for managing video feed with improved auto load more
 */
export default function useVideoFeed(options: UseVideoFeedOptions = {}) {
    const {
        initialFeedType = 'forYou',
        pageSize = 10,
        initialVideos = [],
        preloadCount = 2,
        initialVideoId,
        loadMoreThreshold = 2, // Trigger when 2 items from end
        minLoadInterval = 3000, // 3 seconds minimum between loads
        maxRetries = 3
    } = options;

    // Core state
    const [feedType, setFeedType] = useState<FeedType>(initialFeedType);
    const [videos, setVideos] = useState<VideoItemData[]>(initialVideos);
    const [apiVideos, setApiVideos] = useState<ApiVideo[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const demoMode = isDemoMode();

    // Load more management state
    const loadMoreState = useRef<LoadMoreState>({
        inProgress: false,
        lastAttempt: 0,
        lastSuccessfulCursor: null,
        retryCount: 0,
        throttleUntil: 0
    });

    // Control flags
    const isMounted = useRef(true);
    const initialVideoHandled = useRef(false);
    const feedSwitchInProgress = useRef(false);

    // Performance tracking
    const performanceMetrics = useRef({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastRequestTime: 0
    });

    // Cache management
    const feedCache = useRef<Record<FeedType, {
        videos: ApiVideo[];
        nextCursor: string | null;
        lastFetched: number;
        isComplete: boolean; // Track if feed has no more items
    }>>({
        forYou: { videos: [], nextCursor: null, lastFetched: 0, isComplete: false },
        following: { videos: [], nextCursor: null, lastFetched: 0, isComplete: false },
        subscribed: { videos: [], nextCursor: null, lastFetched: 0, isComplete: false }
    });

    // Debounced logging to prevent spam
    const debouncedLog = useRef<(message: string, data?: any) => void>(() => {});
    useEffect(() => {
        let logTimer: ReturnType<typeof setTimeout> | null = null;
        const logQueue: Array<{message: string, data?: any, timestamp: number}> = [];

        debouncedLog.current = (message: string, data?: any) => {
            logQueue.push({ message, data, timestamp: Date.now() });

            if (logTimer) clearTimeout(logTimer);

            logTimer = setTimeout(() => {
                if (logQueue.length > 0) {
                    const recent = logQueue.slice(-5); // Only show last 5 logs
                    recent.forEach(({ message, data }) => {
                        console.log(`📱 [VideoFeed] ${message}`, data || '');
                    });
                    logQueue.length = 0;
                }
            }, 500);
        };

        return () => {
            if (logTimer) clearTimeout(logTimer);
        };
    }, []);

    useEffect(() => {
        if (!demoMode) return;
        setApiVideos(mockApiVideos);
        setVideos(mockVideos);
        setNextCursor(null);
        setHasMore(false);
        setError(null);
        setLoading(false);
        setRefreshing(false);
    }, [demoMode]);

    // Enhanced load more detection
    const shouldTriggerLoadMore = useCallback((currentIndex: number, totalVideos: number): boolean => {
        const now = Date.now();
        const state = loadMoreState.current;

        // Basic checks
        if (!hasMore || loading || refreshing || feedSwitchInProgress.current) {
            return false;
        }

        // Check if we're close enough to the end
        const isNearEnd = currentIndex >= totalVideos - loadMoreThreshold;
        if (!isNearEnd) {
            return false;
        }

        // Check if already in progress
        if (state.inProgress) {
            return false;
        }

        // Check throttling
        if (now < state.throttleUntil) {
            debouncedLog.current?.(`Load more throttled for ${state.throttleUntil - now}ms`);
            return false;
        }

        // Check minimum interval since last attempt
        if (now - state.lastAttempt < minLoadInterval) {
            debouncedLog.current?.(`Load more too soon: ${now - state.lastAttempt}ms < ${minLoadInterval}ms`);
            return false;
        }

        // Check if cursor has changed (avoid duplicate requests)
        if (nextCursor === state.lastSuccessfulCursor && state.retryCount === 0) {
            debouncedLog.current?.(`Same cursor as last successful load: ${nextCursor}`);
            return false;
        }

        return true;
    }, [hasMore, loading, refreshing, nextCursor, loadMoreThreshold, minLoadInterval]);

    // Enhanced fetch function with better error handling and metrics
    const fetchVideos = useCallback(async (
        type: FeedType,
        cursor: string | null = null,
        refresh = false
    ): Promise<{videos: VideoItemData[], nextCursor: string | null} | null> => {
        //if (!isMounted.current) return null;
        if (demoMode) {
            setApiVideos(mockApiVideos);
            setVideos(mockVideos);
            setNextCursor(null);
            setHasMore(false);
            setError(null);
            return { videos: mockVideos, nextCursor: null };
        }

        const startTime = Date.now();
        const metrics = performanceMetrics.current;
        metrics.totalRequests++;
        metrics.lastRequestTime = startTime;

        try {
            setError(null);

            let response;
            debouncedLog.current?.(`Fetching ${type} feed (cursor: ${cursor}, refresh: ${refresh})`);

            switch (type) {
                case 'forYou':
                    response = await VideoService.getForYouFeed(cursor || undefined, pageSize);
                    break;
                case 'following':
                    response = await VideoService.getFollowingFeed(cursor || undefined, pageSize);
                    break;
                case 'subscribed':
                    response = await VideoService.getSubscribedFeed(cursor || undefined, pageSize);
                    break;
                default:
                    response = await VideoService.getForYouFeed(cursor || undefined, pageSize);
            }

            //if (!isMounted.current) return null;

            const newApiVideos = response.videos;
            const transformedVideos = adaptVideosForUI(newApiVideos);
            const newNextCursor = response.pagination.nextCursor;
            const isComplete = !newNextCursor || newApiVideos.length === 0;

            // Update metrics
            const responseTime = Date.now() - startTime;
            metrics.successfulRequests++;
            metrics.averageResponseTime =
                (metrics.averageResponseTime * (metrics.successfulRequests - 1) + responseTime) / metrics.successfulRequests;

            debouncedLog.current?.(`Fetch success: ${newApiVideos.length} videos, nextCursor: ${newNextCursor}, took: ${responseTime}ms`);

            // Update state
            if (refresh) {
                setApiVideos(newApiVideos);
                setVideos(transformedVideos);
            } else {
                setApiVideos(prev => [...prev, ...newApiVideos]);
                setVideos(prev => [...prev, ...transformedVideos]);
            }

            setNextCursor(newNextCursor);
            setHasMore(!isComplete);

            // Update cache
            const cacheEntry = feedCache.current[type];
            feedCache.current[type] = {
                videos: refresh ? newApiVideos : [...(cacheEntry.videos || []), ...newApiVideos],
                nextCursor: newNextCursor,
                lastFetched: Date.now(),
                isComplete
            };

            return { videos: transformedVideos, nextCursor: newNextCursor };

        } catch (err: any) {
            metrics.failedRequests++;
            const responseTime = Date.now() - startTime;

            debouncedLog.current?.(`Fetch failed: ${err.message}, took: ${responseTime}ms`);

            if (isMounted.current) {
                setError(err.message || `Failed to load ${type} feed`);

                // Use cached data as fallback for refresh
                if (refresh && videos.length === 0) {
                    const cachedData = feedCache.current[type];
                    if (cachedData?.videos?.length > 0) {
                        debouncedLog.current?.(`Using cached ${type} feed data`);
                        const transformedVideos = adaptVideosForUI(cachedData.videos);
                        setApiVideos(cachedData.videos);
                        setVideos(transformedVideos);
                        setNextCursor(cachedData.nextCursor);
                        setHasMore(!cachedData.isComplete);
                    } else {
                        setApiVideos(mockApiVideos);
                        setVideos(mockVideos);
                        setNextCursor(null);
                        setHasMore(false);
                        setError(null);
                    }
                }
            }

            return null;
        }
    }, [demoMode, pageSize, videos.length]);

    // Enhanced load more with comprehensive state management
    const loadMore = useCallback(async (): Promise<boolean> => {
        const now = Date.now();
        const state = loadMoreState.current;

        // Pre-flight checks
        if (!shouldTriggerLoadMore(focusedIndex, videos.length)) {
            return false;
        }

        // Update state to prevent concurrent calls
        state.inProgress = true;
        state.lastAttempt = now;
        setLoading(true);

        debouncedLog.current?.(`🚀 Starting load more (cursor: ${nextCursor}, retry: ${state.retryCount})`);

        try {
            const result = await fetchVideos(feedType, nextCursor, false);

            if (result) {
                // Success - reset retry count and update state
                state.retryCount = 0;
                state.lastSuccessfulCursor = nextCursor;
                state.throttleUntil = 0; // Clear any throttling

                debouncedLog.current?.(`✅ Load more successful: ${result.videos.length} new videos`);
                return true;
            } else {
                throw new Error('No data returned');
            }

        } catch (error: any) {
            state.retryCount++;

            debouncedLog.current?.(`❌ Load more failed (attempt ${state.retryCount}): ${error.message}`);

            if (state.retryCount >= maxRetries) {
                // Max retries reached - throttle future attempts
                state.throttleUntil = now + (minLoadInterval * 2);
                state.retryCount = 0; // Reset for future attempts

                debouncedLog.current?.(`🚫 Max retries reached, throttling until ${new Date(state.throttleUntil).toLocaleTimeString()}`);
            } else {
                // Exponential backoff for retries
                const backoffDelay = Math.min(1000 * Math.pow(2, state.retryCount), 10000);
                state.throttleUntil = now + backoffDelay;

                debouncedLog.current?.(`⏰ Retry backoff: ${backoffDelay}ms`);
            }

            return false;
        } finally {
            state.inProgress = false;
            setLoading(false);
        }
    }, [shouldTriggerLoadMore, focusedIndex, videos.length, fetchVideos, feedType, nextCursor, maxRetries, minLoadInterval]);

    // Auto load more effect with improved logic
    useEffect(() => {
        if (shouldTriggerLoadMore(focusedIndex, videos.length)) {
            debouncedLog.current?.(`🎯 Auto load more triggered (index: ${focusedIndex}/${videos.length})`);

            // Use setTimeout to avoid calling during render
            const timeoutId = setTimeout(() => {
                loadMore().then(success => {
                    if (!success) {
                        debouncedLog.current?.(`⚠️ Auto load more failed or skipped`);
                    }
                });
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [focusedIndex, videos.length, shouldTriggerLoadMore, loadMore]);

    // Load specific video by ID
    const loadSpecificVideo = useCallback(async (videoId: string): Promise<VideoItemData | null> => {
        try {
            setError(null);
            debouncedLog.current?.(`🎬 Loading specific video: ${videoId}`);

            const existingVideo = videos.find(v => v.id === videoId);
            if (existingVideo) {
                debouncedLog.current?.(`✅ Video found in current feed`);
                return existingVideo;
            }

            if (demoMode) {
                const demoVideo = mockVideos.find(v => v.id === videoId);
                if (demoVideo) {
                    return demoVideo;
                }
            }

            const response = await VideoService.getVideo(videoId);
            const adaptedVideo = adaptVideoForUI(response.video);

            debouncedLog.current?.(`✅ Video loaded from API`);
            return adaptedVideo;
        } catch (err: any) {
            debouncedLog.current?.(`❌ Error loading specific video: ${err.message}`);
            setError('Failed to load video');
            return null;
        }
    }, [demoMode, videos]);

    // Jump to specific video
    const jumpToVideo = useCallback(async (video: VideoItemData): Promise<void> => {
        try {
            setError(null);
            debouncedLog.current?.(`🎯 Jumping to video: ${video.id}`);

            const existingIndex = videos.findIndex(v => v.id === video.id);

            if (existingIndex !== -1) {
                setFocusedIndex(existingIndex);
            } else {
                setVideos(prev => [video, ...prev]);
                setFocusedIndex(0);
            }
        } catch (err: any) {
            debouncedLog.current?.(`❌ Error jumping to video: ${err.message}`);
            setError('Failed to jump to video');
        }
    }, [videos]);

    // Refresh with enhanced state management
    const refresh = useCallback(async () => {
        if (loading || refreshing || feedSwitchInProgress.current) return;

        debouncedLog.current?.(`🔄 Refreshing ${feedType} feed`);

        setRefreshing(true);

        // Reset load more state
        loadMoreState.current = {
            inProgress: false,
            lastAttempt: 0,
            lastSuccessfulCursor: null,
            retryCount: 0,
            throttleUntil: 0
        };

        try {
            await fetchVideos(feedType, null, true);
            setFocusedIndex(0);
            debouncedLog.current?.(`✅ Refresh completed`);
        } catch (error) {
            debouncedLog.current?.(`❌ Refresh failed`);
        } finally {
            setRefreshing(false);
        }
    }, [loading, refreshing, fetchVideos, feedType]);

    // Change feed type with proper cleanup
    const changeFeedType = useCallback((newFeedType: FeedType) => {
        if (newFeedType === feedType || feedSwitchInProgress.current) return;

        debouncedLog.current?.(`🔄 Changing feed type: ${feedType} → ${newFeedType}`);

        feedSwitchInProgress.current = true;
        setFeedType(newFeedType);
        setLoading(true);
        initialVideoHandled.current = false;

        // Reset load more state for new feed
        loadMoreState.current = {
            inProgress: false,
            lastAttempt: 0,
            lastSuccessfulCursor: null,
            retryCount: 0,
            throttleUntil: 0
        };

        // Check cache
        const cachedData = feedCache.current[newFeedType];
        const isCacheValid = cachedData &&
            cachedData.videos.length > 0 &&
            (Date.now() - cachedData.lastFetched < 5 * 60 * 1000) &&
            !cachedData.isComplete;

        if (isCacheValid) {
            debouncedLog.current?.(`📦 Using cached ${newFeedType} feed`);
            const transformedVideos = adaptVideosForUI(cachedData.videos);
            setApiVideos(cachedData.videos);
            setVideos(transformedVideos);
            setNextCursor(cachedData.nextCursor);
            setHasMore(!cachedData.isComplete);
            setFocusedIndex(0);
            setLoading(false);
            feedSwitchInProgress.current = false;

            // Background refresh
            setTimeout(() => {
                fetchVideos(newFeedType, null, true).finally(() => {
                    feedSwitchInProgress.current = false;
                });
            }, 100);
        } else {
            // Clear and load fresh
            setVideos([]);
            setApiVideos([]);
            setNextCursor(null);
            setHasMore(true);
            setFocusedIndex(0);

            fetchVideos(newFeedType, null, true).finally(() => {
                setLoading(false);
                feedSwitchInProgress.current = false;
            });
        }
    }, [feedType, fetchVideos]);

    // Enhanced initial load
    useEffect(() => {
        if (initialVideoHandled.current || feedSwitchInProgress.current) return;

        const initializeFeed = async () => {
            setLoading(true);
            initialVideoHandled.current = true;

            try {
                if (initialVideoId) {
                    debouncedLog.current?.(`🎬 Loading initial video: ${initialVideoId}`);

                    const specificVideo = await loadSpecificVideo(initialVideoId);
                    if (specificVideo) {
                        setVideos([specificVideo]);
                        setFocusedIndex(0);

                        // Load additional videos
                        await fetchVideos(feedType, null, false);
                        return;
                    }
                }

                // Normal feed load
                await fetchVideos(feedType, null, true);
            } catch (err) {
                debouncedLog.current?.(`❌ Error initializing feed: ${err}`);
                setError('Failed to load videos. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        initializeFeed();

        return () => {
            isMounted.current = false;
        };
    }, [initialVideoId, feedType, fetchVideos, loadSpecificVideo]);

    // Update video helper
    const updateVideo = useCallback((videoId: string, updates: Partial<VideoItemData>) => {
        setVideos(currentVideos =>
            currentVideos.map(video =>
                video.id === videoId ? { ...video, ...updates } : video
            )
        );
    }, []);

    // Clear cache and reset
    const clearCache = useCallback(() => {
        feedCache.current = {
            forYou: { videos: [], nextCursor: null, lastFetched: 0, isComplete: false },
            following: { videos: [], nextCursor: null, lastFetched: 0, isComplete: false },
            subscribed: { videos: [], nextCursor: null, lastFetched: 0, isComplete: false }
        };

        loadMoreState.current = {
            inProgress: false,
            lastAttempt: 0,
            lastSuccessfulCursor: null,
            retryCount: 0,
            throttleUntil: 0
        };

        performanceMetrics.current = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            lastRequestTime: 0
        };
    }, []);

    // Get performance stats
    const getPerformanceStats = useCallback(() => {
        return { ...performanceMetrics.current };
    }, []);

    // Get load more state for debugging
    const getLoadMoreState = useCallback(() => {
        return { ...loadMoreState.current };
    }, []);

    return {
        // Core state
        videos,
        apiVideos,
        loading,
        refreshing,
        error,
        hasMore,
        feedType,
        focusedIndex,

        // Actions
        setFocusedIndex,
        loadMore,
        refresh,
        changeFeedType,
        updateVideo,
        loadSpecificVideo,
        jumpToVideo,
        clearCache,

        // Helpers
        getVideoById: useCallback((videoId: string) =>
            videos.find(video => video.id === videoId), [videos]),

        // Debug helpers
        getPerformanceStats,
        getLoadMoreState,

        // Enhanced state
        canLoadMore: !loadMoreState.current.inProgress && hasMore && !loading && !refreshing,
        isNearEnd: focusedIndex >= videos.length - loadMoreThreshold,
    };
}
