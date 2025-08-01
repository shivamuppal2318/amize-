import { Platform } from 'react-native';
import VideoService from '@/lib/api/videoService';

interface VideoSession {
    videoId: string;
    startTime: number;
    lastUpdateTime: number;
    totalWatchTime: number;
    videoDuration: number;
    viewTracked: boolean;
    updateInterval?: NodeJS.Timeout;
}

/**
 * VideoAnalytics - Handles tracking and reporting of video view metrics
 */
class VideoAnalytics {
    // Current video sessions
    private sessions: Record<string, VideoSession> = {};

    // Periodic update interval in ms (how often to save partial view data)
    private periodicUpdateMs: number = 10000; // 10 seconds

    // Minimum watch time to consider a meaningful view (in seconds)
    private minMeaningfulWatchTime: number = 3;

    // Singleton instance
    private static instance: VideoAnalytics;

    // Private constructor for singleton
    private constructor() {
        // Set up app state listeners if needed
        this.setupAppStateListeners();
    }

    // Get singleton instance
    public static getInstance(): VideoAnalytics {
        if (!VideoAnalytics.instance) {
            VideoAnalytics.instance = new VideoAnalytics();
        }
        return VideoAnalytics.instance;
    }

    /**
     * Set up listeners for app state changes to handle background/foreground transitions
     */
    private setupAppStateListeners() {
        // This could use AppState from react-native to detect when app goes to background
        // For simplicity we're not implementing it here, but in a real app you'd want this
    }

    /**
     * Start tracking a video view
     */
    public startSession(videoId: string, videoDuration: number): void {
        const now = Date.now();

        // If there's an existing session, stop it first
        if (this.sessions[videoId]) {
            this.pauseSession(videoId);
        }

        // Create a new session
        this.sessions[videoId] = {
            videoId,
            startTime: now,
            lastUpdateTime: now,
            totalWatchTime: 0,
            videoDuration,
            viewTracked: false,
        };

        // Set up periodic updates for long videos
        this.sessions[videoId].updateInterval = setInterval(() => {
            this.updateWatchTime(videoId);
        }, this.periodicUpdateMs);
    }

    /**
     * Pause a video session (when video loses focus but isn't fully stopped)
     */
    public pauseSession(videoId: string): void {
        const session = this.sessions[videoId];
        if (!session) return;

        // Clear the update interval
        if (session.updateInterval) {
            clearInterval(session.updateInterval);
            delete session.updateInterval;
        }

        // Update the watch time
        this.updateWatchTime(videoId);
    }

    /**
     * Resume a paused video session
     */
    public resumeSession(videoId: string): void {
        const session = this.sessions[videoId];
        if (!session) return;

        // Update the start time
        session.lastUpdateTime = Date.now();

        // Set up periodic updates again
        session.updateInterval = setInterval(() => {
            this.updateWatchTime(videoId);
        }, this.periodicUpdateMs);
    }

    /**
     * End a video session and send final analytics
     */
    public endSession(videoId: string): void {
        const session = this.sessions[videoId];
        if (!session) return;

        // Clear the update interval
        if (session.updateInterval) {
            clearInterval(session.updateInterval);
        }

        // Update the watch time one last time
        this.updateWatchTime(videoId);

        // Send final analytics if we have enough watch time
        const watchTimeSeconds = Math.round(session.totalWatchTime / 1000);
        if (watchTimeSeconds >= this.minMeaningfulWatchTime) {
            this.reportVideoView(session);
        }

        // Remove the session
        delete this.sessions[videoId];
    }

    /**
     * Update the watch time for a session
     */
    private updateWatchTime(videoId: string): void {
        const session = this.sessions[videoId];
        if (!session) return;

        const now = Date.now();
        const elapsedMs = now - session.lastUpdateTime;

        // Update the session
        session.totalWatchTime += elapsedMs;
        session.lastUpdateTime = now;

        // If it's been watched long enough and we haven't tracked a view yet,
        // record it as a view
        const watchTimeSeconds = Math.round(session.totalWatchTime / 1000);
        if (watchTimeSeconds >= this.minMeaningfulWatchTime && !session.viewTracked) {
            // For video that just started, record initial view
            this.reportInitialView(session);
        }
    }

    /**
     * Report the initial view (when video has been watched for minimum time)
     */
    private async reportInitialView(session: VideoSession): Promise<void> {
        try {
            // Mark as tracked to avoid duplicate tracking
            session.viewTracked = true;

            // Use the video service to record view with just a flag
            await VideoService.getVideo(session.videoId, true);
        } catch (error) {
            console.error('Error recording initial view:', error);
        }
    }

    /**
     * Report full video view analytics
     */
    private async reportVideoView(session: VideoSession): Promise<void> {
        try {
            const watchTimeSeconds = Math.round(session.totalWatchTime / 1000);

            // Calculate completion rate if we know the duration
            let completionRate;
            if (session.videoDuration > 0) {
                completionRate = Math.min(100, (watchTimeSeconds / session.videoDuration) * 100);
            }

            // Record the detailed view
            await VideoService.recordView(
                session.videoId,
                watchTimeSeconds,
                completionRate
            );
        } catch (error) {
            console.log('Error recording video view:', error);
        }
    }

    /**
     * Clean up all sessions (call on component unmount)
     */
    public cleanup(): void {
        // End all active sessions
        Object.keys(this.sessions).forEach(videoId => {
            this.endSession(videoId);
        });
    }
}

export default VideoAnalytics;