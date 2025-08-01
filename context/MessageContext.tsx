// context/MessageContext.tsx - Updated with unified interfaces
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { socketManager } from '@/lib/socket/socketManager';
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages';
import {
    Message,
    Conversation,
    TypingUser,
    ConnectionStatus,
    MessageUtils,
    ConversationUtils,
    connectionStateManager
} from '@/types/messaging';
import { Message as SocketMessage, Conversation as SocketConversation } from '@/lib/socket/socketEvents';

// Enhanced logging utility
const log = (level: 'info' | 'error' | 'debug' | 'success', message: string, data?: any) => {
    const emoji = {
        info: 'ℹ️',
        error: '❌',
        debug: '🐛',
        success: '✅'
    };
    console.log(`${emoji[level]} [MessageContext] ${message}`, data || '');
};

// Context interface - simplified and cleaner
interface MessageContextType {
    // Core state
    conversations: Conversation[];
    messages: Record<string, Message[]>;
    typingUsers: Record<string, TypingUser[]>;
    onlineUsers: Set<string>;
    userLastSeen: Record<string, string>;
    connectionStatus: ConnectionStatus; // Unified connection state
    loading: boolean;
    error: string | null;

    // Message operations
    sendMessage: (conversationId: string, content: string, options?: {
        messageType?: 'text' | 'image' | 'video' | 'file';
        attachmentUrl?: string;
        attachmentType?: string;
        fileName?: string;
        replyToId?: string;
    }) => Promise<void>;

    // Read operations
    markAsRead: (conversationId: string) => Promise<void>;
    markMessageAsRead: (conversationId: string, messageId: string) => Promise<void>;

    // Message management
    deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
    editMessage: (conversationId: string, messageId: string, newContent: string) => Promise<void>;

    // Conversation operations
    getConversation: (id: string) => Conversation | undefined;
    createConversation: (participantId: string) => Promise<Conversation | null>;
    refreshConversations: () => Promise<void>;
    refreshMessages: (conversationId: string) => Promise<void>;

    // Conversation management
    muteConversation: (conversationId: string, duration?: number) => Promise<void>;
    pinConversation: (conversationId: string) => Promise<void>;
    archiveConversation: (conversationId: string) => Promise<void>;

    // Typing indicators
    startTyping: (conversationId: string, receiverId: string) => void;
    stopTyping: (conversationId: string, receiverId: string) => void;
    getTypingUsers: (conversationId: string) => TypingUser[];

    // Conversation state management
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;

    // Utility functions
    getUnreadCount: () => number;
    isUserOnline: (userId: string) => boolean;
    getUserLastSeen: (userId: string) => string | null;
    getConversationStatus: (conversationId: string) => 'online' | 'offline' | 'away';
    formatMessagePreview: (message: string, type?: string, senderName?: string) => string;

    // Internal functions for hooks (simplified)
    addMessage: (conversationId: string, message: Message) => void;
    updateMessageStatus: (conversationId: string, messageId: string, status: Message['status']) => void;
    addConversation: (conversation: Conversation) => void;
    updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
    setConversations: (conversations: Conversation[]) => void;
    setMessages: (messages: Record<string, Message[]>) => void;
}

// Create context with default values
const MessageContext = createContext<MessageContextType>({
    conversations: [],
    messages: {},
    typingUsers: {},
    onlineUsers: new Set(),
    userLastSeen: {},
    connectionStatus: { state: 'disconnected', isConnected: false, reconnectAttempts: 0 },
    loading: false,
    error: null,

    // Default implementations
    sendMessage: async () => {},
    markAsRead: async () => {},
    markMessageAsRead: async () => {},
    deleteMessage: async () => {},
    editMessage: async () => {},
    getConversation: () => undefined,
    createConversation: async () => null,
    refreshConversations: async () => {},
    refreshMessages: async () => {},
    muteConversation: async () => {},
    pinConversation: async () => {},
    archiveConversation: async () => {},
    startTyping: () => {},
    stopTyping: () => {},
    getTypingUsers: () => [],
    joinConversation: () => {},
    leaveConversation: () => {},
    getUnreadCount: () => 0,
    isUserOnline: () => false,
    getUserLastSeen: () => null,
    getConversationStatus: () => 'offline',
    formatMessagePreview: () => '',
    addMessage: () => {},
    updateMessageStatus: () => {},
    addConversation: () => {},
    updateConversation: () => {},
    setConversations: () => {},
    setMessages: () => {},
});

// Enhanced Provider component
export const MessageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    // Core state
    const [conversations, setConversationsState] = useState<Conversation[]>([]);
    const [messages, setMessagesState] = useState<Record<string, Message[]>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({});
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [userLastSeen, setUserLastSeen] = useState<Record<string, string>>({});
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
        connectionStateManager.getStatus()
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Auth context
    const { user, isAuthenticated } = useAuth();

    // Refs for tracking state
    const socketInitialized = useRef(false);

    // Subscribe to connection state changes
    useEffect(() => {
        const unsubscribe = connectionStateManager.subscribe((status) => {
            setConnectionStatus(status);
            log('info', 'Connection status updated', status);

            // Handle connection-based actions
            if (status.isConnected && isAuthenticated && user) {
                log('info', 'Connected! Refreshing conversations');
                refreshConversations().catch(error => {
                    log('error', 'Failed to refresh conversations on connect', error);
                });
            }

            // Update error state based on connection
            if (status.state === 'error' && status.error) {
                setError(status.error);
            } else if (status.isConnected) {
                setError(null);
            }
        });

        return unsubscribe;
    }, [isAuthenticated, user]);

    // Enhanced state management functions
    const addMessage = useCallback((conversationId: string, message: Message) => {
        log('success', 'Adding message to conversation', {
            conversationId,
            messageId: message.id,
            content: message.content?.substring(0, 50) + '...',
            isFromCurrentUser: message.isFromCurrentUser
        });

        setMessagesState(prevMessages => {
            const currentMessages = prevMessages[conversationId] || [];

            // Check for duplicates
            const existingMessage = currentMessages.find(m => m.id === message.id);
            if (existingMessage) {
                log('debug', 'Message already exists, skipping', { messageId: message.id });
                return prevMessages;
            }

            // Sort messages by creation timestamp
            const newMessages = [...currentMessages, message].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            return {
                ...prevMessages,
                [conversationId]: newMessages,
            };
        });
    }, []);

    const updateMessageStatus = useCallback((conversationId: string, messageId: string, status: Message['status']) => {
        log('info', 'Updating message status', { conversationId, messageId, status });

        setMessagesState(prevMessages => {
            const currentMessages = prevMessages[conversationId] || [];
            const messageExists = currentMessages.find(m => m.id === messageId);

            if (!messageExists) {
                log('error', 'Message not found for status update', { conversationId, messageId });
                return prevMessages;
            }

            return {
                ...prevMessages,
                [conversationId]: currentMessages.map(msg =>
                    msg.id === messageId ? { ...msg, status } : msg
                ),
            };
        });
    }, []);

    const addConversation = useCallback((conversation: Conversation) => {
        log('success', 'Adding conversation', { id: conversation.id, name: conversation.name });

        setConversationsState(prevConversations => {
            const exists = prevConversations.find(c => c.id === conversation.id);
            if (exists) {
                log('debug', 'Conversation already exists, updating', { id: conversation.id });
                return prevConversations.map(c =>
                    c.id === conversation.id ? { ...c, ...conversation } : c
                );
            }

            // Sort conversations by priority: pinned > unread > timestamp
            const newConversations = [conversation, ...prevConversations].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

                const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
                const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
                return bTime - aTime;
            });

            return newConversations;
        });
    }, []);

    const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
        log('info', 'Updating conversation', { conversationId, updates });

        setConversationsState(prevConversations => {
            const updatedConversations = prevConversations.map(conv => {
                if (conv.id === conversationId) {
                    return { ...conv, ...updates };
                }
                return conv;
            });

            // Re-sort after update
            return updatedConversations.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

                const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
                const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
                return bTime - aTime;
            });
        });
    }, []);

    const setConversations = useCallback((newConversations: Conversation[]) => {
        log('info', 'Setting conversations', { count: newConversations.length });

        const sortedConversations = [...newConversations].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

            const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
            return bTime - aTime;
        });

        setConversationsState(sortedConversations);
    }, []);

    const setMessages = useCallback((newMessages: Record<string, Message[]>) => {
        log('info', 'Setting messages', { conversationCount: Object.keys(newMessages).length });

        const sortedMessages: Record<string, Message[]> = {};
        Object.entries(newMessages).forEach(([convId, msgs]) => {
            sortedMessages[convId] = [...msgs].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        });

        setMessagesState(sortedMessages);
    }, []);

    // Enhanced utility functions
    const getUnreadCount = useCallback(() => {
        return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    }, [conversations]);

    const isUserOnline = useCallback((userId: string): boolean => {
        return onlineUsers.has(userId);
    }, [onlineUsers]);

    const getUserLastSeen = useCallback((userId: string): string | null => {
        return userLastSeen[userId] || null;
    }, [userLastSeen]);

    const getConversationStatus = useCallback((conversationId: string): 'online' | 'offline' | 'away' => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation || !conversation.participants) return 'offline';

        const otherParticipants = ConversationUtils.getOtherParticipants(conversation, user?.id || '');

        if (conversation.type === 'group') {
            const onlineCount = otherParticipants.filter(p => onlineUsers.has(p.id)).length;
            return onlineCount > 0 ? 'online' : 'offline';
        } else {
            const otherParticipant = otherParticipants[0];
            if (!otherParticipant) return 'offline';

            if (onlineUsers.has(otherParticipant.id)) return 'online';

            // Check if user was recently online (within 5 minutes)
            const lastSeen = userLastSeen[otherParticipant.id];
            if (lastSeen) {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                if (new Date(lastSeen) > fiveMinutesAgo) return 'away';
            }

            return 'offline';
        }
    }, [conversations, onlineUsers, userLastSeen, user?.id]);

    const formatMessagePreview = useCallback((message: string, type?: string, senderName?: string): string => {
        switch (type) {
            case 'image': return '📷 Photo';
            case 'video': return '🎥 Video';
            case 'file': return '📄 File';
            case 'system': return message || 'System message';
            default:
                if (!message || message.trim() === '') return 'No messages yet';
                const preview = message.trim();
                return senderName ? `${senderName}: ${preview}` : preview;
        }
    }, []);

    // Enhanced real-time message handlers using unified types
    const realTimeHandlers = useRealTimeMessages({
        onMessageReceived: useCallback((message: SocketMessage, conversationId: string) => {
            if (!user) {
                log('error', 'No user available for message received');
                return;
            }

            log('success', 'Message received via socket', {
                messageId: message.id,
                conversationId,
                content: message.content?.substring(0, 50) + '...',
                from: message.sender?.username,
                senderId: message.senderId,
                currentUserId: user.id,
                messageType: message.messageType
            });

            try {
                // Use unified message transformation
                const localMessage = MessageUtils.fromSocket(message, user.id);
                addMessage(conversationId, localMessage);

                // Update conversation with new last message
                const conversation = conversations.find(c => c.id === conversationId);
                const messagePreview = formatMessagePreview(
                    message.content,
                    message.messageType,
                    conversation?.type === 'group' ? message.sender?.username : undefined
                );

                updateConversation(conversationId, {
                    lastMessage: messagePreview,
                    lastMessageContent: message.content,
                    lastMessageAt: message.createdAt,
                    lastMessageSender: message.senderId,
                    timestamp: MessageUtils.formatTimestamp(message.createdAt),
                });

                // Increment unread count if not from current user
                if (message.senderId !== user.id) {
                    setConversationsState(prev => prev.map(conv =>
                        conv.id === conversationId
                            ? { ...conv, unreadCount: conv.unreadCount + 1 }
                            : conv
                    ));
                }

                log('success', 'Message processed successfully');
            } catch (error) {
                log('error', 'Error processing received message', error);
            }
        }, [user, addMessage, updateConversation, conversations, formatMessagePreview]),

        onMessageRead: useCallback((messageId: string, conversationId: string, readBy: string) => {
            log('info', 'Message read notification', { messageId, conversationId, readBy });
            updateMessageStatus(conversationId, messageId, 'read');
        }, [updateMessageStatus]),

        onMessageDelivered: useCallback((messageId: string, conversationId: string) => {
            log('info', 'Message delivered notification', { messageId, conversationId });
            updateMessageStatus(conversationId, messageId, 'delivered');
        }, [updateMessageStatus]),

        onUserOnline: useCallback((userId: string, username: string) => {
            log('success', 'User came online', { userId, username });
            setOnlineUsers(prev => new Set([...prev, userId]));
        }, []),

        onUserOffline: useCallback((userId: string, username: string) => {
            log('info', 'User went offline', { userId, username });
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            setUserLastSeen(prev => ({ ...prev, [userId]: new Date().toISOString() }));
        }, []),

        onTypingStart: useCallback((conversationId: string, userId: string, username: string) => {
            log('info', 'Typing started', { conversationId, userId, username });
            setTypingUsers(prev => ({
                ...prev,
                [conversationId]: [
                    ...(prev[conversationId] || []).filter(u => u.userId !== userId),
                    { userId, username, conversationId }
                ]
            }));
        }, []),

        onTypingStop: useCallback((conversationId: string, userId: string, username: string) => {
            log('info', 'Typing stopped', { conversationId, userId, username });
            setTypingUsers(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).filter(u => u.userId !== userId)
            }));
        }, []),

        onNotification: useCallback((notification: any) => {
            log('info', 'Notification received', notification);
        }, []),
    });

    // Socket initialization and management
    useEffect(() => {
        if (isAuthenticated && user && !socketInitialized.current) {
            log('info', 'Initializing socket connection', { username: user.username, userId: user.id });
            socketInitialized.current = true;

            socketManager.initialize()
                .then(() => {
                    log('success', 'Socket initialized successfully');
                })
                .catch(error => {
                    log('error', 'Socket initialization failed', error);
                    socketInitialized.current = false;
                    setError('Failed to connect to messaging service');
                });
        } else if (!isAuthenticated && socketInitialized.current) {
            log('info', 'User logged out, cleaning up socket');
            socketManager.cleanup();
            socketInitialized.current = false;

            // Clear all data
            setConversationsState([]);
            setMessagesState({});
            setTypingUsers({});
            setOnlineUsers(new Set());
            setUserLastSeen({});
            setError(null);
        }
    }, [isAuthenticated, user]);

    // Load initial data when connected
    useEffect(() => {
        if (isAuthenticated && user && connectionStatus.isConnected && conversations.length === 0) {
            log('info', 'Loading initial data', { username: user.username });
            setLoading(true);
            refreshConversations().finally(() => {
                setLoading(false);
            });
        }
    }, [isAuthenticated, user, connectionStatus.isConnected, conversations.length]);

    // Refresh conversations using unified transformation
    const refreshConversations = useCallback(async () => {
        if (!user) {
            log('error', 'Cannot refresh conversations - no user');
            return;
        }

        try {
            log('info', 'Refreshing conversations from server');
            const socketConversations = await socketManager.getConversations();
            log('info', 'Got conversations from server', { count: socketConversations.length });

            // Use unified conversation transformation
            const localConversations = socketConversations.map(conv =>
                ConversationUtils.fromSocket(conv, user.id, onlineUsers)
            );

            setConversations(localConversations);
            log('success', 'Updated local conversations', { count: localConversations.length });
        } catch (error) {
            log('error', 'Failed to refresh conversations', error);
            setError('Failed to load conversations');
        }
    }, [user, onlineUsers, setConversations]);

    // Send message with unified interface
    const sendMessage = useCallback(async (
        conversationId: string,
        content: string,
        options: {
            messageType?: 'text' | 'image' | 'video' | 'file';
            attachmentUrl?: string;
            attachmentType?: string;
            fileName?: string;
            replyToId?: string;
        } = {}
    ) => {
        if (!user) {
            log('error', 'Cannot send message - no user');
            throw new Error('Authentication required');
        }

        if (!content.trim() && !options.attachmentUrl) {
            log('error', 'Cannot send message - no content');
            throw new Error('Message content required');
        }

        log('info', 'Sending message', { conversationId, contentLength: content.length });

        try {
            const conversation = conversations.find(c => c.id === conversationId);
            if (!conversation) {
                log('error', 'Conversation not found');
                throw new Error('Conversation not found');
            }

            const receiverId = ConversationUtils.getRecipientId(conversation, user.id);
            if (!receiverId) {
                log('error', 'Receiver not found');
                throw new Error('Recipient not found');
            }

            const result = await realTimeHandlers.sendMessage(
                content,
                receiverId,
                {
                    conversationId,
                    messageType: options.messageType,
                    attachmentUrl: options.attachmentUrl,
                    attachmentType: options.attachmentType,
                    fileName: options.fileName,
                    replyToId: options.replyToId,
                }
            );

            if (result.success && result.messageId) {
                log('success', 'Message sent successfully', { messageId: result.messageId });

                // Update conversation last message
                const messagePreview = formatMessagePreview(content, options.messageType);
                updateConversation(conversationId, {
                    lastMessage: messagePreview,
                    lastMessageContent: content,
                    lastMessageAt: new Date().toISOString(),
                    lastMessageSender: user.id,
                    timestamp: MessageUtils.formatTimestamp(),
                });
            } else {
                const errorMessage = result.error || 'Failed to send message';
                setError(errorMessage);
                log('error', 'Message send failed', { error: result.error });
                throw new Error(errorMessage);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            log('error', 'Send message error', err);
            throw err;
        }
    }, [user, conversations, updateConversation, realTimeHandlers, formatMessagePreview]);

    // Refresh messages using unified transformation
    const refreshMessages = useCallback(async (conversationId: string) => {
        if (!user) {
            log('error', 'Cannot refresh messages - no user');
            return;
        }

        try {
            log('info', 'Refreshing messages for conversation', { conversationId });
            const { messages: socketMessages } = await socketManager.getMessages(conversationId);
            log('info', 'Got messages from server', { count: socketMessages.length });

            // Use unified message transformation
            const localMessages = socketMessages.map(msg => MessageUtils.fromSocket(msg, user.id));

            setMessagesState(prev => ({
                ...prev,
                [conversationId]: localMessages,
            }));

            log('success', 'Updated local messages for conversation', { conversationId, count: localMessages.length });
        } catch (error) {
            log('error', 'Failed to refresh messages', error);
            setError('Failed to load messages');
        }
    }, [user]);

    // Other operations (mark as read, typing, etc.) - implementations remain similar but simplified
    const markAsRead = useCallback(async (conversationId: string) => {
        try {
            log('info', 'Marking conversation as read', { conversationId });
            realTimeHandlers.markConversationRead(conversationId);
            updateConversation(conversationId, { unreadCount: 0 });

            setMessagesState(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(msg =>
                    !msg.isFromCurrentUser ? { ...msg, status: 'read', isRead: true } : msg
                ),
            }));
        } catch (err) {
            log('error', 'Failed to mark as read', err);
            setError('Failed to mark as read');
        }
    }, [realTimeHandlers, updateConversation]);

    const markMessageAsRead = useCallback(async (conversationId: string, messageId: string) => {
        try {
            log('info', 'Marking message as read', { messageId, conversationId });
            realTimeHandlers.markMessageRead(messageId, conversationId);
        } catch (err) {
            log('error', 'Failed to mark message as read', err);
        }
    }, [realTimeHandlers]);

    // Placeholder implementations for other operations
    const deleteMessage = useCallback(async (conversationId: string, messageId: string) => {
        try {
            log('info', 'Deleting message', { messageId, conversationId });
            setMessagesState(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(msg =>
                    msg.id === messageId ? { ...msg, isDeleted: true, deletedAt: new Date().toISOString() } : msg
                ),
            }));
        } catch (err) {
            log('error', 'Failed to delete message', err);
        }
    }, []);

    const editMessage = useCallback(async (conversationId: string, messageId: string, newContent: string) => {
        try {
            log('info', 'Editing message', { messageId, conversationId, newContent });
            setMessagesState(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(msg =>
                    msg.id === messageId ? {
                        ...msg,
                        content: newContent,
                        updatedAt: new Date().toISOString()
                    } : msg
                ),
            }));
        } catch (err) {
            log('error', 'Failed to edit message', err);
        }
    }, []);

    const getConversation = useCallback((id: string) => {
        return conversations.find(conv => conv.id === id);
    }, [conversations]);

    const createConversation = useCallback(async (participantId: string): Promise<Conversation | null> => {
        try {
            log('info', 'Creating conversation', { participantId });

            const existingConversation = conversations.find(conv =>
                conv.participants?.some(p => p.id === participantId)
            );

            if (existingConversation) {
                log('info', 'Conversation already exists', { id: existingConversation.id });
                return existingConversation;
            }

            const socketConversation = await socketManager.createConversation(participantId);
            if (socketConversation && user) {
                const conversation = ConversationUtils.fromSocket(socketConversation, user.id, onlineUsers);
                addConversation(conversation);
                log('success', 'Created new conversation', { id: conversation.id });
                return conversation;
            }

            throw new Error('Failed to create conversation');
        } catch (error) {
            log('error', 'Failed to create conversation', error);
            setError('Failed to create conversation');
            return null;
        }
    }, [conversations, user, onlineUsers, addConversation]);

    // Simplified placeholder operations
    const muteConversation = useCallback(async (conversationId: string, duration?: number) => {
        log('info', 'Muting conversation', { conversationId, duration });
        updateConversation(conversationId, { isMuted: true });
    }, [updateConversation]);

    const pinConversation = useCallback(async (conversationId: string) => {
        log('info', 'Pinning conversation', { conversationId });
        updateConversation(conversationId, { isPinned: true });
    }, [updateConversation]);

    const archiveConversation = useCallback(async (conversationId: string) => {
        log('info', 'Archiving conversation', { conversationId });
        updateConversation(conversationId, { isActive: false });
    }, [updateConversation]);

    // Typing and conversation management
    const startTyping = useCallback((conversationId: string, receiverId: string) => {
        log('debug', 'Starting typing', { conversationId, receiverId });
        realTimeHandlers.startTyping(conversationId, receiverId);
    }, [realTimeHandlers]);

    const stopTyping = useCallback((conversationId: string, receiverId: string) => {
        log('debug', 'Stopping typing', { conversationId, receiverId });
        realTimeHandlers.stopTyping(conversationId, receiverId);
    }, [realTimeHandlers]);

    const getTypingUsers = useCallback((conversationId: string): TypingUser[] => {
        return typingUsers[conversationId] || [];
    }, [typingUsers]);

    const joinConversation = useCallback((conversationId: string) => {
        log('info', 'Joining conversation', { conversationId });
        realTimeHandlers.joinConversation(conversationId);
    }, [realTimeHandlers]);

    const leaveConversation = useCallback((conversationId: string) => {
        log('info', 'Leaving conversation', { conversationId });
        realTimeHandlers.leaveConversation(conversationId);
    }, [realTimeHandlers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketInitialized.current) {
                log('info', 'Cleaning up on unmount');
                socketManager.cleanup();
                socketInitialized.current = false;
            }
        };
    }, []);

    // Context value with unified interfaces
    const contextValue: MessageContextType = {
        conversations,
        messages,
        typingUsers,
        onlineUsers,
        userLastSeen,
        connectionStatus, // Unified connection state
        loading,
        error,

        sendMessage,
        markAsRead,
        markMessageAsRead,
        deleteMessage,
        editMessage,
        getConversation,
        createConversation,
        refreshConversations,
        refreshMessages,
        muteConversation,
        pinConversation,
        archiveConversation,
        startTyping,
        stopTyping,
        getTypingUsers,
        joinConversation,
        leaveConversation,
        getUnreadCount,
        isUserOnline,
        getUserLastSeen,
        getConversationStatus,
        formatMessagePreview,

        // Internal functions
        addMessage,
        updateMessageStatus,
        addConversation,
        updateConversation,
        setConversations,
        setMessages,
    };

    return (
        <MessageContext.Provider value={contextValue}>
            {children}
        </MessageContext.Provider>
    );
};

// Custom hook for using the message context
    export const useMessages = () => {
        const context = useContext(MessageContext);
        if (!context) {
            throw new Error('useMessages must be used within a MessageProvider');
        }
        return context;
    };

    export default MessageProvider;