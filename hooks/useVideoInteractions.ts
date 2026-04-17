import { useState, useCallback, useRef } from 'react';
import VideoService from '@/lib/api/videoService';
import { ApiSharePlatform } from '@/lib/api/types/video';
import { mobileEvents } from '@/lib/analytics/mobileEvents';

/**
 * Hook for interacting with videos (like, comment, share, view)
 */
export default function useVideoInteractions() {
    // State for tracking operations
    const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});
    const [viewLoading, setViewLoading] = useState<Record<string, boolean>>({});
    const [shareLoading, setShareLoading] = useState<Record<string, boolean>>({});

    // Refs for tracking video viewing
    const viewStartTimes = useRef<Record<string, number>>({});
    const lastWatchTimes = useRef<Record<string, number>>({});
    const viewUpdateInterval = useRef<Record<string, NodeJS.Timeout>>({});

    // Like a video with optimistic update
    const toggleLike = useCallback(async (videoId: string, onUpdate?: (liked: boolean, count: number) => void) => {
        // Prevent duplicate requests
        if (likeLoading[videoId]) return;

        setLikeLoading(prev => ({ ...prev, [videoId]: true }));

        try {
            console.log(`Sending like request to backend for video ${videoId}`);
            const response = await VideoService.toggleLike(videoId);
            console.log(`Like response from backend:`, response);

            // Call the onUpdate callback with the new state
            if (onUpdate) {
                onUpdate(response.liked, response.likesCount);
            }

            mobileEvents.track('video_like_toggled', {
                videoId,
                liked: response.liked,
                likesCount: response.likesCount,
            });

            return response;
        } catch (error) {
            console.error('Error toggling like:', error);
            // If there's an error, we could revert the optimistic update here
            throw error;
        } finally {
            setLikeLoading(prev => ({ ...prev, [videoId]: false }));
        }
    }, [likeLoading]);

    // Start tracking view time for a video
    const startViewTracking = useCallback((videoId: string, duration: number = 0) => {
        console.log(`Starting view tracking for video ${videoId}, duration: ${duration}s`);

        // Record the start time
        viewStartTimes.current[videoId] = Date.now();
        lastWatchTimes.current[videoId] = 0;

        // Clear any existing interval
        if (viewUpdateInterval.current[videoId]) {
            clearInterval(viewUpdateInterval.current[videoId]);
        }

        // Record initial view to increment the view counter
        // This is immediate to count the view as soon as the video starts
        try {
            console.log(`Recording initial view for video ${videoId}`);
            VideoService.getVideo(videoId, true)
                .then(response => console.log(`Initial view recorded for ${videoId}`))
                .catch(err => console.error(`Failed to record initial view for ${videoId}:`, err));
        } catch (err) {
            console.error(`Error recording initial view for ${videoId}:`, err);
        }

        // Set up an interval to periodically update the watch time
        // This helps if the user leaves the app or the component unmounts unexpectedly
        viewUpdateInterval.current[videoId] = setInterval(() => {
            const startTime = viewStartTimes.current[videoId];
            if (startTime) {
                const currentWatchTime = Math.floor((Date.now() - startTime) / 1000);
                lastWatchTimes.current[videoId] = currentWatchTime;

                // Send interim watch time updates for longer videos
                // This ensures we have partial data even if the user doesn't finish the video
                if (currentWatchTime > 10 && currentWatchTime % 30 === 0) { // Every 30 seconds
                    console.log(`Sending interim watch time update for ${videoId}: ${currentWatchTime}s`);
                    try {
                        VideoService.recordView(videoId, currentWatchTime,
                            duration > 0 ? Math.min(100, (currentWatchTime / duration) * 100) : undefined)
                            .catch(err => console.error(`Failed to record interim view update for ${videoId}:`, err));
                    } catch (err) {
                        console.error(`Error recording interim view for ${videoId}:`, err);
                    }
                }
            }
        }, 5000); // Update every 5 seconds

        return () => {
            // Cleanup function
            if (viewUpdateInterval.current[videoId]) {
                clearInterval(viewUpdateInterval.current[videoId]);
                delete viewUpdateInterval.current[videoId];
            }
        };
    }, []);

    // Stop tracking view time and record the view
    const stopViewTracking = useCallback(async (
        videoId: string,
        videoDuration: number,
        forceUpdate = false
    ) => {
        console.log(`Stopping view tracking for video ${videoId}, duration: ${videoDuration}s`);

        // Clear the update interval
        if (viewUpdateInterval.current[videoId]) {
            clearInterval(viewUpdateInterval.current[videoId]);
            delete viewUpdateInterval.current[videoId];
        }

        // Calculate watch time
        const startTime = viewStartTimes.current[videoId];
        if (!startTime && !forceUpdate) return;

        const watchTimeSeconds = startTime
            ? Math.floor((Date.now() - startTime) / 1000)
            : lastWatchTimes.current[videoId] || 0;

        // Calculate completion rate
        const completionRate = videoDuration > 0
            ? Math.min(100, (watchTimeSeconds / videoDuration) * 100)
            : undefined;

        // Reset tracking
        delete viewStartTimes.current[videoId];
        delete lastWatchTimes.current[videoId];

        // Only send request if there's actual watch time
        if (watchTimeSeconds > 0 || forceUpdate) {
            setViewLoading(prev => ({ ...prev, [videoId]: true }));

            try {
                console.log(`Recording final view for video ${videoId}: ${watchTimeSeconds}s, completion: ${completionRate}%`);
                await VideoService.recordView(videoId, watchTimeSeconds, completionRate);
                console.log(`View successfully recorded for ${videoId}`);
                mobileEvents.track('video_view_completed', {
                    videoId,
                    watchTimeSeconds,
                    completionRate,
                });
            } catch (error) {
                console.error(`Error recording view for ${videoId}:`, error);
            } finally {
                setViewLoading(prev => ({ ...prev, [videoId]: false }));
            }
        }
    }, []);

    // Share a video
    const shareVideo = useCallback(async (
        videoId: string,
        platform: ApiSharePlatform,
        onUpdate?: (count: number) => void
    ) => {
        if (shareLoading[videoId]) return;

        setShareLoading(prev => ({ ...prev, [videoId]: true }));

        try {
            console.log(`Sharing video ${videoId} to ${platform}`);
            const response = await VideoService.shareVideo(videoId, platform);
            console.log(`Share response from backend:`, response);

            // Call the onUpdate callback with the new count
            if (onUpdate) {
                onUpdate(response.sharesCount);
            }

            mobileEvents.track('video_shared', {
                videoId,
                platform,
                sharesCount: response.sharesCount,
            });

            return response;
        } catch (error) {
            console.error(`Error sharing video ${videoId} to ${platform}:`, error);
            throw error;
        } finally {
            setShareLoading(prev => ({ ...prev, [videoId]: false }));
        }
    }, [shareLoading]);

    // Clean up function to stop all tracking
    const cleanup = useCallback(() => {
        // Clear all intervals
        Object.keys(viewUpdateInterval.current).forEach(videoId => {
            clearInterval(viewUpdateInterval.current[videoId]);
        });

        // Reset all refs
        viewStartTimes.current = {};
        lastWatchTimes.current = {};
        viewUpdateInterval.current = {};
        mobileEvents.flush().catch(() => {
            // Best-effort analytics flush during cleanup.
        });
    }, []);

    return {
        toggleLike,
        startViewTracking,
        stopViewTracking,
        shareVideo,
        cleanup,
        likeLoading,
        viewLoading,
        shareLoading
    };
}