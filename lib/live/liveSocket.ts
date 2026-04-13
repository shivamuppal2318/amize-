import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/api/config';
import { getTokens } from '@/lib/auth/tokens';
import { LiveComment, LiveModerationAction, LiveSession } from '@/lib/live/types';
import { captureException } from '@/utils/errorReporting';

type LiveSocketHandlers = {
    connect?: () => void;
    disconnect?: () => void;
    connectError?: (message: string) => void;
    viewerCount?: (count: number) => void;
    viewersList?: (viewers: Array<{ id: string; username: string }>) => void;
    likeCount?: (count: number) => void;
    commentReceived?: (comment: LiveComment) => void;
    sessionEnded?: () => void;
    sessionUpdated?: (session: LiveSession) => void;
    sessionModerated?: (
        session: LiveSession,
        action: LiveModerationAction,
        targetUserId?: string
    ) => void;
    moderationNotice?: (action: LiveModerationAction, targetUserId?: string) => void;
};

class LiveSocketClient {
    private socket: Socket | null = null;
    private sessionId: string | null = null;

    async connect(sessionId: string, handlers: LiveSocketHandlers): Promise<void> {
        const tokens = await getTokens();
        if (!tokens?.accessToken) {
            throw new Error('No access token available for live session socket');
        }

        if (this.socket) {
            this.disconnect();
        }

        this.sessionId = sessionId;
        this.socket = io(API_CONFIG.SOCKET_URL, {
            auth: { token: tokens.accessToken },
            transports: API_CONFIG.SOCKET_CONFIG.TRANSPORTS,
            autoConnect: false,
            forceNew: true,
            timeout: API_CONFIG.SOCKET_CONFIG.TIMEOUT,
            reconnection: API_CONFIG.SOCKET_CONFIG.RECONNECTION,
            reconnectionAttempts: API_CONFIG.SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
            reconnectionDelay: API_CONFIG.SOCKET_CONFIG.RECONNECTION_DELAY,
            reconnectionDelayMax: API_CONFIG.SOCKET_CONFIG.RECONNECTION_DELAY_MAX,
            upgrade: API_CONFIG.SOCKET_CONFIG.UPGRADE,
            rememberUpgrade: API_CONFIG.SOCKET_CONFIG.REMEMBER_UPGRADE,
        });

        this.socket.on('connect', () => {
            this.socket?.emit('join_live_session', { sessionId });
            handlers.connect?.();
        });
        this.socket.on('disconnect', () => handlers.disconnect?.());
        this.socket.on('connect_error', (error: Error) => {
            captureException(error, {
                tags: { module: 'live-socket', event: 'connect_error' },
                extra: { sessionId },
            });
            handlers.connectError?.(error.message);
        });
        this.socket.on('live_viewer_count', (data: { viewerCount?: number }) =>
            handlers.viewerCount?.(data.viewerCount ?? 0)
        );
        this.socket.on(
            'live_viewers_list',
            (data: { viewers?: Array<{ id: string; username: string }> }) => {
                if (data.viewers) {
                    handlers.viewersList?.(data.viewers);
                }
            }
        );
        this.socket.on('live_like_count', (data: { likeCount?: number }) =>
            handlers.likeCount?.(data.likeCount ?? 0)
        );
        this.socket.on('live_comment_received', (data: { comment?: LiveComment }) => {
            if (data.comment) {
                handlers.commentReceived?.(data.comment);
            }
        });
        this.socket.on('live_session_ended', () => handlers.sessionEnded?.());
        this.socket.on('live_session_updated', (data: { session?: LiveSession }) => {
            if (data.session) {
                handlers.sessionUpdated?.(data.session);
            }
        });
        this.socket.on(
            'live_session_moderated',
            (data: {
                session?: LiveSession;
                action?: LiveModerationAction;
                targetUserId?: string;
            }) => {
                if (data.session && data.action) {
                    handlers.sessionModerated?.(
                        data.session,
                        data.action,
                        data.targetUserId
                    );
                }
            }
        );
        this.socket.on(
            'live_moderation_notice',
            (data: {
                action?: LiveModerationAction;
                targetUserId?: string;
            }) => {
                if (data.action) {
                    handlers.moderationNotice?.(data.action, data.targetUserId);
                }
            }
        );

        this.socket.connect();
    }

    sendComment(text: string): void {
        if (!this.socket || !this.sessionId) {
            return;
        }

        this.socket.emit('live_comment_send', {
            sessionId: this.sessionId,
            text,
        });
    }

    sendLike(): void {
        if (!this.socket || !this.sessionId) {
            return;
        }

        this.socket.emit('live_like_send', {
            sessionId: this.sessionId,
        });
    }

    disconnect(): void {
        if (this.socket && this.sessionId) {
            this.socket.emit('leave_live_session', {
                sessionId: this.sessionId,
            });
        }

        this.socket?.removeAllListeners();
        this.socket?.disconnect();
        this.socket = null;
        this.sessionId = null;
    }
}

export const liveSocketClient = new LiveSocketClient();
