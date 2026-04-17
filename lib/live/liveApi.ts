import apiClient from '@/lib/api/client';
import { LIVE_ENDPOINTS } from '@/lib/api/config';
import {
    LiveComment,
    LiveHostTransport,
    LiveModerationAction,
    LiveSession,
    LiveSessionPayload,
    LiveTelemetrySample,
} from '@/lib/live/types';

type SessionResponse = {
    session?: LiveSession;
};

type TransportResponse = {
    transport?: LiveHostTransport;
};

export async function createLiveSession(
    payload: LiveSessionPayload
): Promise<LiveSession> {
    const response = await apiClient.post<SessionResponse>(LIVE_ENDPOINTS.SESSIONS, payload);

    if (!response.data?.session?.id) {
        throw new Error('Live session response did not include a session id');
    }

    return response.data.session;
}

export async function endLiveSession(sessionId: string): Promise<void> {
    await apiClient.delete(LIVE_ENDPOINTS.SESSION_BY_ID(sessionId));
}

export async function updateLiveSession(
    sessionId: string,
    updates: Partial<LiveSessionPayload> & {
        title?: string;
        description?: string;
    }
): Promise<LiveSession> {
    const response = await apiClient.patch<SessionResponse>(
        LIVE_ENDPOINTS.SESSION_BY_ID(sessionId),
        updates
    );

    if (!response.data?.session?.id) {
        throw new Error('Live session update response did not include a session id');
    }

    return response.data.session;
}

export async function joinLiveSession(sessionId: string): Promise<void> {
    await apiClient.post(LIVE_ENDPOINTS.JOIN(sessionId));
}

export async function leaveLiveSession(sessionId: string): Promise<void> {
    await apiClient.post(LIVE_ENDPOINTS.LEAVE(sessionId));
}

export async function postLiveComment(
    sessionId: string,
    text: string
): Promise<LiveComment | null> {
    const response = await apiClient.post<{ comment?: LiveComment }>(
        LIVE_ENDPOINTS.COMMENTS(sessionId),
        { text }
    );

    return response.data?.comment ?? null;
}

export async function sendLiveLike(sessionId: string): Promise<void> {
    await apiClient.post(LIVE_ENDPOINTS.LIKE(sessionId));
}

export async function moderateLiveSession(
    sessionId: string,
    action: LiveModerationAction,
    targetUserId: string
): Promise<LiveSession> {
    const response = await apiClient.post<SessionResponse>(
        `${LIVE_ENDPOINTS.SESSION_BY_ID(sessionId)}/moderation`,
        {
            action,
            targetUserId,
        }
    );

    if (!response.data?.session?.id) {
        throw new Error('Live moderation response did not include a session id');
    }

    return response.data.session;
}

export async function getLiveTransport(sessionId: string): Promise<LiveHostTransport> {
    const response = await apiClient.get<TransportResponse>(
        `${LIVE_ENDPOINTS.SESSION_BY_ID(sessionId)}/transport`
    );

    if (!response.data?.transport?.streamKey) {
        throw new Error('Live transport response did not include host credentials');
    }

    return response.data.transport;
}

export async function postLiveTelemetry(
    sessionId: string,
    sample: LiveTelemetrySample
): Promise<void> {
    await apiClient.post(`${LIVE_ENDPOINTS.SESSION_BY_ID(sessionId)}/telemetry`, sample);
}
