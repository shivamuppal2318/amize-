export const COLORS = {
    background: '#1a1a2e',
    // background: '#1E4A72',
    black: '#000000',
    darkGray: '#1a1a2e',
    gray: '#4B5563',
    lightGray: '#6B7280',
    textGray: '#9CA3AF',
    textLightGray: '#F3F4F6',
    primary: '#FF5A5F',
    primaryLight: '#FF7A7F',
    bubble: {
        sent: '#FF5A5F',
        received: 'rgba(26, 26, 46, 0.8)',
    },
    white: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    surface: 'rgba(26, 26, 46, 0.6)',
    border: 'rgba(75, 85, 99, 0.1)',
    accent: 'rgba(255, 90, 95, 0.1)',
    accentBorder: 'rgba(255, 90, 95, 0.2)',
};

// Animation constants
export const ANIMATION = {
    SLIDE_DURATION: 400,
    TYPING_TIMEOUT: 1000,
    CONVERSATION_ITEM_DELAY: 50,
    MESSAGE_ANIMATION: {
        STIFFNESS: 300,
        DAMPING: 20,
    },
    TYPING_DOT: {
        DURATION: 600,
        DELAY: 200,
    },
    ENTRANCE: {
        DURATION: 400,
        DELAY: 100,
    },
    PULSE: {
        DURATION: 1000,
        SCALE_MIN: 0.7,
        SCALE_MAX: 1,
    },
};

// UI constants
export const UI = {
    AVATAR_SIZE: 50,
    AVATAR_SIZE_SMALL: 12,
    AVATAR_SIZE_LARGE: 60,
    ONLINE_INDICATOR_SIZE: 14,
    ICON_SIZE: {
        SMALL: 16,
        MEDIUM: 20,
        LARGE: 24,
        XLARGE: 28,
    },
    BORDER_RADIUS: {
        MESSAGE: 20,
        SEARCH: 16,
        BADGE: 12,
        AVATAR: 25,
        BUTTON: 22,
        CARD: 16,
        SM: 8,
        MD: 12,
        LG: 16,
        XL: 20,
        XXL: 24,
    },
    SPACING: {
        XS: 4,
        SM: 8,
        MD: 12,
        LG: 16,
        XL: 24,
        XXL: 32,
    },
    FONT_FAMILY: 'Figtree',
    SHADOW: {
        SMALL: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        MEDIUM: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
        },
        LARGE: {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 8,
            },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
        },
        PRIMARY: {
            shadowColor: '#FF5A5F',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
        },
    },
};

// Message status types
export const MESSAGE_STATUS = {
    SENDING: 'sending',
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    FAILED: 'failed',
} as const;

// Conversation types
export const CONVERSATION_TYPE = {
    DIRECT: 'direct',
    GROUP: 'group',
} as const;

// Tab names
export const TABS = {
    CHATS: 'Chats',
    GROUPS: 'Groups',
} as const;

// Connection states
export const CONNECTION_STATE = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
} as const;