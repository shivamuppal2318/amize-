import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ArrowLeft, Phone, MoreVertical } from 'lucide-react-native';
import { Conversation } from "@/types/messaging";
import { COLORS, UI } from './constants';

interface ConversationHeaderProps {
    conversation: Conversation;
    onBack: () => void;
    isOnline?: boolean;
    typingUsers: string[];
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
                                                                   conversation,
                                                                   onBack,
                                                                   isOnline = false,
                                                                   typingUsers
                                                               }) => (
    <View style={styles.conversationHeaderContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
            <Image source={{ uri: conversation.avatar }} style={styles.conversationAvatar} />
            {isOnline && <View style={styles.onlineIndicatorSmall} />}
        </View>
        <View style={styles.conversationInfo}>
            <Text style={styles.conversationTitle}>{conversation.name}</Text>
            {typingUsers.length > 0 ? (
                <Text style={styles.statusText}>typing...</Text>
            ) : (
                <Text style={styles.statusText}>
                    {isOnline ? 'Online' : 'Last seen recently'}
                </Text>
            )}
        </View>
        <View style={styles.conversationActions}>
            <TouchableOpacity style={styles.actionButton}>
                <Phone size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
                <MoreVertical size={24} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    conversationHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: UI.SPACING.LG,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.darkGray,
    },
    backButton: {
        marginRight: UI.SPACING.MD,
    },
    avatarContainer: {
        position: 'relative',
    },
    conversationAvatar: {
        width: UI.AVATAR_SIZE,
        height: UI.AVATAR_SIZE,
        borderRadius: UI.BORDER_RADIUS.AVATAR,
        marginRight: UI.SPACING.MD,
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    onlineIndicatorSmall: {
        position: 'absolute',
        bottom: 3,
        right: 0,
        width: UI.AVATAR_SIZE_SMALL,
        height: UI.AVATAR_SIZE_SMALL,
        borderRadius: 5,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.black,
    },
    conversationInfo: {
        flex: 1,
    },
    conversationTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusText: {
        color: COLORS.textGray,
        fontSize: 12,
        marginTop: 2,
    },
    conversationActions: {
        flexDirection: 'row',
        gap: UI.SPACING.LG,
    },
    actionButton: {
        padding: UI.SPACING.SM,
    },
});

export default ConversationHeader;