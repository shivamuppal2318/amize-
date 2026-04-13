import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoItemData } from '@/components/VideoFeed/VideoItem';
import { ApiVideo } from '@/lib/api/types/video';
import { adaptVideoForUI } from '@/lib/adapters/videoAdapter';
import VideoService from '@/lib/api/videoService';

// Configuration constants
const MAX_CACHE_SIZE = 50;
const MAX_RECENTLY_VIEWED = 30;
const MAX_PRELOADED_VIDEOS = 5;
const CACHE_SIZE_LIMIT = 500 * 1024 * 1024; // 500MB
const PRELOAD_AHEAD_COUNT = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEBOUNCE_DELAY = 300;

// Storage keys
const CACHE_STORAGE_KEY = 'video_cache_v2';
const RECENTLY_VIEWED_KEY = 'recently_viewed_v2';
const CACHE_METADATA_KEY = 'cache_metadata_v2';

// Types
interface PreloadProgress {
    videoId: string;
    progress: number;
    status: 'downloading' | 'completed' | 'failed' | 'paused';
    error?: string;
}

interface CacheMetadata {
    totalSize: number;
    videoCount: number;
    lastCleanup: number;
}

interface VideoCacheItem {
    video: VideoItemData;
    timestamp: number;
    localPath?: string;
    isPreloaded: boolean;
    fileSize: number;
    downloadAttempts: number;
    lastAccessTime: number;
}

interface NetworkInfo {
    isConnected: boolean;
    type: string;
    isWifi: boolean;
    isMetered: boolean;
}

interface VideoContextValue {
    // Cache state
    cachedVideos: Record<string, VideoItemData>;
    recentlyViewed: string[];
    preloadProgress: Record<string, PreloadProgress>;
    cacheSize: number;
    isPreloading: boolean;
    networkInfo: NetworkInfo;

    // Cache operations
    addToCache: (video: ApiVideo | VideoItemData) => void;
    removeFromCache: (videoId: string) => Promise<void>;
    clearCache: () => Promise<void>;
    clearOldCache: () => Promise<void>;

    // Video operations
    getVideo: (videoId: string) => Promise<VideoItemData | null>;
    getLocalVideoPath: (videoId: string) => string | null;
    isVideoPreloaded: (videoId: string) => boolean;

    // Enhanced preloading
    preloadVideo: (videoId: string, priority?: 'high' | 'medium' | 'low') => void;
    preloadVideosInRange: (videos: VideoItemData[], currentIndex: number) => void;
    pausePreloading: () => void;
    resumePreloading: () => void;
    cancelPreload: (videoId: string) => void;
    getPreloadStatus: (videoId: string) => PreloadProgress | null;

    // Recently viewed
    addToRecentlyViewed: (videoId: string) => void;
    clearRecentlyViewed: () => void;

    // Utility
    getCacheInfo: () => Promise<CacheMetadata>;
    optimizeCache: () => Promise<void>;
}

const VideoContext = createContext<VideoContextValue | undefined>(undefined);

export const VideoProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    // State
    const [cachedVideos, setCachedVideos] = useState<Record<string, VideoItemData>>({});
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
    const [preloadProgress, setPreloadProgress] = useState<Record<string, PreloadProgress>>({});
    const [cacheSize, setCacheSize] = useState<number>(0);
    const [isPreloading, setIsPreloading] = useState<boolean>(false);
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
        isConnected: true,
        type: 'unknown',
        isWifi: false,
        isMetered: true
    });

    // Refs for non-reactive state
    const cacheDetails = useRef<Record<string, VideoCacheItem>>({});
    const downloadQueue = useRef<string[]>([]);
    const activeDownloads = useRef<Set<string>>(new Set());
    const preloadingPaused = useRef<boolean>(false);
    const retryTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const preloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialized = useRef<boolean>(false);
    const operationQueue = useRef<Array<() => Promise<void>>>([]);
    const processingQueue = useRef<boolean>(false);

    // Cache directory
    const cacheDirectory = `${(FileSystem as any).documentDirectory ?? ""}videocache/`;

    // Static logging function to avoid recreation
    const log = useRef((message: string, ...args: any[]) => {
        console.log(`🎯 [VideoContext] ${message}`, ...args);
    }).current;

    // Debounced persist function with stable reference
    const debouncedPersist = useRef<() => void>(() => {});

    // Initialize debounced persist function
    useEffect(() => {
        debouncedPersist.current = () => {
            if (persistTimer.current) {
                clearTimeout(persistTimer.current);
            }
            persistTimer.current = setTimeout(async () => {
                try {
                    await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheDetails.current));
                    const metadata: CacheMetadata = {
                        totalSize: cacheSize,
                        videoCount: Object.keys(cachedVideos).length,
                        lastCleanup: Date.now()
                    };
                    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
                } catch (error) {
                    log(`❌ Error persisting cache:`, error);
                }
            }, DEBOUNCE_DELAY);
        };
    }, [cacheSize, cachedVideos]);

    // Queue system for async operations
    const queueOperation = useCallback(async (operation: () => Promise<void>) => {
        operationQueue.current.push(operation);

        if (!processingQueue.current) {
            processingQueue.current = true;

            while (operationQueue.current.length > 0) {
                const op = operationQueue.current.shift();
                if (op) {
                    try {
                        await op();
                    } catch (error) {
                        log(`❌ Queued operation failed:`, error);
                    }
                }
            }

            processingQueue.current = false;
        }
    }, []);

    // Initialize context
    useEffect(() => {
        if (isInitialized.current) return;

        const initializeContext = async () => {
            try {
                log(`🏗️ Initializing VideoContext`);

                // Create cache directory
                const dirInfo = await FileSystem.getInfoAsync(cacheDirectory);
                if (!dirInfo.exists) {
                    await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true });
                }

                // Load data
                await Promise.all([
                    loadCacheFromStorage(),
                    loadRecentlyViewed(),
                    setupNetworkMonitoring(),
                    cleanupOrphanedFiles()
                ]);

                isInitialized.current = true;
                log(`✅ VideoContext initialized`);
            } catch (error) {
                log(`❌ Failed to initialize:`, error);
            }
        };

        initializeContext();
    }, []);

    // Load cache from storage
    const loadCacheFromStorage = useCallback(async () => {
        try {
            const storedCache = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
            if (!storedCache) return;

            const parsedCache: Record<string, VideoCacheItem> = JSON.parse(storedCache);
            const videoCache: Record<string, VideoItemData> = {};
            let totalSize = 0;

            for (const [videoId, item] of Object.entries(parsedCache)) {
                if (item.localPath) {
                    const fileInfo = await FileSystem.getInfoAsync(item.localPath);
                    if (fileInfo.exists) {
                        videoCache[videoId] = item.video;
                        cacheDetails.current[videoId] = item;
                        totalSize += item.fileSize;
                    }
                } else {
                    videoCache[videoId] = item.video;
                    cacheDetails.current[videoId] = item;
                }
            }

            setCachedVideos(videoCache);
            setCacheSize(totalSize);
            log(`📦 Loaded ${Object.keys(videoCache).length} videos from cache`);
        } catch (error) {
            log(`❌ Error loading cache:`, error);
        }
    }, []);

    // Load recently viewed
    const loadRecentlyViewed = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
            if (stored) {
                setRecentlyViewed(JSON.parse(stored));
            }
        } catch (error) {
            log(`❌ Error loading recently viewed:`, error);
        }
    }, []);

    // Setup network monitoring
    const setupNetworkMonitoring = useCallback(() => {
        const handleNetworkChange = (state: any) => {
            const newInfo = {
                isConnected: state.isConnected,
                type: state.type || 'unknown',
                isWifi: state.type === 'wifi',
                isMetered: state.type !== 'wifi' && state.type !== 'ethernet'
            };

            setNetworkInfo(newInfo);
            preloadingPaused.current = !newInfo.isWifi;
        };

        const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
        NetInfo.fetch().then(handleNetworkChange);
        return unsubscribe;
    }, []);

    // Cleanup orphaned files
    const cleanupOrphanedFiles = useCallback(async () => {
        try {
            const dirInfo = await FileSystem.getInfoAsync(cacheDirectory);
            if (!dirInfo.exists) return;

            const files = await FileSystem.readDirectoryAsync(cacheDirectory);
            const validFiles = new Set(
                Object.values(cacheDetails.current)
                    .map(item => item.localPath?.split('/').pop())
                    .filter(Boolean)
            );

            for (const file of files) {
                if (!validFiles.has(file)) {
                    await FileSystem.deleteAsync(`${cacheDirectory}${file}`, { idempotent: true });
                }
            }
        } catch (error) {
            log(`❌ Error cleaning up files:`, error);
        }
    }, []);

    // Download video file
    const downloadVideoFile = useCallback(async (
        videoId: string,
        videoUrl: string,
        priority: 'high' | 'medium' | 'low' = 'medium'
    ): Promise<string | null> => {
        if (activeDownloads.current.has(videoId)) return null;

        activeDownloads.current.add(videoId);

        try {
            const fileName = `${videoId}.mp4`;
            const localPath = `${cacheDirectory}${fileName}`;

            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
                activeDownloads.current.delete(videoId);
                return localPath;
            }

            setPreloadProgress(prev => ({
                ...prev,
                [videoId]: { videoId, progress: 0, status: 'downloading' }
            }));

            const downloadResult = await FileSystem.createDownloadResumable(
                videoUrl,
                localPath,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    setPreloadProgress(prev => ({
                        ...prev,
                        [videoId]: {
                            videoId,
                            progress: Math.round(progress * 100),
                            status: 'downloading'
                        }
                    }));
                }
            ).downloadAsync();

            if (downloadResult?.status === 200) {
                // Fetch file info again to get the size of the downloaded file
                const downloadedFileInfo = await FileSystem.getInfoAsync(localPath);
                const fileSize = downloadResult.headers['content-length']
                    ? parseInt(downloadResult.headers['content-length'])
                    : downloadedFileInfo.exists && downloadedFileInfo.size !== undefined
                        ? downloadedFileInfo.size
                        : 0;

                if (cacheDetails.current[videoId]) {
                    cacheDetails.current[videoId].localPath = localPath;
                    cacheDetails.current[videoId].isPreloaded = true;
                    cacheDetails.current[videoId].fileSize = fileSize;
                }

                setCacheSize(prev => prev + fileSize);

                setPreloadProgress(prev => ({
                    ...prev,
                    [videoId]: { videoId, progress: 100, status: 'completed' }
                }));

                debouncedPersist.current?.();
                return localPath;
            }

            throw new Error(`Download failed with status: ${downloadResult?.status}`);
        } catch (error) {
            setPreloadProgress(prev => ({
                ...prev,
                [videoId]: {
                    videoId,
                    progress: 0,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Download failed'
                }
            }));
            return null;
        } finally {
            activeDownloads.current.delete(videoId);
        }
    }, [debouncedPersist]);

    // Add to cache (non-async to avoid loops)
    const addToCache = useCallback((video: ApiVideo | VideoItemData) => {
        queueOperation(async () => {
            const videoItem = 'videoUrl' in video ? adaptVideoForUI(video) : video;
            const timestamp = Date.now();

            setCachedVideos(prev => ({
                ...prev,
                [videoItem.id]: videoItem
            }));

            cacheDetails.current[videoItem.id] = {
                video: videoItem,
                timestamp,
                isPreloaded: false,
                fileSize: 0,
                downloadAttempts: 0,
                lastAccessTime: timestamp
            };

            debouncedPersist.current?.();
        });
    }, [queueOperation]);

    // Remove from cache
    const removeFromCache = useCallback((videoId: string) => {
        return queueOperation(async () => {
            const cacheItem = cacheDetails.current[videoId];
            if (cacheItem?.localPath) {
                await FileSystem.deleteAsync(cacheItem.localPath, { idempotent: true });
                setCacheSize(prev => prev - cacheItem.fileSize);
            }

            setCachedVideos(prev => {
                const newCache = { ...prev };
                delete newCache[videoId];
                return newCache;
            });

            delete cacheDetails.current[videoId];

            setPreloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[videoId];
                return newProgress;
            });

            activeDownloads.current.delete(videoId);
            if (retryTimers.current[videoId]) {
                clearTimeout(retryTimers.current[videoId]);
                delete retryTimers.current[videoId];
            }

            debouncedPersist.current?.();
        });
    }, [queueOperation]);

    // Clear cache
    const clearCache = useCallback(() => {
        return queueOperation(async () => {
            Object.values(retryTimers.current).forEach(timer => clearTimeout(timer));
            retryTimers.current = {};
            activeDownloads.current.clear();

            const dirInfo = await FileSystem.getInfoAsync(cacheDirectory);
            if (dirInfo.exists) {
                await FileSystem.deleteAsync(cacheDirectory, { idempotent: true });
                await FileSystem.makeDirectoryAsync(cacheDirectory, { intermediates: true });
            }

            setCachedVideos({});
            setPreloadProgress({});
            setCacheSize(0);
            cacheDetails.current = {};

            await AsyncStorage.multiRemove([CACHE_STORAGE_KEY, CACHE_METADATA_KEY]);
        });
    }, [queueOperation]);

    // Optimize cache
    const optimizeCache = useCallback(() => {
        return queueOperation(async () => {
            const items = Object.entries(cacheDetails.current);
            items.sort((a, b) => a[1].lastAccessTime - b[1].lastAccessTime);
            const itemsToRemove = items.slice(0, items.length - MAX_CACHE_SIZE + 5);

            for (const [videoId] of itemsToRemove) {
                const cacheItem = cacheDetails.current[videoId];
                if (cacheItem?.localPath) {
                    await FileSystem.deleteAsync(cacheItem.localPath, { idempotent: true });
                    setCacheSize(prev => prev - cacheItem.fileSize);
                }

                setCachedVideos(prev => {
                    const newCache = { ...prev };
                    delete newCache[videoId];
                    return newCache;
                });

                delete cacheDetails.current[videoId];
            }

            debouncedPersist.current?.();
        });
    }, [queueOperation]);

    // Clear old cache
    const clearOldCache = useCallback(() => {
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const now = Date.now();

        return queueOperation(async () => {
            for (const [videoId, item] of Object.entries(cacheDetails.current)) {
                if (now - item.lastAccessTime > maxAge) {
                    if (item.localPath) {
                        await FileSystem.deleteAsync(item.localPath, { idempotent: true });
                        setCacheSize(prev => prev - item.fileSize);
                    }

                    setCachedVideos(prev => {
                        const newCache = { ...prev };
                        delete newCache[videoId];
                        return newCache;
                    });

                    delete cacheDetails.current[videoId];
                }
            }

            debouncedPersist.current?.();
        });
    }, [queueOperation]);

    // Get video
    const getVideo = useCallback(async (videoId: string): Promise<VideoItemData | null> => {
        try {
            if (cacheDetails.current[videoId]) {
                cacheDetails.current[videoId].lastAccessTime = Date.now();
            }

            if (cachedVideos[videoId]) {
                return cachedVideos[videoId];
            }

            const response = await VideoService.getVideo(videoId);
            const video = adaptVideoForUI(response.video);
            addToCache(video);
            return video;
        } catch (error) {
            log(`❌ Error fetching video:`, error);
            return null;
        }
    }, [cachedVideos, addToCache]);

    // Get local video path
    const getLocalVideoPath = useCallback((videoId: string): string | null => {
        return cacheDetails.current[videoId]?.localPath || null;
    }, []);

    // Check if video is preloaded
    const isVideoPreloaded = useCallback((videoId: string): boolean => {
        return cacheDetails.current[videoId]?.isPreloaded || false;
    }, []);

    // Get preload status
    const getPreloadStatus = useCallback((videoId: string): PreloadProgress | null => {
        return preloadProgress[videoId] || null;
    }, [preloadProgress]);

    // Preload video (debounced)
    const preloadVideo = useCallback((
        videoId: string,
        priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
        if (preloadingPaused.current || !networkInfo.isConnected || isVideoPreloaded(videoId)) {
            return;
        }

        queueOperation(async () => {
            try {
                const video = await getVideo(videoId);
                if (video && cacheSize < CACHE_SIZE_LIMIT) {
                    setIsPreloading(true);
                    await downloadVideoFile(videoId, video.video.uri, priority);
                }
            } catch (error) {
                log(`❌ Error preloading video:`, error);
            } finally {
                setIsPreloading(false);
            }
        });
    }, [networkInfo.isConnected, isVideoPreloaded, getVideo, cacheSize, queueOperation, downloadVideoFile]);

    // Preload videos in range (debounced)
    const preloadVideosInRange = useCallback((
        videos: VideoItemData[],
        currentIndex: number
    ) => {
        if (preloadTimer.current) {
            clearTimeout(preloadTimer.current);
        }

        preloadTimer.current = setTimeout(() => {
            if (preloadingPaused.current || !networkInfo.isWifi) return;

            const startIndex = Math.max(0, currentIndex);
            const endIndex = Math.min(videos.length - 1, currentIndex + PRELOAD_AHEAD_COUNT);

            for (let i = startIndex; i <= endIndex; i++) {
                const video = videos[i];
                if (video && !isVideoPreloaded(video.id)) {
                    const priority = i === currentIndex + 1 ? 'high' : 'medium';
                    preloadVideo(video.id, priority);
                }
            }
        }, DEBOUNCE_DELAY);
    }, [networkInfo.isWifi, isVideoPreloaded, preloadVideo]);

    // Control functions
    const pausePreloading = useCallback(() => {
        preloadingPaused.current = true;
    }, []);

    const resumePreloading = useCallback(() => {
        preloadingPaused.current = false;
    }, []);

    const cancelPreload = useCallback((videoId: string) => {
        activeDownloads.current.delete(videoId);
        if (retryTimers.current[videoId]) {
            clearTimeout(retryTimers.current[videoId]);
            delete retryTimers.current[videoId];
        }
        setPreloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[videoId];
            return newProgress;
        });
    }, []);

    // Recently viewed
    const addToRecentlyViewed = useCallback((videoId: string) => {
        setRecentlyViewed(prev => {
            const filtered = prev.filter(id => id !== videoId);
            const updated = [videoId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
            AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearRecentlyViewed = useCallback(() => {
        setRecentlyViewed([]);
        AsyncStorage.removeItem(RECENTLY_VIEWED_KEY);
    }, []);

    // Get cache info
    const getCacheInfo = useCallback(async (): Promise<CacheMetadata> => {
        return {
            totalSize: cacheSize,
            videoCount: Object.keys(cachedVideos).length,
            lastCleanup: Date.now()
        };
    }, [cacheSize, cachedVideos]);

    const value: VideoContextValue = {
        cachedVideos,
        recentlyViewed,
        preloadProgress,
        cacheSize,
        isPreloading,
        networkInfo,
        addToCache,
        removeFromCache,
        clearCache,
        clearOldCache,
        getVideo,
        getLocalVideoPath,
        isVideoPreloaded,
        preloadVideo,
        preloadVideosInRange,
        pausePreloading,
        resumePreloading,
        cancelPreload,
        getPreloadStatus,
        addToRecentlyViewed,
        clearRecentlyViewed,
        getCacheInfo,
        optimizeCache
    };

    return (
        <VideoContext.Provider value={value}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideoContext = (): VideoContextValue => {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error('useVideoContext must be used within a VideoProvider');
    }
    return context;
};

export default VideoContext;
