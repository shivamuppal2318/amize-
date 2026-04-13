import {API_URL, SOCKET_URL} from "@/lib/settings/constants";

export const API_CONFIG = {
    BASE_URL: API_URL,
    SOCKET_URL: SOCKET_URL,
    TIMEOUT: 15000, // 15 seconds for regular operations
    UPLOAD_TIMEOUT: 300000, // 5 minutes for uploads
    HEAVY_OPERATIONS_TIMEOUT: 120000, // 2 minutes for heavy operations like slideshow
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    VIDEO_CACHING: {
        ENABLED: true,
        MAX_AGE: 60 * 60 * 1000, // 1 hour in milliseconds
        CAPACITY: 50, // Maximum number of videos to cache
    },
    // Socket.io specific configuration
    SOCKET_CONFIG: {
        TIMEOUT: 10000, // 10 seconds connection timeout
        RECONNECTION: true,
        RECONNECTION_ATTEMPTS: 5,
        RECONNECTION_DELAY: 1000, // Start with 1 second
        RECONNECTION_DELAY_MAX: 30000, // Max 30 seconds
        MAX_LISTENERS: 20,
        TRANSPORTS: ['websocket', 'polling'],
        UPGRADE: true,
        REMEMBER_UPGRADE: true,
    },
};

// Auth-specific endpoints
export const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    GOOGLE: '/auth/google',
    FACEBOOK: '/auth/facebook',
    APPLE: '/auth/apple',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    VERIFY_CODE: '/auth/verify-code',
    RESEND_CODE: '/auth/resend-code',
};

// Video-specific endpoints
export const VIDEO_ENDPOINTS = {
    VIDEOS: '/videos',
    TRENDING: '/videos/trending',
    VIDEO_BY_ID: (id: string) => `/videos/${id}`,
    LIKE: (id: string) => `/videos/${id}/like`,
    VIEW: (id: string) => `/videos/${id}/view`,
    COMMENTS: (id: string) => `/videos/${id}/comment`,
    SHARE: (id: string) => `/videos/${id}/share`,
    SLIDESHOW: '/videos/slideshow',
};

// Upload-specific endpoints
export const UPLOAD_ENDPOINTS = {
    UPLOAD: '/upload',
    GET_UPLOADS: '/upload',
    UPLOAD_BY_ID: (id: string) => `/upload/${id}`,
    DELETE_UPLOAD: (id: string) => `/upload/${id}`,
};

// Messaging-specific endpoints
export const MESSAGE_ENDPOINTS = {
    CONVERSATIONS: '/conversations',
    CONVERSATION_BY_ID: (id: string) => `/conversations/${id}`,
    MESSAGES: '/messages',
    MESSAGE_BY_ID: (id: string) => `/messages/${id}`,
    USER_STATUS: '/users/status',
    USER_STATUS_BY_ID: (id: string) => `/users/${id}/status`,
    SOCKET_ENDPOINT: '/socket', // For initializing Socket.io server
};

// Live streaming endpoints
export const LIVE_ENDPOINTS = {
    SESSIONS: '/live/sessions',
    SESSION_BY_ID: (id: string) => `/live/sessions/${id}`,
    JOIN: (id: string) => `/live/sessions/${id}/join`,
    LEAVE: (id: string) => `/live/sessions/${id}/leave`,
    COMMENTS: (id: string) => `/live/sessions/${id}/comments`,
    LIKE: (id: string) => `/live/sessions/${id}/like`,
};

// Environment-specific configurations
export const ENV_CONFIG = {
    development: {
        SOCKET_URL: SOCKET_URL,
        LOG_LEVEL: 'debug',
        ENABLE_SOCKET_LOGS: true,
    },
    production: {
        SOCKET_URL: SOCKET_URL,
        LOG_LEVEL: 'error',
        ENABLE_SOCKET_LOGS: false,
    },
};

// Get environment-specific config
export const getEnvConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
};
