// components/MessageInput.tsx - Updated to use unified connection state
import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Paperclip, Send, Camera } from 'lucide-react-native';
import { useMessages } from '@/context/MessageContext';
import { COLORS, UI, ANIMATION } from './constants';

interface MessageInputProps {
    conversationId: string;
    onTypingStart: () => void;
    onTypingStop: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
                                                       conversationId,
                                                       onTypingStart,
                                                       onTypingStop
                                                   }) => {
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Use unified connection state from MessageContext
    const { sendMessage, connectionStatus } = useMessages();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debug: Log connection status changes
    useEffect(() => {
        console.log('🔌 MessageInput connection status changed:', {
            state: connectionStatus.state,
            isConnected: connectionStatus.isConnected,
            conversationId,
            reconnectAttempts: connectionStatus.reconnectAttempts,
            error: connectionStatus.error,
            timestamp: new Date().toISOString()
        });
    }, [connectionStatus, conversationId]);

    const handleTextChange = (text: string) => {
        setMessageText(text);

        if (text.trim() && connectionStatus.isConnected) {
            onTypingStart();

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing
            typingTimeoutRef.current = setTimeout(() => {
                onTypingStop();
            }, ANIMATION.TYPING_TIMEOUT) as unknown as NodeJS.Timeout;
        } else {
            onTypingStop();
        }
    };

    const handleSend = async () => {
        if (!messageText.trim() || isSending || !connectionStatus.isConnected) {
            console.log('⚠️ Cannot send message:', {
                hasText: !!messageText.trim(),
                isSending,
                isConnected: connectionStatus.isConnected,
                connectionState: connectionStatus.state
            });
            return;
        }

        const textToSend = messageText.trim();
        setIsSending(true);
        onTypingStop();

        console.log('📤 Sending message:', {
            conversationId,
            textLength: textToSend.length,
            connectionState: connectionStatus.state
        });

        try {
            // Wait for server response before clearing input
            await sendMessage(conversationId, textToSend);

            // Only clear input after successful send
            setMessageText('');
            console.log('✅ Message sent successfully');
        } catch (error) {
            console.error('❌ Failed to send message:', error);

            // Show more specific error messages based on connection state
            let errorMessage = 'Failed to send message. Please try again.';

            if (!connectionStatus.isConnected) {
                switch (connectionStatus.state) {
                    case 'connecting':
                        errorMessage = 'Still connecting. Please wait and try again.';
                        break;
                    case 'reconnecting':
                        errorMessage = 'Reconnecting to server. Please wait and try again.';
                        break;
                    case 'error':
                        errorMessage = connectionStatus.error || 'Connection error. Please check your internet connection.';
                        break;
                    default:
                        errorMessage = 'Not connected to server. Please check your connection.';
                }
            }

            Alert.alert('Error', errorMessage);

            // Keep the text in input if send failed
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Enhanced placeholder text with better connection feedback
    const getPlaceholderText = () => {
        if (isSending) {
            return "Sending...";
        }

        switch (connectionStatus.state) {
            case 'connecting':
                return "Connecting...";
            case 'reconnecting':
                return `Reconnecting... (${connectionStatus.reconnectAttempts})`;
            case 'error':
                return "Connection error";
            case 'disconnected':
                return "Disconnected";
            case 'connected':
                return "Type a message...";
            default:
                return "Type a message...";
        }
    };

    // Enhanced input styling based on connection state
    const getInputStyle = () => {
        return {
            ...styles.messageInput,
            ...((!connectionStatus.isConnected) && { opacity: 0.6 }),
            ...(connectionStatus.state === 'error' && {
                borderWidth: 1,
                borderColor: COLORS.error,
                borderRadius: UI.BORDER_RADIUS.MD, // Changed from SM to MD
            })
        };
    };

    // Enhanced send button styling
    const getSendButtonStyle = () => {
        return {
            ...styles.sendButton,
            ...(!connectionStatus.isConnected || isSending ? { opacity: 0.5 } : {})
        };
    };

    // Get appropriate icon color based on connection state
    const getIconColor = () => {
        if (!connectionStatus.isConnected || isSending) {
            return COLORS.textGray;
        }

        if (connectionStatus.state === 'error') {
            return COLORS.error;
        }

        return COLORS.textGray;
    };

    const getSendIconColor = () => {
        if (!connectionStatus.isConnected || isSending) {
            return COLORS.textGray;
        }

        return COLORS.primary;
    };

    // Debug render
    console.log('🎨 MessageInput render:', {
        connectionState: connectionStatus.state,
        isConnected: connectionStatus.isConnected,
        isSending,
        hasText: !!messageText.trim(),
        placeholder: getPlaceholderText(),
        reconnectAttempts: connectionStatus.reconnectAttempts
    });

    return (
        <View style={[
            styles.messageInputContainer,
            !connectionStatus.isConnected && styles.messageInputContainerDisabled,
            connectionStatus.state === 'error' && styles.messageInputContainerError
        ]}>
            <TouchableOpacity
                style={styles.attachmentButton}
                disabled={!connectionStatus.isConnected || isSending}
            >
                <Paperclip
                    size={24}
                    color={getIconColor()}
                />
            </TouchableOpacity>

            <TextInput
                style={getInputStyle()}
                placeholder={getPlaceholderText()}
                placeholderTextColor={
                    connectionStatus.state === 'error'
                        ? COLORS.error
                        : COLORS.textGray
                }
                value={messageText}
                onChangeText={handleTextChange}
                multiline
                editable={connectionStatus.isConnected && !isSending}
                onFocus={() => {
                    console.log('📝 MessageInput focused:', {
                        isConnected: connectionStatus.isConnected,
                        isSending,
                        state: connectionStatus.state
                    });
                }}
            />

            {messageText.trim() ? (
                <TouchableOpacity
                    onPress={handleSend}
                    style={getSendButtonStyle()}
                    disabled={isSending || !connectionStatus.isConnected}
                >
                    {isSending ? (
                        <ActivityIndicator size={20} color={COLORS.primary} />
                    ) : (
                        <Send
                            size={24}
                            color={getSendIconColor()}
                        />
                    )}
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.cameraButton}
                    disabled={!connectionStatus.isConnected || isSending}
                >
                    <Camera
                        size={24}
                        color={getIconColor()}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    messageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: UI.SPACING.MD,
        backgroundColor: COLORS.darkGray,
        borderTopWidth: 1,
        borderTopColor: 'rgba(243,244,246,0.04)',
    },
    messageInputContainerDisabled: {
        opacity: 0.6,
    },
    messageInputContainerError: {
        borderTopColor: COLORS.error,
        backgroundColor: COLORS.darkGray,
    },
    attachmentButton: {
        padding: UI.SPACING.SM,
        marginRight: UI.SPACING.SM,
    },
    messageInput: {
        flex: 1,
        color: COLORS.white,
        paddingHorizontal: UI.SPACING.MD,
        paddingVertical: UI.SPACING.SM,
        fontSize: 16,
        maxHeight: 100,
    },
    messageInputDisabled: {
        opacity: 0.6,
    },
    messageInputError: {
        borderWidth: 1,
        borderColor: COLORS.error,
        borderRadius: UI.BORDER_RADIUS.SM,
    },
    sendButton: {
        padding: UI.SPACING.SM,
        marginLeft: UI.SPACING.SM,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    cameraButton: {
        padding: UI.SPACING.SM,
        marginLeft: UI.SPACING.SM,
    },
});

export default MessageInput;