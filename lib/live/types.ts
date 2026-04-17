export type LiveVisibility = 'public' | 'private';
export type LiveCommentsMode = 'enabled' | 'disabled';
export type LiveBeautyMode = 'on' | 'off';
export type LiveModerationMode = 'open' | 'restricted';
export type LiveSessionMode = 'backend' | 'preview';
export type LiveSessionStatus =
    | 'idle'
    | 'creating'
    | 'connecting'
    | 'live'
    | 'preview'
    | 'ending'
    | 'ended'
    | 'error';

export interface LiveSessionPayload {
    title: string;
    description: string;
    visibility: LiveVisibility;
    comments: LiveCommentsMode;
    beauty: LiveBeautyMode;
    moderation: LiveModerationMode;
}

export interface LiveTransportSummary {
    provider: string;
    ingestProtocol: string;
    playbackProtocol: string;
    playbackUrl: string;
    requiresExternalEncoder: boolean;
    ready: boolean;
}

export interface LiveHostTransport extends LiveTransportSummary {
    ingestUrl: string;
    streamKey: string;
    publishUrl: string;
    dashboardUrl?: string;
    instructions: string[];
}

export interface LiveSession {
    id: string;
    title: string;
    description: string;
    visibility: LiveVisibility;
    comments: LiveCommentsMode;
    beauty: LiveBeautyMode;
    moderation: LiveModerationMode;
    status?: string;
    streamKey?: string;
    playbackUrl?: string;
    viewerCount?: number;
    likeCount?: number;
    createdAt?: string;
    hostUserId?: string;
    hostUsername?: string;
    recentComments?: LiveComment[];
    transport?: LiveTransportSummary;
    moderationSummary?: {
        mutedUserIds: string[];
        blockedUserIds: string[];
    };
}

export interface LiveComment {
    id: string;
    userId?: string;
    username: string;
    text: string;
    timestamp: string;
    isLocal?: boolean;
}

export type LiveModerationAction =
    | 'mute'
    | 'unmute'
    | 'block'
    | 'unblock'
    | 'remove_viewer';

export interface LiveSessionRuntimeState {
    sessionId: string | null;
    mode: LiveSessionMode;
    status: LiveSessionStatus;
    viewerCount: number;
    likeCount: number;
    comments: LiveComment[];
    viewers: Array<{ id: string; username: string }>;
    error: string | null;
    connectionLabel: string;
    session: LiveSession | null;
    hostTransport: LiveHostTransport | null;
    telemetry?: {
        bitrateKbps: number;
        droppedFrames: number;
        rttMs: number;
        sampleAt: string;
    } | null;
}

export interface LiveTelemetrySample {
    bitrateKbps: number;
    droppedFrames: number;
    rttMs: number;
    sampleAt: string;
}
