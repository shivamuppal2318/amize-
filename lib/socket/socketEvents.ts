export interface User {
    id: string;
    username: string;
    profilePhotoUrl?: string;
    isOnline?: boolean;
    lastSeenAt?: string;
}

export interface Message {
    id: string;
    content: string;
    messageType: 'text' | 'image' | 'video' | 'file' | 'system';
    attachmentUrl?: string;
    attachmentType?: string;
    fileName?: string;
    senderId: string;
    receiverId: string;
    conversationId: string;
    replyToId?: string;
    isDelivered: boolean;
    deliveredAt?: string;
    isRead: boolean;
    readAt?: string;
    isDeleted: boolean;
    deletedAt?: string;
    createdAt: string;
    updatedAt: string;

    // Populated relations from backend
    sender: User;
    receiver?: User;
    replyTo?: (Message & { sender: User }) | null;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    title?: string;
    description?: string;
    imageUrl?: string;
    participants: User[];
    lastMessageId?: string;
    lastMessageContent?: string;
    lastMessageAt?: string;
    lastMessageSender?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// 🔥 UPDATED: Enhanced Notification interface
export interface Notification {
    id: string;
    type: 'follow' | 'message' | 'like' | 'comment' | 'mention' | 'system';
    message: string;
    userId: string;
    causerUserId?: string;
    videoId?: string;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
    causerUser?: User | null;
}

// 🔥 NEW: Notification settings interface
export interface NotificationSettings {
    follows: boolean;
    messages: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    pushNotifications: boolean;
}

// Server to Client Events - UPDATED with notification events
export interface ServerToClientEvents {
    // Message events
    message_received: (data: {
        message: Message;
        conversationId: string;
    }) => void;

    message_read: (data: {
        messageId: string;
        conversationId: string;
        readBy: string;
        readAt: string;
    }) => void;

    message_delivered: (data: {
        messageId: string;
        conversationId: string;
        deliveredAt: string;
    }) => void;

    // User presence events
    user_online: (data: {
        userId: string;
        username: string;
        onlineAt: string;
    }) => void;

    user_offline: (data: {
        userId: string;
        username: string;
        lastSeenAt: string;
    }) => void;

    // Typing events
    typing_start: (data: {
        conversationId: string;
        userId: string;
        username: string;
    }) => void;

    typing_stop: (data: {
        conversationId: string;
        userId: string;
        username: string;
    }) => void;

    // Conversation events
    conversation_updated: (data: {
        id: string;
        type: 'direct' | 'group';
        lastMessageContent?: string;
        lastMessageAt?: string;
        lastMessageSender?: string;
        participants: User[];
    }) => void;

    conversation_read: (data: {
        conversationId: string;
        readBy: string;
        readAt: string;
    }) => void;

    // 🔥 NEW: Notification events
    notification_received: (data: {
        notification: Notification;
    }) => void;

    notification_count_updated: (data: {
        unreadCount: number;
    }) => void;

    // Legacy notification event (kept for backward compatibility)
    notification: (data: {
        notification: Notification;
    }) => void;

    // System events
    error: (data: {
        message: string;
        code?: string;
    }) => void;

    // Socket connection events
    connect: () => void;
    disconnect: (reason: string) => void;
    connect_error: (error: Error) => void;
    reconnect: (attemptNumber: number) => void;
    reconnect_attempt: (attemptNumber: number) => void;
    reconnect_error: (error: Error) => void;
    reconnect_failed: () => void;
}

// Client to Server Events - UPDATED with notification events
export interface ClientToServerEvents {
    // Message operations
    send_message: (data: {
        content: string;
        receiverId: string;
        conversationId?: string;
        messageType?: 'text' | 'image' | 'video' | 'file' | 'system';
        attachmentUrl?: string;
        attachmentType?: string;
        fileName?: string;
        replyToId?: string;
    }, callback?: (response: {
        success: boolean;
        messageId?: string;
        error?: string;
        conversationId?: string;
    }) => void) => void;

    // Read status operations
    mark_message_read: (data: {
        messageId: string;
        conversationId: string;
    }) => void;

    mark_conversation_read: (data: {
        conversationId: string;
    }) => void;

    // Typing indicators
    typing_start: (data: {
        conversationId: string;
        receiverId: string;
    }) => void;

    typing_stop: (data: {
        conversationId: string;
        receiverId: string;
    }) => void;

    // Conversation management
    join_conversation: (data: {
        conversationId: string;
    }) => void;

    leave_conversation: (data: {
        conversationId: string;
    }) => void;

    // User status
    update_status: (data: {
        isOnline: boolean;
    }) => void;

    // 🔥 NEW: Notification operations
    get_notifications: (data: {
        page?: number;
        limit?: number;
    }, callback?: (response: {
        success: boolean;
        notifications?: Notification[];
        unreadCount?: number;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
        error?: string;
    }) => void) => void;

    mark_notification_read: (data: {
        notificationId: string;
    }, callback?: (response: {
        success: boolean;
        unreadCount?: number;
        message?: string;
        error?: string;
    }) => void) => void;

    mark_all_notifications_read: (data: {}, callback?: (response: {
        success: boolean;
        unreadCount?: number;
        message?: string;
        error?: string;
    }) => void) => void;

    delete_notification: (data: {
        notificationId: string;
    }, callback?: (response: {
        success: boolean;
        unreadCount?: number;
        message?: string;
        error?: string;
    }) => void) => void;

    get_notification_settings: (data: {}, callback?: (response: {
        success: boolean;
        settings?: NotificationSettings;
        error?: string;
    }) => void) => void;

    update_notification_settings: (data: {
        settings: NotificationSettings;
    }, callback?: (response: {
        success: boolean;
        settings?: NotificationSettings;
        message?: string;
        error?: string;
    }) => void) => void;

    // Future message operations
    edit_message?: (data: {
        messageId: string;
        conversationId: string;
        newContent: string;
    }, callback?: (response: { success: boolean; error?: string }) => void) => void;

    delete_message?: (data: {
        messageId: string;
        conversationId: string;
    }, callback?: (response: { success: boolean; error?: string }) => void) => void;

    // Conversation operations
    create_conversation?: (data: {
        participantId: string;
        type?: 'direct' | 'group';
        title?: string;
    }, callback?: (response: {
        success: boolean;
        conversation?: Conversation;
        error?: string;
    }) => void) => void;

    mute_conversation?: (data: {
        conversationId: string;
        duration?: number; // minutes
    }) => void;

    unmute_conversation?: (data: {
        conversationId: string;
    }) => void;

    pin_conversation?: (data: {
        conversationId: string;
    }) => void;

    unpin_conversation?: (data: {
        conversationId: string;
    }) => void;

    archive_conversation?: (data: {
        conversationId: string;
    }) => void;

    unarchive_conversation?: (data: {
        conversationId: string;
    }) => void;
}

// Socket connection states
export type SocketConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'error';

// Typing state
export interface TypingUser {
    userId: string;
    username: string;
    conversationId: string;
    startedAt?: string;
}

// Message status for UI (derived from backend status)
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Queue message for offline sending
export interface QueuedMessage {
    id: string;
    content: string;
    receiverId: string;
    conversationId?: string;
    messageType?: 'text' | 'image' | 'video' | 'file' | 'system';
    attachmentUrl?: string;
    attachmentType?: string;
    fileName?: string;
    replyToId?: string;
    timestamp: string;
    retryCount: number;
    maxRetries?: number;
}

// Enhanced event handler types with proper typing
export type MessageReceivedHandler = (data: {
    message: Message;
    conversationId: string;
}) => void;

export type MessageReadHandler = (data: {
    messageId: string;
    conversationId: string;
    readBy: string;
    readAt: string;
}) => void;

export type MessageDeliveredHandler = (data: {
    messageId: string;
    conversationId: string;
    deliveredAt: string;
}) => void;

export type UserOnlineHandler = (data: {
    userId: string;
    username: string;
    onlineAt: string;
}) => void;

export type UserOfflineHandler = (data: {
    userId: string;
    username: string;
    lastSeenAt: string;
}) => void;

export type TypingStartHandler = (data: {
    conversationId: string;
    userId: string;
    username: string;
}) => void;

export type TypingStopHandler = (data: {
    conversationId: string;
    userId: string;
    username: string;
}) => void;

export type ConversationUpdatedHandler = (data: {
    id: string;
    type: 'direct' | 'group';
    lastMessageContent?: string;
    lastMessageAt?: string;
    lastMessageSender?: string;
    participants: User[];
}) => void;

export type ConversationReadHandler = (data: {
    conversationId: string;
    readBy: string;
    readAt: string;
}) => void;

export type NotificationHandler = (data: {
    notification: Notification;
}) => void;

// 🔥 NEW: Notification-specific event handlers
export type NotificationReceivedHandler = (data: {
    notification: Notification;
}) => void;

export type NotificationCountUpdatedHandler = (data: {
    unreadCount: number;
}) => void;

export type ErrorHandler = (data: {
    message: string;
    code?: string;
}) => void;

export type ConnectionStateHandler = (state: SocketConnectionState) => void;

// Socket manager interface for better type safety
export interface SocketManagerInterface {
    // Connection management
    initialize(): Promise<void>;
    cleanup(): void;
    isConnected(): boolean;
    onConnectionStateChange(callback: ConnectionStateHandler): () => void;

    // Message operations
    sendMessage(
        content: string,
        receiverId: string,
        options?: {
            conversationId?: string;
            messageType?: 'text' | 'image' | 'video' | 'file' | 'system';
            attachmentUrl?: string;
            attachmentType?: string;
            fileName?: string;
            replyToId?: string;
        }
    ): Promise<{ success: boolean; messageId?: string; error?: string; conversationId?: string }>;

    markMessageRead(messageId: string, conversationId: string): void;
    markConversationRead(conversationId: string): void;

    // Typing indicators
    startTyping(conversationId: string, receiverId: string): void;
    stopTyping(conversationId: string, receiverId: string): void;

    // Conversation management
    joinConversation(conversationId: string): void;
    leaveConversation(conversationId: string): void;
    createConversation(participantId: string): Promise<Conversation>;
    getConversations(): Promise<Conversation[]>;
    getMessages(conversationId: string): Promise<{ messages: Message[] }>;

    // User status
    updateStatus(isOnline: boolean): void;

    // 🔥 NEW: Notification operations
    getNotifications(page?: number, limit?: number): Promise<{
        success: boolean;
        notifications?: Notification[];
        unreadCount?: number;
        pagination?: any;
        error?: string;
    }>;
    markNotificationRead(notificationId: string): Promise<{
        success: boolean;
        unreadCount?: number;
        error?: string;
    }>;
    markAllNotificationsRead(): Promise<{
        success: boolean;
        unreadCount?: number;
        error?: string;
    }>;
    deleteNotification(notificationId: string): Promise<{
        success: boolean;
        unreadCount?: number;
        error?: string;
    }>;
    getNotificationSettings(): Promise<{
        success: boolean;
        settings?: NotificationSettings;
        error?: string;
    }>;
    updateNotificationSettings(settings: NotificationSettings): Promise<{
        success: boolean;
        settings?: NotificationSettings;
        error?: string;
    }>;

    // Event listeners
    on<K extends keyof ServerToClientEvents>(
        event: K,
        handler: ServerToClientEvents[K]
    ): void;

    off<K extends keyof ServerToClientEvents>(
        event: K,
        handler: ServerToClientEvents[K]
    ): void;
}

// Real-time message hook interface
export interface RealTimeMessageHandlers {
    onMessageReceived: MessageReceivedHandler;
    onMessageRead: MessageReadHandler;
    onMessageDelivered: MessageDeliveredHandler;
    onUserOnline: UserOnlineHandler;
    onUserOffline: UserOfflineHandler;
    onTypingStart: TypingStartHandler;
    onTypingStop: TypingStopHandler;
    onConversationUpdated: ConversationUpdatedHandler;
    onNotification: NotificationHandler;
    // 🔥 NEW: Enhanced notification handlers
    onNotificationReceived?: NotificationReceivedHandler;
    onNotificationCountUpdated?: NotificationCountUpdatedHandler;
}

// Hook return interface
export interface RealTimeMessageHook {
    // Message operations
    sendMessage: (
        content: string,
        receiverId: string,
        options?: {
            conversationId?: string;
            messageType?: 'text' | 'image' | 'video' | 'file' | 'system';
            attachmentUrl?: string;
            attachmentType?: string;
            fileName?: string;
            replyToId?: string;
        }
    ) => Promise<{ success: boolean; messageId?: string; error?: string }>;

    // Read operations
    markMessageRead: (messageId: string, conversationId: string) => void;
    markConversationRead: (conversationId: string) => void;

    // Typing operations
    startTyping: (conversationId: string, receiverId: string) => void;
    stopTyping: (conversationId: string, receiverId: string) => void;

    // Conversation operations
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;

    // Status checks
    isUserOnline: (userId: string) => boolean;
    getConnectionState: () => SocketConnectionState;
}

// Message validation utilities
export interface MessageValidation {
    isValidContent: (content: string, messageType: Message['messageType']) => boolean;
    isValidAttachment: (attachmentUrl: string, attachmentType: string) => boolean;
    isValidMessageType: (messageType: string) => messageType is Message['messageType'];
    maxContentLength: number;
    maxFileSize: number;
    allowedFileTypes: string[];
}

// Conversation utilities
export interface ConversationUtils {
    getConversationName: (conversation: Conversation, currentUserId: string) => string;
    getConversationAvatar: (conversation: Conversation, currentUserId: string) => string;
    getOtherParticipants: (conversation: Conversation, currentUserId: string) => User[];
    isDirectConversation: (conversation: Conversation) => boolean;
    isGroupConversation: (conversation: Conversation) => boolean;
    getParticipantCount: (conversation: Conversation) => number;
    getOnlineParticipantCount: (conversation: Conversation, onlineUsers: Set<string>) => number;
}

// Error types for better error handling
export enum SocketErrorCodes {
    AUTHENTICATION_FAILED = 'AUTH_FAILED',
    MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
    CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    INVALID_MESSAGE_TYPE = 'INVALID_MESSAGE_TYPE',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',
    UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    INVALID_CONVERSATION_TYPE = 'INVALID_CONVERSATION_TYPE',
}

export interface SocketError {
    code: SocketErrorCodes;
    message: string;
    details?: any;
}

// Pagination for message loading
export interface MessagePagination {
    page: number;
    limit: number;
    totalCount: number;
    hasMore: boolean;
}

export interface PaginatedMessagesResponse {
    messages: Message[];
    pagination: MessagePagination;
}

// Default values for easier usage
export const DEFAULT_MESSAGE_VALIDATION: MessageValidation = {
    isValidContent: (content: string, messageType: Message['messageType']) => {
        if (messageType === 'text' || messageType === 'system') {
            return content.trim().length > 0 && content.length <= 4000;
        }
        return true; // For media messages, content can be empty
    },
    isValidAttachment: (attachmentUrl: string, attachmentType: string) => {
        return attachmentUrl.length > 0 && attachmentType.length > 0;
    },
    isValidMessageType: (messageType: string): messageType is Message['messageType'] => {
        return ['text', 'image', 'video', 'file', 'system'].includes(messageType);
    },
    maxContentLength: 4000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt'],
};

export const DEFAULT_PAGINATION = {
    limit: 50,
    page: 1,
};

// Socket event names as constants for consistency
export const SOCKET_EVENTS = {
    // Server to Client
    MESSAGE_RECEIVED: 'message_received',
    MESSAGE_READ: 'message_read',
    MESSAGE_DELIVERED: 'message_delivered',
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    CONVERSATION_UPDATED: 'conversation_updated',
    CONVERSATION_READ: 'conversation_read',
    NOTIFICATION: 'notification',
    NOTIFICATION_RECEIVED: 'notification_received', // 🔥 NEW
    NOTIFICATION_COUNT_UPDATED: 'notification_count_updated', // 🔥 NEW
    ERROR: 'error',
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',

    // Client to Server
    SEND_MESSAGE: 'send_message',
    MARK_MESSAGE_READ: 'mark_message_read',
    MARK_CONVERSATION_READ: 'mark_conversation_read',
    TYPING_START_SEND: 'typing_start',
    TYPING_STOP_SEND: 'typing_stop',
    JOIN_CONVERSATION: 'join_conversation',
    LEAVE_CONVERSATION: 'leave_conversation',
    UPDATE_STATUS: 'update_status',
    // 🔥 NEW: Notification events
    GET_NOTIFICATIONS: 'get_notifications',
    MARK_NOTIFICATION_READ: 'mark_notification_read',
    MARK_ALL_NOTIFICATIONS_READ: 'mark_all_notifications_read',
    DELETE_NOTIFICATION: 'delete_notification',
    GET_NOTIFICATION_SETTINGS: 'get_notification_settings',
    UPDATE_NOTIFICATION_SETTINGS: 'update_notification_settings',
} as const;