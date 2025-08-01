import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../api/config';
import { getTokens, tryRefreshTokens, clearAuthData } from "@/lib/auth/tokens";
import {
    ServerToClientEvents,
    ClientToServerEvents,
} from './socketEvents';
import { connectionStateManager } from '@/types/messaging';

class SocketClient {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private maxReconnectDelay = 30000; // Max 30 seconds
    private isIntentionalDisconnect = false;
    private reconnectTimer: NodeJS.Timeout | null = null;

    // 🔥 NEW: Auth error handling
    private authRetryAttempts = 0;
    private maxAuthRetryAttempts = 2; // Only try auth refresh twice
    private isHandlingAuthError = false;
    private onAuthFailure?: () => void; // Callback for complete auth failure

    constructor() {
        console.log('[SocketClient] Initializing socket client');
    }

    // 🔥 NEW: Set auth failure callback (usually logout function)
    public setAuthFailureCallback(callback: () => void): void {
        this.onAuthFailure = callback;
    }

    // Initialize socket connection
    public async connect(): Promise<void> {
        if (this.socket?.connected) {
            console.log('[SocketClient] Already connected');
            return;
        }

        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        try {
            connectionStateManager.setState('connecting');
            this.isIntentionalDisconnect = false;

            console.log('[SocketClient] Getting authentication tokens...');
            const tokens = await getTokens();
            if (!tokens?.accessToken) {
                throw new Error('No access token available');
            }

            console.log('[SocketClient] Creating socket connection to:', API_CONFIG.SOCKET_URL);

            // Disconnect existing socket if any
            if (this.socket) {
                this.socket.removeAllListeners();
                this.socket.disconnect();
                this.socket = null;
            }

            // Create socket instance
            this.socket = io(API_CONFIG.SOCKET_URL, {
                auth: {
                    token: tokens.accessToken,
                },
                transports: ['websocket'],
                timeout: 20000,
                forceNew: true,
                reconnection: false, // We handle reconnection manually
                autoConnect: false,
            });

            console.log('[SocketClient] Socket instance created, setting up event listeners...');
            this.setupEventListeners();

            console.log('[SocketClient] Attempting to connect...');
            this.socket.connect();

        } catch (error) {
            console.error('[SocketClient] Connection failed:', error);
            connectionStateManager.setState('error', error instanceof Error ? error.message : 'Connection failed');
            this.scheduleReconnect();
        }
    }

    // Disconnect socket
    public disconnect(): void {
        console.log('[SocketClient] Intentional disconnect');
        this.isIntentionalDisconnect = true;
        this.reconnectAttempts = 0;
        this.authRetryAttempts = 0; // 🔥 RESET auth retry attempts

        // Clear reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        connectionStateManager.setState('disconnected');
    }

    // Check if connected
    public isConnected(): boolean {
        const connected = this.socket?.connected ?? false;
        console.log('[SocketClient] Connection check:', connected);
        return connected;
    }

    // Get socket instance
    public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
        return this.socket;
    }

    // Setup event listeners
    private setupEventListeners(): void {
        if (!this.socket) {
            console.error('[SocketClient] Cannot setup listeners - no socket');
            return;
        }

        console.log('[SocketClient] Setting up event listeners');

        this.socket.on('connect', () => {
            console.log('[SocketClient] Connected successfully! Socket ID:', this.socket?.id);
            connectionStateManager.setState('connected');
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.authRetryAttempts = 0; // 🔥 RESET auth retry attempts on successful connection

            // Clear reconnect timer on successful connection
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[SocketClient] Disconnected. Reason:', reason);
            connectionStateManager.setState('disconnected');

            // Only attempt reconnection if not intentional and not due to client disconnect
            if (!this.isIntentionalDisconnect && reason !== 'io client disconnect') {
                console.log('[SocketClient] Unintentional disconnect, will attempt reconnection');
                this.scheduleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('[SocketClient] Connection error:', error.message);

            // Check if it's an authentication error
            if (this.isAuthenticationError(error)) {
                console.log('[SocketClient] Authentication error detected');
                connectionStateManager.setState('error', 'Authentication failed');
                this.handleAuthError();
            } else {
                connectionStateManager.setState('error', error.message);
                this.scheduleReconnect();
            }
        });

        this.socket.on('error', (error: any) => {
            console.error('[SocketClient] Socket error:', error);

            if (this.isAuthenticationError(error)) {
                console.log('[SocketClient] Socket authentication error, handling...');
                connectionStateManager.setState('error', 'Authentication failed');
                this.handleAuthError();
            }
        });

        // Add debug logging for all events
        this.socket.onAny((event, ...args) => {
            console.log(`[SocketClient] Received event: ${event}`, args);
        });

        this.socket.onAnyOutgoing((event, ...args) => {
            console.log(`[SocketClient] Sending event: ${event}`, args);
        });
    }

    // 🔥 NEW: Check if error is authentication related
    private isAuthenticationError(error: any): boolean {
        const message = error.message || error.toString();
        return message.includes('Authentication') ||
            message.includes('token') ||
            message.includes('Unauthorized') ||
            message.includes('Invalid token') ||
            message.includes('Token expired') ||
            message.includes('auth');
    }

    // 🔥 IMPROVED: Handle authentication errors with retry limit and complete logout
    private async handleAuthError(): Promise<void> {
        // Prevent multiple concurrent auth error handling
        if (this.isHandlingAuthError) {
            console.log('[SocketClient] Auth error already being handled, skipping...');
            return;
        }

        // Check retry limit
        if (this.authRetryAttempts >= this.maxAuthRetryAttempts) {
            console.log('[SocketClient] Max auth retry attempts reached, logging out user');
            await this.handleCompleteAuthFailure();
            return;
        }

        this.isHandlingAuthError = true;
        this.authRetryAttempts++;

        console.log(`[SocketClient] Handling authentication error (attempt ${this.authRetryAttempts}/${this.maxAuthRetryAttempts})...`);

        try {
            // Try to refresh tokens
            const refreshSuccess = await tryRefreshTokens();

            if (refreshSuccess) {
                console.log('[SocketClient] Token refresh successful, reconnecting...');

                // Get the fresh tokens
                const tokens = await getTokens();
                if (tokens?.accessToken && this.socket) {
                    console.log('[SocketClient] Updating socket auth with fresh token');
                    this.socket.auth = { token: tokens.accessToken };
                    this.socket.connect();
                } else {
                    console.error('[SocketClient] No fresh token available after refresh');
                    await this.handleCompleteAuthFailure();
                }
            } else {
                console.error('[SocketClient] Token refresh failed');
                await this.handleCompleteAuthFailure();
            }
        } catch (error) {
            console.error('[SocketClient] Auth error handling failed:', error);
            await this.handleCompleteAuthFailure();
        } finally {
            this.isHandlingAuthError = false;
        }
    }

    // 🔥 NEW: Handle complete authentication failure (logout user)
    private async handleCompleteAuthFailure(): Promise<void> {
        console.log('[SocketClient] Complete authentication failure, logging out user...');

        try {
            // Clear all auth data
            await clearAuthData();

            // Disconnect socket
            this.disconnect();

            // Set error state
            connectionStateManager.setState('error', 'Authentication expired - please login again');

            // Call auth failure callback (usually logout)
            if (this.onAuthFailure) {
                console.log('[SocketClient] Calling auth failure callback');
                this.onAuthFailure();
            } else {
                console.warn('[SocketClient] No auth failure callback set - user may need to manually logout');
            }
        } catch (error) {
            console.error('[SocketClient] Error during complete auth failure handling:', error);
        }
    }

    // Schedule reconnection with exponential backoff
    private scheduleReconnect(): void {
        if (this.isIntentionalDisconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[SocketClient] Max reconnection attempts reached or intentional disconnect');
            connectionStateManager.setState('error', 'Maximum reconnection attempts reached');
            return;
        }

        // Clear existing timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectAttempts++;
        connectionStateManager.setState('reconnecting');

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        console.log(`[SocketClient] Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            if (!this.isIntentionalDisconnect) {
                console.log('[SocketClient] Attempting reconnection...');
                this.connect().then(r => {
                    //Ignore
                });
            }
        }, delay) as unknown as NodeJS.Timeout;
    }

    // Send message with callback and validation
    public sendMessage(
        data: Parameters<ClientToServerEvents['send_message']>[0],
        callback?: Parameters<ClientToServerEvents['send_message']>[1]
    ): void {
        console.log('[SocketClient] Attempting to send message:', data);

        if (!this.socket?.connected) {
            console.error('[SocketClient] Cannot send message - not connected');
            callback?.({ success: false, error: 'Not connected to server' });
            return;
        }

        if (!data.content?.trim() && !data.attachmentUrl) {
            console.error('[SocketClient] Cannot send message - no content');
            callback?.({ success: false, error: 'Message content required' });
            return;
        }

        if (!data.receiverId) {
            console.error('[SocketClient] Cannot send message - no receiver ID');
            callback?.({ success: false, error: 'Receiver ID required' });
            return;
        }

        console.log('[SocketClient] Sending message via socket...');
        this.socket.emit('send_message', data, (response) => {
            console.log('[SocketClient] Send message response:', response);
            callback?.(response);
        });
    }

    // Mark message as read
    public markMessageRead(data: Parameters<ClientToServerEvents['mark_message_read']>[0]): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot mark message read - not connected');
            return;
        }
        console.log('[SocketClient] Marking message as read:', data);
        this.socket.emit('mark_message_read', data);
    }

    // Mark conversation as read
    public markConversationRead(data: Parameters<ClientToServerEvents['mark_conversation_read']>[0]): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot mark conversation read - not connected');
            return;
        }
        console.log('[SocketClient] Marking conversation as read:', data);
        this.socket.emit('mark_conversation_read', data);
    }

    // Typing indicators
    public startTyping(data: Parameters<ClientToServerEvents['typing_start']>[0]): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot start typing - not connected');
            return;
        }
        console.log('[SocketClient] Starting typing:', data);
        this.socket.emit('typing_start', data);
    }

    public stopTyping(data: Parameters<ClientToServerEvents['typing_stop']>[0]): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot stop typing - not connected');
            return;
        }
        console.log('[SocketClient] Stopping typing:', data);
        this.socket.emit('typing_stop', data);
    }

    // Conversation management
    public joinConversation(data: Parameters<ClientToServerEvents['join_conversation']>[0]): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot join conversation - not connected');
            return;
        }
        console.log('[SocketClient] Joining conversation:', data);
        this.socket.emit('join_conversation', data);
    }

    public leaveConversation(data: Parameters<ClientToServerEvents['leave_conversation']>[0]): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot leave conversation - not connected');
            return;
        }
        console.log('[SocketClient] Leaving conversation:', data);
        this.socket.emit('leave_conversation', data);
    }

    // Update online status
    public updateStatus(data: Parameters<ClientToServerEvents['update_status']>[0]): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot update status - not connected');
            return;
        }
        console.log('[SocketClient] Updating status:', data);
        this.socket.emit('update_status', data);
    }

    // Notification operations
    public getNotifications(
        data: Parameters<ClientToServerEvents['get_notifications']>[0],
        callback?: Parameters<ClientToServerEvents['get_notifications']>[1]
    ): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot get notifications - not connected');
            callback?.({ success: false, error: 'Not connected to server' });
            return;
        }
        console.log('[SocketClient] Getting notifications:', data);
        this.socket.emit('get_notifications', data, (response) => {
            console.log('[SocketClient] Get notifications response:', response);
            callback?.(response);
        });
    }

    public markNotificationRead(
        data: Parameters<ClientToServerEvents['mark_notification_read']>[0],
        callback?: Parameters<ClientToServerEvents['mark_notification_read']>[1]
    ): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot mark notification read - not connected');
            callback?.({ success: false, error: 'Not connected to server' });
            return;
        }
        console.log('[SocketClient] Marking notification as read:', data);
        this.socket.emit('mark_notification_read', data, (response) => {
            console.log('[SocketClient] Mark notification read response:', response);
            callback?.(response);
        });
    }

    public markAllNotificationsRead(
        data: Parameters<ClientToServerEvents['mark_all_notifications_read']>[0],
        callback?: Parameters<ClientToServerEvents['mark_all_notifications_read']>[1]
    ): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot mark all notifications read - not connected');
            callback?.({ success: false, error: 'Not connected to server' });
            return;
        }
        console.log('[SocketClient] Marking all notifications as read:', data);
        this.socket.emit('mark_all_notifications_read', data, (response) => {
            console.log('[SocketClient] Mark all notifications read response:', response);
            callback?.(response);
        });
    }

    public deleteNotification(
        data: Parameters<ClientToServerEvents['delete_notification']>[0],
        callback?: Parameters<ClientToServerEvents['delete_notification']>[1]
    ): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot delete notification - not connected');
            callback?.({ success: false, error: 'Not connected to server' });
            return;
        }
        console.log('[SocketClient] Deleting notification:', data);
        this.socket.emit('delete_notification', data, (response) => {
            console.log('[SocketClient] Delete notification response:', response);
            callback?.(response);
        });
    }

    public getNotificationSettings(
        data: Parameters<ClientToServerEvents['get_notification_settings']>[0],
        callback?: Parameters<ClientToServerEvents['get_notification_settings']>[1]
    ): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot get notification settings - not connected');
            callback?.({ success: false, error: 'Not connected to server' });
            return;
        }
        console.log('[SocketClient] Getting notification settings:', data);
        this.socket.emit('get_notification_settings', data, (response) => {
            console.log('[SocketClient] Get notification settings response:', response);
            callback?.(response);
        });
    }

    public updateNotificationSettings(
        data: Parameters<ClientToServerEvents['update_notification_settings']>[0],
        callback?: Parameters<ClientToServerEvents['update_notification_settings']>[1]
    ): void {
        if (!this.socket?.connected) {
            console.log('[SocketClient] Cannot update notification settings - not connected');
            callback?.({ success: false, error: 'Not connected to server' });
            return;
        }
        console.log('[SocketClient] Updating notification settings:', data);
        this.socket.emit('update_notification_settings', data, (response) => {
            console.log('[SocketClient] Update notification settings response:', response);
            callback?.(response);
        });
    }

    // Event subscription helpers
    public on<K extends keyof ServerToClientEvents>(
        event: K,
        listener: ServerToClientEvents[K]
    ): void {
        if (this.socket) {
            this.socket.on(event, listener as any);
        } else {
            console.warn(`[SocketClient] Cannot register listener for ${event} - no socket`);
        }
    }

    public off<K extends keyof ServerToClientEvents>(
        event: K,
        listener?: ServerToClientEvents[K]
    ): void {
        if (listener) {
            this.socket?.off(event, listener as any);
        } else {
            this.socket?.off(event);
        }
    }

    // Cleanup
    public cleanup(): void {
        console.log('[SocketClient] Cleaning up socket client');
        this.disconnect();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        // Reset connection state
        connectionStateManager.reset();
    }
}

// Create singleton instance
export const socketClient = new SocketClient();
export default socketClient;