import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketClient } from './socketClient';
import apiClient from '../api/client';
import {
    QueuedMessage,
    Message,
    Conversation,
    TypingUser,
    Notification,
    NotificationSettings,
    MessageReceivedHandler,
    MessageReadHandler,
    MessageDeliveredHandler,
    UserOnlineHandler,
    UserOfflineHandler,
    TypingStartHandler,
    TypingStopHandler,
    NotificationHandler,
    NotificationReceivedHandler,
    NotificationCountUpdatedHandler,
    ConversationUpdatedHandler,
    ErrorHandler,
} from './socketEvents';
import { ConnectionStatus, connectionStateManager } from '@/types/messaging';

const QUEUED_MESSAGES_KEY = '@queued_messages';
const MAX_RETRY_ATTEMPTS = 3;
const TYPING_TIMEOUT = 3000; // 3 seconds

class SocketManager {
    private messageQueue: QueuedMessage[] = [];
    private typingTimers: Map<string, NodeJS.Timeout | number> = new Map();
    private onlineUsers: Set<string> = new Set();
    private typingUsers: Map<string, TypingUser[]> = new Map();
    private isInitialized: boolean = false;

    // Event handlers storage - UPDATED with notification handlers
    private eventHandlers: {
        messageReceived: Set<MessageReceivedHandler>;
        messageRead: Set<MessageReadHandler>;
        messageDelivered: Set<MessageDeliveredHandler>;
        userOnline: Set<UserOnlineHandler>;
        userOffline: Set<UserOfflineHandler>;
        typingStart: Set<TypingStartHandler>;
        typingStop: Set<TypingStopHandler>;
        notification: Set<NotificationHandler>;
        notificationReceived: Set<NotificationReceivedHandler>; // 🔥 NEW
        notificationCountUpdated: Set<NotificationCountUpdatedHandler>; // 🔥 NEW
        conversationUpdated: Set<ConversationUpdatedHandler>;
        error: Set<ErrorHandler>;
    } = {
        messageReceived: new Set(),
        messageRead: new Set(),
        messageDelivered: new Set(),
        userOnline: new Set(),
        userOffline: new Set(),
        typingStart: new Set(),
        typingStop: new Set(),
        notification: new Set(),
        notificationReceived: new Set(), // 🔥 NEW
        notificationCountUpdated: new Set(), // 🔥 NEW
        conversationUpdated: new Set(),
        error: new Set(),
    };

    constructor() {
        this.loadQueuedMessages();
        this.setupConnectionListener();
    }

    // Setup connection state listener
    private setupConnectionListener(): void {
        connectionStateManager.subscribe((status: ConnectionStatus) => {
            if (status.isConnected) {
                this.processMessageQueue();
            }
        });
    }

    // Initialize the socket manager
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('[SocketManager] Already initialized, skipping');
            return;
        }
        console.log('[SocketManager] Initializing...');
        this.isInitialized = true;
        await socketClient.connect();
        this.setupSocketEventListeners();
        await this.processMessageQueue();
    }

    // Cleanup
    public cleanup(): void {
        console.log('[SocketManager] Cleaning up...');
        this.clearAllTypingTimers();
        this.isInitialized = false;
        socketClient.cleanup();

        // Clear state
        this.onlineUsers.clear();
        this.typingUsers.clear();
        this.messageQueue = [];
    }

    // Connection management - now uses centralized state
    public getConnectionStatus(): ConnectionStatus {
        return connectionStateManager.getStatus();
    }

    public isConnected(): boolean {
        return connectionStateManager.getStatus().isConnected;
    }

    // Subscribe to connection state changes
    public onConnectionStateChange(callback: (status: ConnectionStatus) => void): () => void {
        return connectionStateManager.subscribe(callback);
    }

    // Message operations
    public async sendMessage(
        content: string,
        receiverId: string,
        options: {
            conversationId?: string;
            messageType?: 'text' | 'image' | 'video' | 'file' | 'system';
            attachmentUrl?: string;
            attachmentType?: string;
            fileName?: string;
            replyToId?: string;
        } = {}
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const messageData = {
            content,
            receiverId,
            ...options,
        };

        console.log('[SocketManager] Sending message:', messageData);

        if (!this.isConnected()) {
            console.log('[SocketManager] Not connected, queueing message');
            const queuedMessage: QueuedMessage = {
                id: `queued_${Date.now()}_${Math.random()}`,
                ...messageData,
                timestamp: new Date().toISOString(),
                retryCount: 0,
            };

            await this.queueMessage(queuedMessage);
            return { success: false, error: 'Offline - message queued' };
        }

        return new Promise((resolve) => {
            socketClient.sendMessage(messageData, (response) => {
                console.log('[SocketManager] Send message response:', response);
                resolve(response);
            });
        });
    }

    // Message queue management
    private async queueMessage(message: QueuedMessage): Promise<void> {
        this.messageQueue.push(message);
        await this.saveQueuedMessages();
    }

    private async loadQueuedMessages(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(QUEUED_MESSAGES_KEY);
            if (stored) {
                this.messageQueue = JSON.parse(stored);
            }
        } catch (error) {
            console.error('[SocketManager] Failed to load queued messages:', error);
        }
    }

    private async saveQueuedMessages(): Promise<void> {
        try {
            await AsyncStorage.setItem(QUEUED_MESSAGES_KEY, JSON.stringify(this.messageQueue));
        } catch (error) {
            console.error('[SocketManager] Failed to save queued messages:', error);
        }
    }

    private async processMessageQueue(): Promise<void> {
        if (!this.isConnected() || this.messageQueue.length === 0) {
            return;
        }

        console.log('[SocketManager] Processing message queue:', this.messageQueue.length, 'messages');

        const messagesToProcess = [...this.messageQueue];
        this.messageQueue = [];

        for (const queuedMessage of messagesToProcess) {
            try {
                const { id, timestamp, retryCount, ...messageData } = queuedMessage;

                const result = await this.sendMessage(
                    messageData.content,
                    messageData.receiverId,
                    {
                        conversationId: messageData.conversationId,
                        messageType: messageData.messageType,
                        attachmentUrl: messageData.attachmentUrl,
                        attachmentType: messageData.attachmentType,
                        fileName: messageData.fileName,
                        replyToId: messageData.replyToId,
                    }
                );

                if (!result.success && queuedMessage.retryCount < MAX_RETRY_ATTEMPTS) {
                    await this.queueMessage({
                        ...queuedMessage,
                        retryCount: queuedMessage.retryCount + 1,
                    });
                }
            } catch (error) {
                console.error('[SocketManager] Failed to process queued message:', error);
            }
        }

        await this.saveQueuedMessages();
    }

    // Read receipts
    public markMessageRead(messageId: string, conversationId: string): void {
        console.log('[SocketManager] Marking message read:', messageId);
        socketClient.markMessageRead({ messageId, conversationId });
    }

    public markConversationRead(conversationId: string): void {
        console.log('[SocketManager] Marking conversation read:', conversationId);
        socketClient.markConversationRead({ conversationId });
    }

    // Typing indicators
    public startTyping(conversationId: string, receiverId: string): void {
        console.log('[SocketManager] Starting typing:', conversationId);
        socketClient.startTyping({ conversationId, receiverId });

        // Clear existing timer
        const timerId = this.typingTimers.get(conversationId);
        if (timerId) {
            clearTimeout(timerId as NodeJS.Timeout);
        }

        // Set auto-stop timer
        const newTimerId = setTimeout(() => {
            this.stopTyping(conversationId, receiverId);
        }, TYPING_TIMEOUT);

        this.typingTimers.set(conversationId, newTimerId);
    }

    public stopTyping(conversationId: string, receiverId: string): void {
        console.log('[SocketManager] Stopping typing:', conversationId);
        socketClient.stopTyping({ conversationId, receiverId });

        // Clear timer
        const timerId = this.typingTimers.get(conversationId);
        if (timerId) {
            clearTimeout(timerId as NodeJS.Timeout);
            this.typingTimers.delete(conversationId);
        }
    }

    private clearAllTypingTimers(): void {
        this.typingTimers.forEach((timer) => clearTimeout(timer as NodeJS.Timeout));
        this.typingTimers.clear();
    }

    // Conversation management
    public joinConversation(conversationId: string): void {
        console.log('[SocketManager] Joining conversation:', conversationId);
        socketClient.joinConversation({ conversationId });
    }

    public leaveConversation(conversationId: string): void {
        console.log('[SocketManager] Leaving conversation:', conversationId);
        socketClient.leaveConversation({ conversationId });
    }

    // Online status
    public updateStatus(isOnline: boolean): void {
        console.log('[SocketManager] Updating status:', isOnline);
        socketClient.updateStatus({ isOnline });
    }

    public isUserOnline(userId: string): boolean {
        const online = this.onlineUsers.has(userId);
        console.log('[SocketManager] Checking user online status:', userId, online);
        return online;
    }

    public getTypingUsers(conversationId: string): TypingUser[] {
        return this.typingUsers.get(conversationId) || [];
    }

    // 🔥 NEW: Notification operations
    public async getNotifications(page: number = 1, limit: number = 20): Promise<{
        success: boolean;
        notifications?: Notification[];
        unreadCount?: number;
        pagination?: any;
        error?: string;
    }> {
        if (!this.isConnected()) {
            return { success: false, error: 'Not connected' };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Request timeout' });
            }, 10000);

            socketClient.getSocket()?.emit('get_notifications', { page, limit }, (response: any) => {
                clearTimeout(timeout);
                console.log('[SocketManager] Get notifications response:', response);
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    public async markNotificationRead(notificationId: string): Promise<{
        success: boolean;
        unreadCount?: number;
        error?: string;
    }> {
        if (!this.isConnected()) {
            return { success: false, error: 'Not connected' };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Request timeout' });
            }, 5000);

            socketClient.getSocket()?.emit('mark_notification_read', { notificationId }, (response: any) => {
                clearTimeout(timeout);
                console.log('[SocketManager] Mark notification read response:', response);
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    public async markAllNotificationsRead(): Promise<{
        success: boolean;
        unreadCount?: number;
        error?: string;
    }> {
        if (!this.isConnected()) {
            return { success: false, error: 'Not connected' };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Request timeout' });
            }, 5000);

            socketClient.getSocket()?.emit('mark_all_notifications_read', {}, (response: any) => {
                clearTimeout(timeout);
                console.log('[SocketManager] Mark all notifications read response:', response);
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    public async deleteNotification(notificationId: string): Promise<{
        success: boolean;
        unreadCount?: number;
        error?: string;
    }> {
        if (!this.isConnected()) {
            return { success: false, error: 'Not connected' };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Request timeout' });
            }, 5000);

            socketClient.getSocket()?.emit('delete_notification', { notificationId }, (response: any) => {
                clearTimeout(timeout);
                console.log('[SocketManager] Delete notification response:', response);
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    public async getNotificationSettings(): Promise<{
        success: boolean;
        settings?: NotificationSettings;
        error?: string;
    }> {
        if (!this.isConnected()) {
            return { success: false, error: 'Not connected' };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Request timeout' });
            }, 5000);

            socketClient.getSocket()?.emit('get_notification_settings', {}, (response: any) => {
                clearTimeout(timeout);
                console.log('[SocketManager] Get notification settings response:', response);
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    public async updateNotificationSettings(settings: NotificationSettings): Promise<{
        success: boolean;
        settings?: NotificationSettings;
        error?: string;
    }> {
        if (!this.isConnected()) {
            return { success: false, error: 'Not connected' };
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ success: false, error: 'Request timeout' });
            }, 5000);

            socketClient.getSocket()?.emit('update_notification_settings', { settings }, (response: any) => {
                clearTimeout(timeout);
                console.log('[SocketManager] Update notification settings response:', response);
                resolve(response || { success: false, error: 'No response' });
            });
        });
    }

    // REST API integration
    public async getConversations(): Promise<Conversation[]> {
        try {
            console.log('[SocketManager] Fetching conversations from API...');
            const response = await apiClient.get('/conversations');
            const conversations = response.data.conversations || [];
            console.log('[SocketManager] Got conversations from API:', conversations.length);
            return conversations;
        } catch (error) {
            console.error('[SocketManager] Failed to fetch conversations:', error);
            return [];
        }
    }

    public async getMessages(conversationId: string, page = 1, limit = 50): Promise<{
        messages: Message[];
        pagination: {
            totalItems: number;
            totalPages: number;
            currentPage: number;
            limit: number;
        };
    }> {
        try {
            console.log('[SocketManager] Fetching messages from API for conversation:', conversationId);
            const response = await apiClient.get('/messages', {
                params: { conversationId, page, limit },
            });
            const result = {
                messages: response.data.messages || [],
                pagination: response.data.pagination || {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: 1,
                    limit,
                },
            };
            console.log('[SocketManager] Got messages from API:', result.messages.length);
            return result;
        } catch (error) {
            console.error('[SocketManager] Failed to fetch messages:', error);
            return {
                messages: [],
                pagination: { totalItems: 0, totalPages: 0, currentPage: 1, limit },
            };
        }
    }

    public async createConversation(participantId: string): Promise<Conversation | null> {
        try {
            console.log('[SocketManager] Creating conversation with participant:', participantId);
            const response = await apiClient.post('/conversations', { participantId });
            const conversation = response.data.conversation;
            console.log('[SocketManager] Created conversation:', conversation?.id);
            return conversation;
        } catch (error) {
            console.error('[SocketManager] Failed to create conversation:', error);
            return null;
        }
    }

    // Event listeners setup - UPDATED with notification events
    private setupSocketEventListeners(): void {
        console.log('[SocketManager] Setting up socket event listeners...');

        // Message events
        socketClient.on('message_received', (data) => {
            console.log('[SocketManager] Received message_received event:', data);
            this.eventHandlers.messageReceived.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in message received handler:', error);
                }
            });
        });

        socketClient.on('message_read', (data) => {
            console.log('[SocketManager] Received message_read event:', data);
            this.eventHandlers.messageRead.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in message read handler:', error);
                }
            });
        });

        socketClient.on('message_delivered', (data) => {
            console.log('[SocketManager] Received message_delivered event:', data);
            this.eventHandlers.messageDelivered.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in message delivered handler:', error);
                }
            });
        });

        // User status events
        socketClient.on('user_online', (data) => {
            console.log('[SocketManager] Received user_online event:', data);
            this.onlineUsers.add(data.userId);
            this.eventHandlers.userOnline.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in user online handler:', error);
                }
            });
        });

        socketClient.on('user_offline', (data) => {
            console.log('[SocketManager] Received user_offline event:', data);
            this.onlineUsers.delete(data.userId);
            this.eventHandlers.userOffline.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in user offline handler:', error);
                }
            });
        });

        // Typing events
        socketClient.on('typing_start', (data) => {
            console.log('[SocketManager] Received typing_start event:', data);
            const users = this.typingUsers.get(data.conversationId) || [];
            const exists = users.find(u => u.userId === data.userId);
            if (!exists) {
                users.push({
                    userId: data.userId,
                    username: data.username,
                    conversationId: data.conversationId,
                });
                this.typingUsers.set(data.conversationId, users);
            }

            this.eventHandlers.typingStart.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in typing start handler:', error);
                }
            });
        });

        socketClient.on('typing_stop', (data) => {
            console.log('[SocketManager] Received typing_stop event:', data);
            const users = this.typingUsers.get(data.conversationId) || [];
            const filtered = users.filter(u => u.userId !== data.userId);
            this.typingUsers.set(data.conversationId, filtered);

            this.eventHandlers.typingStop.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in typing stop handler:', error);
                }
            });
        });

        // 🔥 NEW: Enhanced notification events
        socketClient.on('notification_received', (data) => {
            console.log('🔔 [SocketManager] Received notification_received event:', {
                id: data.notification?.id,
                type: data.notification?.type,
                message: data.notification?.message?.substring(0, 50)
            });

            this.eventHandlers.notificationReceived.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('💥 [SocketManager] Error in notification received handler:', error);
                }
            });

            // Legacy support
            this.eventHandlers.notification.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('💥 [SocketManager] Error in legacy notification handler:', error);
                }
            });
        });

        socketClient.on('notification_count_updated', (data) => {
            console.log('📊 [SocketManager] Received notification_count_updated event:', data);
            this.eventHandlers.notificationCountUpdated.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('💥 [SocketManager] Error in notification count handler:', error);
                }
            });
        });

        // Enhanced error handling for all events
        socketClient.on('error', (data) => {
            console.error('💥 [SocketManager] Socket error:', data);
            this.eventHandlers.error.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('💥 [SocketManager] Error in error handler:', error);
                }
            });
        });

        // Legacy notification events (kept for backward compatibility)
        socketClient.on('notification', (data) => {
            console.log('[SocketManager] Received notification event:', data);
            this.eventHandlers.notification.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in notification handler:', error);
                }
            });
        });

        // Conversation events
        socketClient.on('conversation_updated', (data) => {
            console.log('[SocketManager] Received conversation_updated event:', data);
            this.eventHandlers.conversationUpdated.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in conversation updated handler:', error);
                }
            });
        });

        // Error events
        socketClient.on('error', (data) => {
            console.log('[SocketManager] Received error event:', data);
            this.eventHandlers.error.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[SocketManager] Error in error handler:', error);
                }
            });
        });

        console.log('[SocketManager] Socket event listeners setup complete');
    }

    // Event handler registration methods - UPDATED with notification handlers
    public onMessageReceived(handler: MessageReceivedHandler): () => void {
        this.eventHandlers.messageReceived.add(handler);
        return () => {
            this.eventHandlers.messageReceived.delete(handler);
        };
    }

    public onMessageRead(handler: MessageReadHandler): () => void {
        this.eventHandlers.messageRead.add(handler);
        return () => {
            this.eventHandlers.messageRead.delete(handler);
        };
    }

    public onMessageDelivered(handler: MessageDeliveredHandler): () => void {
        this.eventHandlers.messageDelivered.add(handler);
        return () => {
            this.eventHandlers.messageDelivered.delete(handler);
        };
    }

    public onUserOnline(handler: UserOnlineHandler): () => void {
        this.eventHandlers.userOnline.add(handler);
        return () => {
            this.eventHandlers.userOnline.delete(handler);
        };
    }

    public onUserOffline(handler: UserOfflineHandler): () => void {
        this.eventHandlers.userOffline.add(handler);
        return () => {
            this.eventHandlers.userOffline.delete(handler);
        };
    }

    public onTypingStart(handler: TypingStartHandler): () => void {
        this.eventHandlers.typingStart.add(handler);
        return () => {
            this.eventHandlers.typingStart.delete(handler);
        };
    }

    public onTypingStop(handler: TypingStopHandler): () => void {
        this.eventHandlers.typingStop.add(handler);
        return () => {
            this.eventHandlers.typingStop.delete(handler);
        };
    }

    // 🔥 NEW: Notification event handlers
    public onNotificationReceived(handler: NotificationReceivedHandler): () => void {
        this.eventHandlers.notificationReceived.add(handler);
        return () => {
            this.eventHandlers.notificationReceived.delete(handler);
        };
    }

    public onNotificationCountUpdated(handler: NotificationCountUpdatedHandler): () => void {
        this.eventHandlers.notificationCountUpdated.add(handler);
        return () => {
            this.eventHandlers.notificationCountUpdated.delete(handler);
        };
    }

    // Legacy notification handler (kept for backward compatibility)
    public onNotification(handler: NotificationHandler): () => void {
        this.eventHandlers.notification.add(handler);
        return () => {
            this.eventHandlers.notification.delete(handler);
        };
    }

    public onConversationUpdated(handler: ConversationUpdatedHandler): () => void {
        this.eventHandlers.conversationUpdated.add(handler);
        return () => {
            this.eventHandlers.conversationUpdated.delete(handler);
        };
    }

    public onError(handler: ErrorHandler): () => void {
        this.eventHandlers.error.add(handler);
        return () => {
            this.eventHandlers.error.delete(handler);
        };
    }
}

// Create singleton instance
export const socketManager = new SocketManager();
export default socketManager;