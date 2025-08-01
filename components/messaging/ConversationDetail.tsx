import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { useMessages } from '@/context/MessageContext';
import { Message, Conversation } from '@/types/messaging';
import ConversationHeader from './ConversationHeader';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';
import { COLORS, UI } from './constants';

interface ConversationDetailProps {
    conversation: Conversation;
    messages: Message[];
    typingUsers: string[];
    isOnline: boolean;
    isConnected: boolean;
    onBack: () => void;
    onTypingStart: () => void;
    onTypingStop: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({conversation, messages, typingUsers, isOnline, isConnected, onBack, onTypingStart, onTypingStop,}) => {
    const flatListRef = useRef<FlatList>(null);

    const { connectionStatus, refreshMessages } = useMessages();

    // Load messages when conversation changes and we're connected
    useEffect(() => {
        if (conversation.id && connectionStatus.isConnected) {
            refreshMessages(conversation.id).catch(error => {
                console.error('[ConversationDetail] ❌ Failed to load messages:', error);
            });
        }
    }, [conversation.id, connectionStatus.isConnected, refreshMessages]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    const handleRetryMessage = (messageId: string) => {
        Alert.alert('Retry', 'Retry sending message?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Retry',
                onPress: () => {
                    console.log('[ConversationDetail] Retrying message:', messageId);
                    // TODO: Implement retry logic
                }
            }
        ]);
    };

    // FIXED: Enhanced message grouping using unified Message interface
    const groupedMessages = (): Message[][] => {
        const grouped: Message[][] = [];
        let currentGroup: Message[] = [];
        let currentSenderId: string | null = null;

        messages.forEach((message, index) => {
            // FIXED: Group by senderId instead of sender string
            if (message.senderId !== currentSenderId) {
                // Save the current group if it has messages
                if (currentGroup.length > 0) {
                    grouped.push(currentGroup);
                }

                // Start a new group
                currentGroup = [message];
                currentSenderId = message.senderId;
            } else {
                // Add to current group
                currentGroup.push(message);
            }
        });

        // Don't forget the last group
        if (currentGroup.length > 0) {
            grouped.push(currentGroup);
        }

        return grouped;
    };

    const renderMessageGroup = ({ item: group, index }: { item: Message[]; index: number }) => {

        return (
            <View style={styles.messageGroup}>
                {group.map((message, messageIndex) => {
                    const isFirst = messageIndex === 0;
                    const isLast = messageIndex === group.length - 1;

                    let position: 'first' | 'middle' | 'last' | 'single';
                    if (group.length === 1) {
                        position = 'single';
                    } else if (isFirst) {
                        position = 'first';
                    } else if (isLast) {
                        position = 'last';
                    } else {
                        position = 'middle';
                    }

                    return (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            position={position}
                            isLastInGroup={isLast}
                            onRetry={handleRetryMessage}
                        />
                    );
                })}
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
                {!connectionStatus.isConnected
                    ? `${connectionStatus.state === 'connecting' ? 'Connecting' : 'Reconnecting'} to messages...`
                    : "No messages yet. Start the conversation!"
                }
            </Text>
            {connectionStatus.error && (
                <Text style={styles.errorText}>
                    {connectionStatus.error}
                </Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <ConversationHeader
                conversation={conversation}
                onBack={onBack}
                isOnline={isOnline}
                typingUsers={typingUsers}
            />

            <FlatList
                ref={flatListRef}
                data={groupedMessages()}
                keyExtractor={(group, index) => `group-${index}-${group[0]?.id || 'empty'}`}
                renderItem={renderMessageGroup}
                inverted={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.messagesContent,
                    messages.length === 0 && styles.emptyMessagesContent
                ]}
                ListEmptyComponent={renderEmptyState}
                onContentSizeChange={() => {
                    // Auto-scroll to bottom when content size changes
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={10}
                removeClippedSubviews={false} // Keep false for better message rendering
            />

            <TypingIndicator typingUsers={typingUsers} />

            {/* FIXED: MessageInput gets connection state from context */}
            <MessageInput
                conversationId={conversation.id}
                onTypingStart={onTypingStart}
                onTypingStop={onTypingStop}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    messageGroup: {
        paddingHorizontal: UI.SPACING.LG,
        paddingTop: UI.SPACING.MD,
    },
    messagesContent: {
        flexGrow: 1,
        paddingBottom: UI.SPACING.LG,
    },
    emptyMessagesContent: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: UI.SPACING.XL,
    },
    emptyStateText: {
        color: COLORS.textGray,
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: UI.SPACING.SM,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default ConversationDetail;