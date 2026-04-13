import type {
    Conversation as SocketConversation,
    Message as SocketMessage,
    User as SocketUser,
} from '@/lib/socket/socketEvents';

export type ConnectionState =
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'reconnecting'
    | 'error';

export interface ConnectionStatus {
    state: ConnectionState;
    isConnected: boolean;
    reconnectAttempts: number;
    lastConnectedAt?: string;
    error?: string;
}

type ConnectionListener = (status: ConnectionStatus) => void;

class ConnectionStateManager {
    private status: ConnectionStatus = {
        state: 'disconnected',
        isConnected: false,
        reconnectAttempts: 0,
    };

    private listeners = new Set<ConnectionListener>();

    getStatus(): ConnectionStatus {
        return this.status;
    }

    subscribe(listener: ConnectionListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    setState(state: ConnectionState, error?: string): void {
        const reconnectAttempts =
            state === 'reconnecting'
                ? this.status.reconnectAttempts + 1
                : state === 'connected'
                  ? 0
                  : this.status.reconnectAttempts;

        this.status = {
            state,
            isConnected: state === 'connected',
            reconnectAttempts,
            lastConnectedAt:
                state === 'connected'
                    ? new Date().toISOString()
                    : this.status.lastConnectedAt,
            error,
        };

        this.listeners.forEach((listener) => listener(this.status));
    }

    reset(): void {
        this.status = {
            state: 'disconnected',
            isConnected: false,
            reconnectAttempts: 0,
        };
        this.listeners.forEach((listener) => listener(this.status));
    }
}

export const connectionStateManager = new ConnectionStateManager();

export interface Participant extends SocketUser {
    avatar?: string;
}

export interface TypingUser {
    conversationId: string;
    userId: string;
    username: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
    id: string;
    content: string;
    messageType: SocketMessage['messageType'];
    attachmentUrl?: string;
    attachmentType?: string;
    fileName?: string;
    senderId: string;
    receiverId: string;
    conversationId: string;
    replyToId?: string;
    sender?: Participant;
    receiver?: Participant;
    replyTo?: Message | null;
    createdAt: string;
    updatedAt: string;
    timestamp: string;
    status: MessageStatus;
    isFromCurrentUser: boolean;
    isDeleted?: boolean;
}

export interface Conversation {
    id: string;
    type: SocketConversation['type'];
    name: string;
    title?: string;
    avatar?: string;
    imageUrl?: string;
    description?: string;
    participants: Participant[];
    lastMessage: string;
    lastMessageContent?: string;
    timestamp: string;
    unreadCount: number;
    isOnline: boolean;
    isMuted?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
    lastMessageId?: string;
    lastMessageAt?: string;
    lastMessageSender?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const MessageUtils = {
    formatTimestamp(timestamp?: string): string {
        if (!timestamp) {
            return 'now';
        }

        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return 'now';
        }

        const diffInMs = Date.now() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) return 'now';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInHours < 24) return `${diffInHours}h`;
        if (diffInDays < 7) return `${diffInDays}d`;

        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    },

    fromSocket(message: SocketMessage, currentUserId: string): Message {
        const status: MessageStatus = message.isRead
            ? 'read'
            : message.isDelivered
              ? 'delivered'
              : 'sent';

        return {
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            attachmentUrl: message.attachmentUrl,
            attachmentType: message.attachmentType,
            fileName: message.fileName,
            senderId: message.senderId,
            receiverId: message.receiverId,
            conversationId: message.conversationId,
            replyToId: message.replyToId,
            sender: message.sender,
            receiver: message.receiver,
            replyTo: message.replyTo
                ? MessageUtils.fromSocket(message.replyTo, currentUserId)
                : null,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            timestamp: MessageUtils.formatTimestamp(message.createdAt),
            status,
            isFromCurrentUser: message.senderId === currentUserId,
            isDeleted: message.isDeleted,
        };
    },
};

export const ConversationUtils = {
    getOtherParticipants(conversation: Conversation, currentUserId: string): Participant[] {
        return conversation.participants.filter(
            (participant) => participant.id !== currentUserId
        );
    },

    getConversationName(conversation: Conversation, currentUserId: string): string {
        if (conversation.type === 'group') {
            return conversation.name;
        }

        const other = ConversationUtils.getOtherParticipants(conversation, currentUserId)[0];
        return other?.username || conversation.name || 'Conversation';
    },

    getConversationAvatar(conversation: Conversation, currentUserId: string): string {
        if (conversation.type === 'group') {
            return conversation.avatar || conversation.participants[0]?.profilePhotoUrl || '';
        }

        const other = ConversationUtils.getOtherParticipants(conversation, currentUserId)[0];
        return other?.profilePhotoUrl || other?.avatar || conversation.avatar || '';
    },

    isDirectConversation(conversation: Conversation): boolean {
        return conversation.type === 'direct';
    },

    isGroupConversation(conversation: Conversation): boolean {
        return conversation.type === 'group';
    },

    getParticipantCount(conversation: Conversation): number {
        return conversation.participants.length;
    },

    getOnlineParticipantCount(
        conversation: Conversation,
        onlineUsers: Set<string>
    ): number {
        return conversation.participants.filter(
            (participant) => participant.isOnline || onlineUsers.has(participant.id)
        ).length;
    },

    getRecipientId(conversation: Conversation, currentUserId: string): string {
        return ConversationUtils.getOtherParticipants(conversation, currentUserId)[0]?.id || '';
    },

    fromSocket(
        conversation: SocketConversation,
        currentUserId: string,
        onlineUsers: Set<string> = new Set()
    ): Conversation {
        const participants = (conversation.participants || []).map((participant: SocketUser) => ({
            ...participant,
            avatar: participant.profilePhotoUrl,
        }));
        const otherParticipants = participants.filter(
            (participant) => participant.id !== currentUserId
        );
        const isOnline = otherParticipants.some(
            (participant) => participant.isOnline || onlineUsers.has(participant.id)
        );

        return {
            id: conversation.id,
            type: conversation.type,
            name:
                conversation.title ||
                (conversation.type === 'group'
                    ? 'Group Chat'
                    : otherParticipants[0]?.username || 'Conversation'),
            title: conversation.title,
            avatar:
                conversation.imageUrl ||
                otherParticipants[0]?.profilePhotoUrl ||
                '',
            imageUrl: conversation.imageUrl,
            description: conversation.description,
            participants,
            lastMessage:
                conversation.lastMessageContent || 'Start a conversation',
            lastMessageContent: conversation.lastMessageContent,
            timestamp: MessageUtils.formatTimestamp(conversation.lastMessageAt),
            unreadCount: 0,
            isOnline,
            lastMessageId: conversation.lastMessageId,
            lastMessageAt: conversation.lastMessageAt,
            lastMessageSender: conversation.lastMessageSender,
            isActive: conversation.isActive,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
        };
    },
};
