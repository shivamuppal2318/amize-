// hooks/useRealTimeMessages.ts - Updated with unified interfaces
import { useEffect, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socket/socketManager';
import { useMessages } from '@/context/MessageContext';
import {
    Message as SocketMessage,
    MessageReceivedHandler,
    MessageReadHandler,
    MessageDeliveredHandler,
    UserOnlineHandler,
    UserOfflineHandler,
    TypingStartHandler,
    TypingStopHandler,
    NotificationHandler
} from '@/lib/socket/socketEvents';
import {
    TypingUser,
    ConnectionStatus,
} from '@/types/messaging';

export interface UseRealTimeMessagesOptions {
    onMessageReceived?: (message: SocketMessage, conversationId: string) => void;
    onMessageRead?: (messageId: string, conversationId: string, readBy: string) => void;
    onMessageDelivered?: (messageId: string, conversationId: string) => void;
    onUserOnline?: (userId: string, username: string) => void;
    onUserOffline?: (userId: string, username: string) => void;
    onTypingStart?: (conversationId: string, userId: string, username: string) => void;
    onTypingStop?: (conversationId: string, userId: string, username: string) => void;
    onNotification?: (notification: any) => void;
}

export interface UseRealTimeMessagesReturn {
    sendMessage: (content: string, receiverId: string, options?: {
        conversationId?: string;
        messageType?: 'text' | 'image' | 'video' | 'file';
        attachmentUrl?: string;
        attachmentType?: string;
        fileName?: string;
        replyToId?: string;
    }) => Promise<{ success: boolean; messageId?: string; error?: string }>;
    markMessageRead: (messageId: string, conversationId: string) => void;
    markConversationRead: (conversationId: string) => void;
    startTyping: (conversationId: string, receiverId: string) => void;
    stopTyping: (conversationId: string, receiverId: string) => void;
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    isUserOnline: (userId: string) => boolean;
    getTypingUsers: (conversationId: string) => TypingUser[];
    refreshConversations: () => Promise<void>;
    refreshMessages: (conversationId: string) => Promise<void>;
    connectionStatus: ConnectionStatus; // Unified connection state
}

export const useRealTimeMessages = (
    options: UseRealTimeMessagesOptions = {}
): UseRealTimeMessagesReturn => {
    const {
        onMessageReceived,
        onMessageRead,
        onMessageDelivered,
        onUserOnline,
        onUserOffline,
        onTypingStart,
        onTypingStop,
        onNotification,
    } = options;

    const {
        updateMessageStatus,
        connectionStatus,
    } = useMessages();

    // Keep track of active typing timers
    const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const listenersRegistered = useRef(false);
    const unsubscribeFunctions = useRef<Array<() => void>>([]);

    // Enhanced event handlers with unified message transformation
    const handleMessageReceived = useCallback<MessageReceivedHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] MESSAGE_RECEIVED HANDLER CALLED:', data);

        const { message, conversationId } = data;

        try {
            // No need for manual transformation - let the context handle it
            // Just call the custom handler if provided
            onMessageReceived?.(message, conversationId);

            console.log('✅ [useRealTimeMessages] Message received handler completed');
        } catch (error) {
            console.error('❌ [useRealTimeMessages] Error processing received message:', error);
        }
    }, [onMessageReceived]);

    const handleTypingStart = useCallback<TypingStartHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] TYPING_START HANDLER CALLED:', data);
        const { conversationId, userId, username } = data;

        // Call custom handler if provided
        onTypingStart?.(conversationId, userId, username);
        console.log('✅ [useRealTimeMessages] Typing start processed');
    }, [onTypingStart]);

    const handleTypingStop = useCallback<TypingStopHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] TYPING_STOP HANDLER CALLED:', data);
        const { conversationId, userId, username } = data;

        // Call custom handler if provided
        onTypingStop?.(conversationId, userId, username);
        console.log('✅ [useRealTimeMessages] Typing stop processed');
    }, [onTypingStop]);

    const handleMessageRead = useCallback<MessageReadHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] MESSAGE_READ HANDLER CALLED:', data);
        const { messageId, conversationId, readBy } = data;

        updateMessageStatus(conversationId, messageId, 'read');
        onMessageRead?.(messageId, conversationId, readBy);
    }, [updateMessageStatus, onMessageRead]);

    const handleMessageDelivered = useCallback<MessageDeliveredHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] MESSAGE_DELIVERED HANDLER CALLED:', data);
        const { messageId, conversationId } = data;

        updateMessageStatus(conversationId, messageId, 'delivered');
        onMessageDelivered?.(messageId, conversationId);
    }, [updateMessageStatus, onMessageDelivered]);

    const handleUserOnline = useCallback<UserOnlineHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] USER_ONLINE HANDLER CALLED:', data);
        const { userId, username } = data;
        onUserOnline?.(userId, username);
    }, [onUserOnline]);

    const handleUserOffline = useCallback<UserOfflineHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] USER_OFFLINE HANDLER CALLED:', data);
        const { userId, username } = data;
        onUserOffline?.(userId, username);
    }, [onUserOffline]);

    const handleNotification = useCallback<NotificationHandler>((data) => {
        console.log('🔥 [useRealTimeMessages] NOTIFICATION HANDLER CALLED:', data);
        const { notification } = data;
        onNotification?.(notification);
    }, [onNotification]);

    // Simplified event listener setup
    useEffect(() => {
        console.log('🔧 [useRealTimeMessages] Setting up socketManager event listeners...');

        // Clean up any existing listeners first
        unsubscribeFunctions.current.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.error('[useRealTimeMessages] Error during unsubscribe:', error);
            }
        });
        unsubscribeFunctions.current = [];

        if (listenersRegistered.current) {
            console.log('⚠️ [useRealTimeMessages] Listeners already registered, skipping');
            return;
        }

        console.log('🔧 [useRealTimeMessages] Registering socketManager event handlers...');

        // Register all event handlers through socketManager
        const unsubscribers = [
            socketManager.onMessageReceived(handleMessageReceived),
            socketManager.onMessageRead(handleMessageRead),
            socketManager.onMessageDelivered(handleMessageDelivered),
            socketManager.onUserOnline(handleUserOnline),
            socketManager.onUserOffline(handleUserOffline),
            socketManager.onTypingStart(handleTypingStart),
            socketManager.onTypingStop(handleTypingStop),
            socketManager.onNotification(handleNotification),
        ];

        unsubscribeFunctions.current = unsubscribers;
        listenersRegistered.current = true;

        return () => {
            unsubscribers.forEach((unsubscribe, index) => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error(`❌ [useRealTimeMessages] Error unsubscribing handler ${index + 1}:`, error);
                }
            });
            listenersRegistered.current = false;
        };
    }, [
        handleMessageReceived,
        handleMessageRead,
        handleMessageDelivered,
        handleUserOnline,
        handleUserOffline,
        handleTypingStart,
        handleTypingStop,
        handleNotification,
    ]);

    // Monitor connection changes and re-register if needed - simplified
    useEffect(() => {
        const handleConnectionStatusChange = (status: ConnectionStatus) => {
            console.log('🔌 [useRealTimeMessages] Connection status changed:', status);
            if (status.isConnected && !listenersRegistered.current) {
                console.log('🔄 [useRealTimeMessages] Reconnected, will re-register listeners on next effect run');
                listenersRegistered.current = false;
            }
        };

        const unsubscribe = socketManager.onConnectionStateChange(handleConnectionStatusChange);

        return () => {
            unsubscribe();
        };
    }, []);

    // Cleanup typing timers on unmount
    useEffect(() => {
        return () => {
            typingTimers.current.forEach(timer => clearTimeout(timer));
            typingTimers.current.clear();

            // Clean up all listeners
            unsubscribeFunctions.current.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('[useRealTimeMessages] Error during cleanup:', error);
                }
            });
            unsubscribeFunctions.current = [];
            listenersRegistered.current = false;
        };
    }, []);

    // Send message
    const sendMessage = useCallback(async (
        content: string,
        receiverId: string,
        options: {
            conversationId?: string;
            messageType?: 'text' | 'image' | 'video' | 'file';
            attachmentUrl?: string;
            attachmentType?: string;
            fileName?: string;
            replyToId?: string;
        } = {}
    ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
        console.log('[useRealTimeMessages] Sending message:', { content, receiverId, options });
        return socketManager.sendMessage(content, receiverId, options);
    }, []);

    // Mark message as read
    const markMessageRead = useCallback((messageId: string, conversationId: string): void => {
        console.log('[useRealTimeMessages] Marking message as read:', messageId);
        socketManager.markMessageRead(messageId, conversationId);
    }, []);

    // Mark conversation as read
    const markConversationRead = useCallback((conversationId: string): void => {
        console.log('[useRealTimeMessages] Marking conversation as read:', conversationId);
        socketManager.markConversationRead(conversationId);
    }, []);

    // Start typing with auto-stop timer
    const startTyping = useCallback((conversationId: string, receiverId: string): void => {
        console.log('[useRealTimeMessages] Starting typing:', { conversationId, receiverId });

        // Clear existing timer
        const existingTimer = typingTimers.current.get(conversationId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Send typing start event
        socketManager.startTyping(conversationId, receiverId);

        // Set auto-stop timer
        const timer = setTimeout(() => {
            console.log('[useRealTimeMessages] Auto-stopping typing for:', conversationId);
            socketManager.stopTyping(conversationId, receiverId);
            typingTimers.current.delete(conversationId);
        }, 3000) as unknown as NodeJS.Timeout;

        typingTimers.current.set(conversationId, timer);
    }, []);

    // Stop typing
    const stopTyping = useCallback((conversationId: string, receiverId: string): void => {
        console.log('[useRealTimeMessages] Stopping typing:', { conversationId, receiverId });

        // Clear timer
        const timer = typingTimers.current.get(conversationId);
        if (timer) {
            clearTimeout(timer);
            typingTimers.current.delete(conversationId);
        }

        socketManager.stopTyping(conversationId, receiverId);
    }, []);

    // Join conversation
    const joinConversation = useCallback((conversationId: string): void => {
        console.log('[useRealTimeMessages] Joining conversation:', conversationId);
        socketManager.joinConversation(conversationId);
    }, []);

    // Leave conversation
    const leaveConversation = useCallback((conversationId: string): void => {
        console.log('[useRealTimeMessages] Leaving conversation:', conversationId);
        socketManager.leaveConversation(conversationId);
    }, []);

    // Check if user is online
    const isUserOnline = useCallback((userId: string): boolean => {
        return socketManager.isUserOnline(userId);
    }, []);

    // Get typing users for a conversation
    const getTypingUsers = useCallback((conversationId: string): TypingUser[] => {
        return socketManager.getTypingUsers(conversationId);
    }, []);

    // Refresh conversations from server - now using unified transformation
    const refreshConversations = useCallback(async (): Promise<void> => {
        try {
            console.log('[useRealTimeMessages] Refreshing conversations...');
            // Let the context handle the transformation - this is just for backward compatibility
            // The context's refreshConversations method will handle unified transformation
        } catch (error) {
            console.error('[useRealTimeMessages] Failed to refresh conversations:', error);
        }
    }, []);

    // Refresh messages for a conversation - simplified
    const refreshMessages = useCallback(async (conversationId: string): Promise<void> => {
        try {
            console.log('[useRealTimeMessages] Refreshing messages for:', conversationId);
            // Let the context handle the transformation - this is just for backward compatibility
            // The context's refreshMessages method will handle unified transformation
        } catch (error) {
            console.error('[useRealTimeMessages] Failed to refresh messages:', error);
        }
    }, []);

    return {
        sendMessage,
        markMessageRead,
        markConversationRead,
        startTyping,
        stopTyping,
        joinConversation,
        leaveConversation,
        isUserOnline,
        getTypingUsers,
        refreshConversations,
        refreshMessages,
        connectionStatus, // Return unified connection status
    };
};