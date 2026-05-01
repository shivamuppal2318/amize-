import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    createLiveSession,
    endLiveSession,
    getLiveTransport,
    joinLiveSession,
    leaveLiveSession,
    moderateLiveSession as moderateLiveSessionRequest,
    postLiveComment,
    postLiveTelemetry,
    sendLiveLike,
    updateLiveSession as updateLiveSessionRequest,
} from '@/lib/live/liveApi';
import { liveSocketClient } from '@/lib/live/liveSocket';
import {
    LiveComment,
    LiveModerationAction,
    LiveSession,
    LiveSessionPayload,
    LiveSessionRuntimeState,
} from '@/lib/live/types';

const PREVIEW_COMMENTS: LiveComment[] = [
    { id: 'preview-1', username: 'user123', text: 'Hello. Looking great.', timestamp: '1m' },
    { id: 'preview-2', username: 'fan_account', text: 'I love your content.', timestamp: '30s' },
    { id: 'preview-3', username: 'new_viewer', text: 'First time here. This is awesome.', timestamp: '10s' },
];

const PREVIEW_VIEWERS = [
    { id: 'viewer-1', username: 'user123' },
    { id: 'viewer-2', username: 'fan_account' },
    { id: 'viewer-3', username: 'new_viewer' },
];

const buildPreviewState = (): LiveSessionRuntimeState => ({
    sessionId: `preview-${Date.now()}`,
    mode: 'preview',
    status: 'preview',
    viewerCount: 324,
    likeCount: 1250,
    comments: PREVIEW_COMMENTS,
    viewers: PREVIEW_VIEWERS,
    error: null,
    connectionLabel: 'Preview mode',
    session: {
        id: `preview-${Date.now()}`,
        title: 'Preview Live Session',
        description: 'Preview fallback',
        visibility: 'public',
        comments: 'enabled',
        beauty: 'off',
        moderation: 'open',
        viewerCount: 324,
        likeCount: 1250,
        recentComments: PREVIEW_COMMENTS,
        moderationSummary: {
            mutedUserIds: [],
            blockedUserIds: [],
        },
    },
    hostTransport: null,
    telemetry: null,
});

export function useLiveSession(payload: LiveSessionPayload) {
    const [state, setState] = useState<LiveSessionRuntimeState>({
        sessionId: null,
        mode: 'preview',
        status: 'idle',
        viewerCount: 0,
        likeCount: 0,
        comments: [],
        viewers: [],
        error: null,
        connectionLabel: 'Idle',
        session: null,
        hostTransport: null,
        telemetry: null,
    });
    const previewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const telemetryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const isUnmountingRef = useRef(false);
    const isEndingRef = useRef(false);

    const startPreviewSimulation = useCallback(() => {
        if (previewIntervalRef.current) {
            clearInterval(previewIntervalRef.current);
        }

        previewIntervalRef.current = setInterval(() => {
            setState((current) => {
                if (current.mode !== 'preview' || current.status !== 'preview') {
                    return current;
                }

                return {
                    ...current,
                    viewerCount: current.viewerCount + Math.floor(Math.random() * 3),
                    session: current.session
                        ? {
                              ...current.session,
                              viewerCount:
                                  (current.session.viewerCount ?? current.viewerCount) +
                                  Math.floor(Math.random() * 3),
                          }
                        : current.session,
                };
            });
        }, 5000);
    }, []);

    const stopPreviewSimulation = useCallback(() => {
        if (previewIntervalRef.current) {
            clearInterval(previewIntervalRef.current);
            previewIntervalRef.current = null;
        }
    }, []);

    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const fallbackToPreview = useCallback((errorMessage?: string) => {
        clearReconnectTimeout();
        stopPreviewSimulation();
        setState({
            ...buildPreviewState(),
            error: errorMessage ?? null,
            connectionLabel: errorMessage
                ? 'Backend unavailable, preview mode'
                : 'Preview mode',
            hostTransport: null,
            telemetry: null,
        });
        startPreviewSimulation();
    }, [clearReconnectTimeout, startPreviewSimulation, stopPreviewSimulation]);

    const buildSocketHandlers = useCallback(
        (
            sessionId: string,
            onReconnectRequest: () => void,
            onFatalReconnectFailure: (message: string) => void
        ) => ({
            connect: () => {
                reconnectAttemptsRef.current = 0;
                clearReconnectTimeout();
                setState((current) => ({
                    ...current,
                    status: 'live',
                    error: null,
                    connectionLabel: 'Connected to live backend',
                }));
            },
            disconnect: () => {
                if (isUnmountingRef.current || isEndingRef.current) {
                    return;
                }

                setState((current) => ({
                    ...current,
                    status: 'reconnecting',
                    connectionLabel: 'Live socket disconnected. Reconnecting...',
                }));
                onReconnectRequest();
            },
            connectError: (message: string) => {
                if (isUnmountingRef.current || isEndingRef.current) {
                    return;
                }

                onFatalReconnectFailure(message);
            },
            viewerCount: (count: number) => {
                setState((current) => ({
                    ...current,
                    viewerCount: count,
                    session: current.session
                        ? { ...current.session, viewerCount: count }
                        : current.session,
                }));
            },
            viewersList: (viewers: Array<{ id: string; username: string }>) => {
                setState((current) => ({
                    ...current,
                    viewers,
                }));
            },
            likeCount: (count: number) => {
                setState((current) => ({
                    ...current,
                    likeCount: count,
                    session: current.session
                        ? { ...current.session, likeCount: count }
                        : current.session,
                }));
            },
            commentReceived: (comment: LiveComment) => {
                setState((current) => {
                    const alreadyPresent = current.comments.some(
                        (existing) => existing.id === comment.id
                    );
                    if (alreadyPresent) {
                        return current;
                    }

                    return {
                        ...current,
                        comments: [...current.comments, comment],
                        session: current.session
                            ? {
                                  ...current.session,
                                  recentComments: [
                                      ...(current.session.recentComments ?? []),
                                      comment,
                                  ].slice(-10),
                              }
                            : current.session,
                    };
                });
            },
            sessionEnded: () => {
                clearReconnectTimeout();
                setState((current) => ({
                    ...current,
                    status: 'ended',
                    connectionLabel: 'Live session ended',
                    session: current.session
                        ? { ...current.session, status: 'ended' }
                        : current.session,
                }));
            },
            sessionUpdated: (session: LiveSession) => {
                setState((current) => ({
                    ...current,
                    status: current.status === 'reconnecting' ? 'live' : current.status,
                    error: null,
                    viewerCount: session.viewerCount ?? current.viewerCount,
                    likeCount: session.likeCount ?? current.likeCount,
                    comments: session.recentComments ?? current.comments,
                    session,
                    hostTransport: current.hostTransport,
                }));
            },
            sessionModerated: (session: LiveSession) => {
                setState((current) => ({
                    ...current,
                    viewerCount: session.viewerCount ?? current.viewerCount,
                    likeCount: session.likeCount ?? current.likeCount,
                    comments: session.recentComments ?? current.comments,
                    session,
                    hostTransport: current.hostTransport,
                }));
            },
            moderationNotice: (action: LiveModerationAction) => {
                if (action === 'block' || action === 'remove_viewer') {
                    clearReconnectTimeout();
                    liveSocketClient.disconnect();
                    setState((current) => ({
                        ...current,
                        status: 'error',
                        connectionLabel:
                            action === 'block'
                                ? 'You were blocked from this live session'
                                : 'You were removed from this live session',
                        error:
                            action === 'block'
                                ? 'The host blocked you from this session.'
                                : 'The host removed you from this session.',
                    }));
                    return;
                }

                if (action === 'mute') {
                    setState((current) => ({
                        ...current,
                        connectionLabel: 'You were muted in this live session',
                        error: 'The host muted your comments for this session.',
                    }));
                }
            },
        }),
        [clearReconnectTimeout]
    );

    const connectSocket = useCallback(
        async (
            sessionId: string,
            {
                onReconnectRequest,
                onFatalReconnectFailure,
            }: {
                onReconnectRequest: () => void;
                onFatalReconnectFailure: (message: string) => void;
            }
        ) => {
            await liveSocketClient.connect(
                sessionId,
                buildSocketHandlers(
                    sessionId,
                    onReconnectRequest,
                    onFatalReconnectFailure
                )
            );
        },
        [buildSocketHandlers]
    );

    const scheduleReconnect = useCallback(
        (sessionId: string) => {
            clearReconnectTimeout();

            const nextAttempt = reconnectAttemptsRef.current + 1;
            reconnectAttemptsRef.current = nextAttempt;

            if (nextAttempt > 3) {
                fallbackToPreview('Lost connection to live backend');
                return;
            }

            const delayMs = Math.min(15000, 2000 * nextAttempt);
            reconnectTimeoutRef.current = setTimeout(async () => {
                if (isUnmountingRef.current || isEndingRef.current) {
                    return;
                }

                setState((current) => ({
                    ...current,
                    status: 'reconnecting',
                    connectionLabel: `Reconnecting to live backend (attempt ${nextAttempt}/3)`,
                }));

                try {
                    await joinLiveSession(sessionId).catch(() => undefined);
                    await connectSocket(sessionId, {
                        onReconnectRequest: () => scheduleReconnect(sessionId),
                        onFatalReconnectFailure: (message) => {
                            setState((current) => ({
                                ...current,
                                error: message,
                                connectionLabel: `Reconnect failed. Retrying...`,
                            }));
                            scheduleReconnect(sessionId);
                        },
                    });
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : 'Unable to reconnect to live backend';
                    setState((current) => ({
                        ...current,
                        error: message,
                        connectionLabel: 'Reconnect failed. Retrying...',
                    }));
                    scheduleReconnect(sessionId);
                }
            }, delayMs);
        },
        [clearReconnectTimeout, connectSocket, fallbackToPreview]
    );

    const startSession = useCallback(async () => {
        isUnmountingRef.current = false;
        isEndingRef.current = false;
        reconnectAttemptsRef.current = 0;
        clearReconnectTimeout();
        setState((current) => ({
            ...current,
            status: 'creating',
            connectionLabel: 'Creating live session',
            error: null,
        }));

        try {
            const session = await createLiveSession(payload);
            let hostTransport = null;

            try {
                hostTransport = await getLiveTransport(session.id);
            } catch {
                hostTransport = null;
            }
            setState({
                sessionId: session.id,
                mode: 'backend',
                status: 'connecting',
                viewerCount: session.viewerCount ?? 0,
                likeCount: session.likeCount ?? 0,
                comments: session.recentComments ?? [],
                viewers: [],
                error: null,
                connectionLabel: 'Connecting to live backend',
                session,
                hostTransport,
                telemetry: null,
            });
            try {
                await joinLiveSession(session.id);
            } catch {
                // Keep going. Socket join may still work even if REST join is absent.
            }

            await connectSocket(session.id, {
                onReconnectRequest: () => scheduleReconnect(session.id),
                onFatalReconnectFailure: (message) => {
                    fallbackToPreview(message);
                },
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unable to start backend live session';
            fallbackToPreview(message);
        }
    }, [clearReconnectTimeout, connectSocket, fallbackToPreview, payload, scheduleReconnect]);

    const endSession = useCallback(async () => {
        isEndingRef.current = true;
        clearReconnectTimeout();
        stopPreviewSimulation();
        if (telemetryIntervalRef.current) {
            clearInterval(telemetryIntervalRef.current);
            telemetryIntervalRef.current = null;
        }

        setState((current) => ({
            ...current,
            status: 'ending',
            connectionLabel: 'Ending session',
        }));

        const sessionId = state.sessionId;
        if (state.mode === 'backend' && sessionId) {
            try {
                await leaveLiveSession(sessionId);
            } catch {
                // Best effort only.
            }

            try {
                await endLiveSession(sessionId);
            } catch {
                // End screen should still be closable even if backend cleanup fails.
            }
        }

        liveSocketClient.disconnect();
        setState((current) => ({
            ...current,
            status: 'ended',
            connectionLabel: 'Session closed',
            session: current.session
                ? { ...current.session, status: 'ended' }
                : current.session,
            hostTransport: current.hostTransport,
            telemetry: current.telemetry,
        }));
    }, [clearReconnectTimeout, state.mode, state.sessionId, stopPreviewSimulation]);

    const sendComment = useCallback(
        async (text: string, username: string) => {
            const trimmedText = text.trim();
            if (!trimmedText) {
                return;
            }

            const optimisticComment: LiveComment = {
                id: `local-${Date.now()}`,
                username,
                text: trimmedText,
                timestamp: 'now',
                isLocal: true,
            };

            setState((current) => ({
                ...current,
                comments: [...current.comments, optimisticComment],
                session: current.session
                    ? {
                          ...current.session,
                          recentComments: [
                              ...(current.session.recentComments ?? []),
                              optimisticComment,
                          ].slice(-10),
                      }
                    : current.session,
            }));

            if (state.mode === 'backend' && state.sessionId) {
                liveSocketClient.sendComment(trimmedText);
                try {
                    await postLiveComment(state.sessionId, trimmedText);
                } catch {
                    // Socket path may still succeed even if REST persistence is unavailable.
                }
            }
        },
        [state.mode, state.sessionId]
    );

    const sendLike = useCallback(async () => {
        setState((current) => ({
            ...current,
            likeCount: current.likeCount + 1,
            session: current.session
                ? {
                      ...current.session,
                      likeCount: (current.session.likeCount ?? current.likeCount) + 1,
                  }
                : current.session,
        }));

        if (state.mode === 'backend' && state.sessionId) {
            liveSocketClient.sendLike();
            try {
                await sendLiveLike(state.sessionId);
            } catch {
                // Keep optimistic UI for now.
            }
        }
    }, [state.mode, state.sessionId]);

    const updateSession = useCallback(
        async (
            updates: Partial<LiveSessionPayload> & {
                title?: string;
                description?: string;
            }
        ) => {
            if (state.mode !== 'backend' || !state.sessionId) {
                setState((current) => ({
                    ...current,
                    session: current.session ? { ...current.session, ...updates } : current.session,
                }));
                return null;
            }

            const updatedSession = await updateLiveSessionRequest(state.sessionId, updates);
            setState((current) => ({
                ...current,
                viewerCount: updatedSession.viewerCount ?? current.viewerCount,
                likeCount: updatedSession.likeCount ?? current.likeCount,
                comments: updatedSession.recentComments ?? current.comments,
                session: updatedSession,
            }));
            return updatedSession;
        },
        [state.mode, state.sessionId]
    );

    const moderateViewer = useCallback(
        async (action: LiveModerationAction, targetUserId: string) => {
            if (state.mode !== 'backend' || !state.sessionId) {
                return null;
            }

            const updatedSession = await moderateLiveSessionRequest(
                state.sessionId,
                action,
                targetUserId
            );

            setState((current) => ({
                ...current,
                viewerCount: updatedSession.viewerCount ?? current.viewerCount,
                likeCount: updatedSession.likeCount ?? current.likeCount,
                comments: updatedSession.recentComments ?? current.comments,
                session: updatedSession,
            }));

            return updatedSession;
        },
        [state.mode, state.sessionId]
    );

    useEffect(() => {
        startSession();

        return () => {
            isUnmountingRef.current = true;
            clearReconnectTimeout();
            stopPreviewSimulation();
            if (telemetryIntervalRef.current) {
                clearInterval(telemetryIntervalRef.current);
                telemetryIntervalRef.current = null;
            }
            liveSocketClient.disconnect();
        };
    }, [clearReconnectTimeout, startSession, stopPreviewSimulation]);

    useEffect(() => {
        if (state.mode !== 'backend' || state.status !== 'live' || !state.sessionId) {
            if (telemetryIntervalRef.current) {
                clearInterval(telemetryIntervalRef.current);
                telemetryIntervalRef.current = null;
            }
            return;
        }

        const sessionId = state.sessionId;
        telemetryIntervalRef.current = setInterval(() => {
            const sample = {
                bitrateKbps: 1500 + Math.floor(Math.random() * 1200),
                droppedFrames: Math.floor(Math.random() * 5),
                rttMs: 60 + Math.floor(Math.random() * 90),
                sampleAt: new Date().toISOString(),
            };

            setState((current) => ({
                ...current,
                telemetry: sample,
            }));

            postLiveTelemetry(sessionId, sample).catch(() => {
                // Best effort telemetry pipeline.
            });
        }, 15000);

        return () => {
            if (telemetryIntervalRef.current) {
                clearInterval(telemetryIntervalRef.current);
                telemetryIntervalRef.current = null;
            }
        };
    }, [state.mode, state.sessionId, state.status]);

    const backendConnected = useMemo(
        () => state.mode === 'backend' && state.status === 'live',
        [state.mode, state.status]
    );

    return {
        state,
        backendConnected,
        sendComment,
        sendLike,
        updateSession,
        moderateViewer,
        endSession,
    };
}
