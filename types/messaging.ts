// types/messaging.ts - Unified messaging types
export interface User {
    id: string;
    username: string;
    profilePhotoUrl?: string;
    isOnline?: boolean;
    lastSeenAt?: string;
}

// UNIFIED Message interface - no more dual fields
export interface Message {
    // Core message data
    id: string;
    content: string; // Single field for text content
    timestamp: string; // UI-formatted timestamp
    senderId: string;
    receiverId: string;
    conversationId: string;

    // Message metadata
    messageType: 'text' | 'image' | 'video' | 'file' | 'system';
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

    // Optional fields
    attachmentUrl?: string;
    attachmentType?: string;
    fileName?: string;
    replyToId?: string;

    // Backend timestamps (for sorting and processing)
    createdAt: string;
    updatedAt: string;

    // Status flags
    isDelivered: boolean;
    deliveredAt?: string;
    isRead: boolean;
    readAt?: string;
    isDeleted: boolean;
    deletedAt?: string;

    // UI helpers (computed properties)
    isFromCurrentUser: boolean; // Replaces sender/sender_type
    isFirstInGroup?: boolean;

    // Populated relations
    senderInfo?: User;
    receiverInfo?: User;
    replyTo?: Message & { senderInfo: User };
}

export interface Conversation {
    // Core conversation data
    id: string;
    name: string; // Display name for UI
    avatar: string; // Display avatar for UI
    type: 'direct' | 'group';

    // Last message info
    lastMessage: string; // Formatted preview
    lastMessageContent?: string; // Raw content
    lastMessageAt?: string;
    lastMessageSender?: string;

    // UI data
    timestamp: string; // Formatted timestamp
    unreadCount: number;
    isOnline: boolean; // Computed online status

    // Metadata
    title?: string;
    description?: string;
    imageUrl?: string;
    participants: User[];

    // Status flags
    isActive: boolean;
    isMuted?: boolean;
    isPinned?: boolean;

    // Backend timestamps
    createdAt: string;
    updatedAt: string;
}

// Connection state types
export type ConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'error';

export interface ConnectionStatus {
    state: ConnectionState;
    isConnected: boolean;
    lastConnectedAt?: string;
    reconnectAttempts: number;
    error?: string;
}

// Typing user interface
export interface TypingUser {
    userId: string;
    username: string;
    conversationId: string;
    startedAt?: string;
}

// Message transformation utilities
export class MessageUtils {
    static fromSocket(socketMessage: any, currentUserId: string): Message {
        return {
            id: socketMessage.id,
            content: socketMessage.content,
            timestamp: this.formatTimestamp(socketMessage.createdAt),
            senderId: socketMessage.senderId,
            receiverId: socketMessage.receiverId,
            conversationId: socketMessage.conversationId,

            messageType: socketMessage.messageType || 'text',
            status: this.getMessageStatus(socketMessage),

            attachmentUrl: socketMessage.attachmentUrl,
            attachmentType: socketMessage.attachmentType,
            fileName: socketMessage.fileName,
            replyToId: socketMessage.replyToId,

            createdAt: socketMessage.createdAt,
            updatedAt: socketMessage.updatedAt,

            isDelivered: socketMessage.isDelivered || false,
            deliveredAt: socketMessage.deliveredAt,
            isRead: socketMessage.isRead || false,
            readAt: socketMessage.readAt,
            isDeleted: socketMessage.isDeleted || false,
            deletedAt: socketMessage.deletedAt,

            isFromCurrentUser: socketMessage.senderId === currentUserId,

            senderInfo: socketMessage.sender,
            receiverInfo: socketMessage.receiver,
            replyTo: socketMessage.replyTo && socketMessage.replyTo.sender
                ? {
                    ...this.fromSocket(socketMessage.replyTo, currentUserId),
                    senderInfo: socketMessage.replyTo.sender
                }
                : undefined,
        };
    }

    static formatTimestamp(date?: string | Date | null): string {
        if (!date) return '';

        try {
            const messageDate = new Date(date);
            if (isNaN(messageDate.getTime())) return '';

            const now = new Date();
            const today = now.toDateString();

            if (messageDate.toDateString() === today) {
                return messageDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (messageDate.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            }

            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (messageDate > weekAgo) {
                return messageDate.toLocaleDateString([], { weekday: 'short' });
            }

            return messageDate.toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.warn('Error formatting timestamp:', error);
            return '';
        }
    }

    private static getMessageStatus(socketMessage: any): Message['status'] {
        if (socketMessage.isRead) return 'read';
        if (socketMessage.isDelivered) return 'delivered';
        return 'sent';
    }
}

export class ConversationUtils {
    static fromSocket(socketConv: any, currentUserId: string, onlineUsers: Set<string>): Conversation {
        const otherParticipants = socketConv.participants.filter((p: User) => p.id !== currentUserId);
        const primaryParticipant = otherParticipants[0];

        // Determine display name
        const name = socketConv.type === 'group'
            ? socketConv.title || `Group (${socketConv.participants.length})`
            : primaryParticipant?.username || 'Unknown User';

        // Determine display avatar
        const avatar = socketConv.type === 'group'
            ? socketConv.imageUrl || 'https://via.placeholder.com/40?text=G'
            : primaryParticipant?.profilePhotoUrl || 'https://via.placeholder.com/40';

        // Determine online status
        const isOnline = socketConv.type === 'direct'
            ? onlineUsers.has(primaryParticipant?.id || '')
            : otherParticipants.some((p: User) => onlineUsers.has(p.id));

        // Format last message preview
        const lastMessage = this.formatLastMessage(socketConv, currentUserId);

        return {
            id: socketConv.id,
            name,
            avatar,
            type: socketConv.type,

            lastMessage,
            lastMessageContent: socketConv.lastMessageContent,
            lastMessageAt: socketConv.lastMessageAt,
            lastMessageSender: socketConv.lastMessageSender,

            timestamp: MessageUtils.formatTimestamp(socketConv.lastMessageAt || socketConv.createdAt),
            unreadCount: socketConv.unreadCount || 0,
            isOnline,

            title: socketConv.title,
            description: socketConv.description,
            imageUrl: socketConv.imageUrl,
            participants: socketConv.participants.map((p: User) => ({
                ...p,
                isOnline: onlineUsers.has(p.id),
            })),

            isActive: socketConv.isActive !== false,
            isMuted: socketConv.isMuted || false,
            isPinned: socketConv.isPinned || false,

            createdAt: socketConv.createdAt,
            updatedAt: socketConv.updatedAt,
        };
    }

    private static formatLastMessage(socketConv: any, currentUserId: string): string {
        const lastMsg = socketConv.lastMessage || {};
        const content = lastMsg.content || socketConv.lastMessageContent;

        if (!content?.trim()) {
            return 'No messages yet';
        }

        // Handle different message types
        switch (lastMsg.messageType) {
            case 'image': return '📷 Photo';
            case 'video': return '🎥 Video';
            case 'file': return lastMsg.fileName ? `📄 ${lastMsg.fileName}` : '📄 File';
            case 'system': return content;
            default:
                // For group messages, add sender name
                if (socketConv.type === 'group' && socketConv.lastMessageSender !== currentUserId) {
                    const senderName = socketConv.participants
                        .find((p: User) => p.id === socketConv.lastMessageSender)?.username || 'Someone';
                    return `${senderName}: ${content}`;
                }
                return content;
        }
    }

    static getOtherParticipants(conversation: Conversation, currentUserId: string): User[] {
        return conversation.participants.filter(p => p.id !== currentUserId);
    }

    static getRecipientId(conversation: Conversation, currentUserId: string): string | null {
        const others = this.getOtherParticipants(conversation, currentUserId);
        return others[0]?.id || null;
    }
}

// Centralized Connection State Manager
export class ConnectionStateManager {
    private state: ConnectionState = 'disconnected';
    private listeners = new Set<(status: ConnectionStatus) => void>();
    private reconnectAttempts = 0;
    private lastConnectedAt?: string;
    private error?: string;

    getStatus(): ConnectionStatus {
        return {
            state: this.state,
            isConnected: this.state === 'connected',
            lastConnectedAt: this.lastConnectedAt,
            reconnectAttempts: this.reconnectAttempts,
            error: this.error,
        };
    }

    setState(newState: ConnectionState, error?: string) {
        if (this.state === newState && this.error === error) return;

        const previousState = this.state;
        this.state = newState;
        this.error = error;

        // Update metadata based on state changes
        if (newState === 'connected') {
            this.lastConnectedAt = new Date().toISOString();
            this.reconnectAttempts = 0;
            this.error = undefined;
        } else if (newState === 'reconnecting') {
            this.reconnectAttempts++;
        }

        console.log(`[ConnectionState] ${previousState} -> ${newState}`, {
            reconnectAttempts: this.reconnectAttempts,
            error
        });

        // Notify all listeners
        const status = this.getStatus();
        this.listeners.forEach(listener => {
            try {
                listener(status);
            } catch (err) {
                console.error('[ConnectionState] Error in listener:', err);
            }
        });
    }

    subscribe(listener: (status: ConnectionStatus) => void): () => void {
        this.listeners.add(listener);

        // Immediately notify with current status
        listener(this.getStatus());

        return () => {
            this.listeners.delete(listener);
        };
    }

    reset() {
        this.state = 'disconnected';
        this.reconnectAttempts = 0;
        this.lastConnectedAt = undefined;
        this.error = undefined;
    }
}

// Global connection state manager instance
export const connectionStateManager = new ConnectionStateManager();