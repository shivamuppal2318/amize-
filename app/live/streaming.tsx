import React, { useMemo, useState } from 'react';
import {
    Alert,
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    TextInput,
    Dimensions,
    Share,
    Linking,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import {
    X,
    Users,
    Heart,
    MessageCircle,
    Gift,
    Share2,
    Camera,
    Sparkles,
    MoreVertical,
    Shield,
    MicOff,
    Ban,
    UserX,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLiveSession } from '@/hooks/useLiveSession';
import type { LiveSessionPayload } from '@/lib/live/types';
import { GiftCatalogItem, WalletAPI } from '@/lib/api/walletService';
import { SITE_URL } from '@/lib/settings/constants';

const { width, height } = Dimensions.get('window');

export default function LiveStreamingScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { title, description, visibility, comments, beauty, moderation } =
        useLocalSearchParams<{
            title?: string;
            description?: string;
            visibility?: string;
            comments?: string;
            beauty?: string;
            moderation?: string;
        }>();

    const [comment, setComment] = useState('');
    const [showModerationPanel, setShowModerationPanel] = useState(false);
    const [showGiftPanel, setShowGiftPanel] = useState(false);
    const [giftCatalog, setGiftCatalog] = useState<GiftCatalogItem[]>([]);
    const [selectedGift, setSelectedGift] = useState<GiftCatalogItem | null>(null);
    const [giftQuantity, setGiftQuantity] = useState('1');
    const [sendingGift, setSendingGift] = useState(false);
    const [viewerGiftTarget, setViewerGiftTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [updatingSession, setUpdatingSession] = useState(false);
    const [moderatingUserId, setModeratingUserId] = useState<string | null>(null);
    const streamTitle =
        typeof title === 'string' && title.trim().length > 0 ? title : 'Live Session';
    const streamDescription =
        typeof description === 'string' && description.trim().length > 0
            ? description
            : 'No description added';
    const livePayload = useMemo<LiveSessionPayload>(
        () => ({
            title: streamTitle,
            description: streamDescription,
            visibility: visibility === 'private' ? 'private' : 'public',
            comments: comments === 'disabled' ? 'disabled' : 'enabled',
            beauty: beauty === 'on' ? 'on' : 'off',
            moderation: moderation === 'restricted' ? 'restricted' : 'open',
        }),
        [beauty, comments, moderation, streamDescription, streamTitle, visibility]
    );
    const liveSession = useLiveSession(livePayload);
    const canComment = comments !== 'disabled';
    const isHost = liveSession.state.session?.hostUserId === user?.id;
    const recentComments = liveSession.state.session?.recentComments ?? liveSession.state.comments;
    const moderationSummary = liveSession.state.session?.moderationSummary;
    const hostTransport = liveSession.state.hostTransport;
    const playbackUrl =
        liveSession.state.session?.playbackUrl ||
        hostTransport?.playbackUrl ||
        (liveSession.state.session?.id
            ? `${SITE_URL}/live/${liveSession.state.session.id}`
            : null);

    const streamMeta = useMemo(
        () => [
            `Visibility: ${liveSession.state.session?.visibility === 'private' ? 'Private' : 'Public'}`,
            `Comments: ${liveSession.state.session?.comments === 'disabled' ? 'Disabled' : 'Enabled'}`,
            `Beauty: ${liveSession.state.session?.beauty === 'on' ? 'On' : 'Off'}`,
            `Moderation: ${liveSession.state.session?.moderation === 'restricted' ? 'Restricted' : 'Open'}`,
        ],
        [liveSession.state.session]
    );

    const handleEndStream = async () => {
        await liveSession.endSession();
        router.replace('/(tabs)');
    };

    const handleSendComment = async () => {
        if (!canComment || comment.trim() === '') {
            return;
        }

        await liveSession.sendComment(
            comment.trim(),
            user?.username || user?.fullName || 'me'
        );
        setComment('');
    };

    const handleToggleComments = async () => {
        if (!isHost || !liveSession.state.session) {
            return;
        }

        try {
            setUpdatingSession(true);
            const nextComments =
                liveSession.state.session.comments === 'enabled' ? 'disabled' : 'enabled';
            await liveSession.updateSession({ comments: nextComments });
        } catch (error) {
            Alert.alert('Update Failed', 'Unable to update comment settings right now.');
        } finally {
            setUpdatingSession(false);
        }
    };

    const handleToggleModeration = async () => {
        if (!isHost || !liveSession.state.session) {
            return;
        }

        try {
            setUpdatingSession(true);
            const nextModeration =
                liveSession.state.session.moderation === 'open' ? 'restricted' : 'open';
            await liveSession.updateSession({ moderation: nextModeration });
        } catch (error) {
            Alert.alert('Update Failed', 'Unable to update moderation settings right now.');
        } finally {
            setUpdatingSession(false);
        }
    };

    const handleModerateUser = async (
        action: 'mute' | 'block' | 'remove_viewer',
        targetUserId?: string,
        username?: string
    ) => {
        if (!targetUserId) {
            return;
        }

        try {
            setModeratingUserId(targetUserId);
            await liveSession.moderateViewer(action, targetUserId);
            Alert.alert(
                'Moderation Updated',
                `${username || 'Viewer'} ${action.replace('_', ' ')} applied successfully.`
            );
        } catch (error) {
            Alert.alert('Moderation Failed', 'Unable to apply that moderation action right now.');
        } finally {
            setModeratingUserId(null);
        }
    };

    const handleShareLive = async () => {
        if (!playbackUrl) {
            Alert.alert('Share Unavailable', 'No live playback link is available yet.');
            return;
        }

        try {
            await Share.share({
                title: streamTitle,
                message: `Join my Amize live session: ${playbackUrl}`,
                url: playbackUrl,
            });
        } catch (error) {
            Alert.alert('Share Failed', 'Unable to share this live session right now.');
        }
    };

    const loadGiftCatalog = async () => {
        try {
            const catalog = await WalletAPI.getGiftCatalog();
            setGiftCatalog(catalog);
            setSelectedGift(catalog[0] ?? null);
        } catch (error) {
            setGiftCatalog([
                { id: 'rose', label: 'Rose', coinCost: 20, cashValue: 0.25 },
                { id: 'star', label: 'Star', coinCost: 75, cashValue: 1.5 },
                { id: 'crown', label: 'Crown', coinCost: 250, cashValue: 10 },
            ]);
            setSelectedGift({ id: 'rose', label: 'Rose', coinCost: 20, cashValue: 0.25 });
        }
    };

    const openGiftPanel = async (recipientId: string, recipientName: string) => {
        if (!recipientId) {
            Alert.alert('Gift Unavailable', 'No recipient available.');
            return;
        }

        await loadGiftCatalog();
        setGiftQuantity('1');
        setViewerGiftTarget({ id: recipientId, name: recipientName });
        setShowGiftPanel(true);
    };

    const handleGiftAction = async () => {
        if (!liveSession.state.session?.hostUserId) {
            Alert.alert('Gift Unavailable', 'The host is not available yet.');
            return;
        }

        await openGiftPanel(
            liveSession.state.session.hostUserId,
            liveSession.state.session?.hostUsername || 'Host'
        );
    };

    const handleSendGift = async () => {
        if (!selectedGift || !viewerGiftTarget?.id) {
            return;
        }

        const quantity = Math.max(1, Math.min(100, Number(giftQuantity) || 1));

        try {
            setSendingGift(true);
            const { wallet, gift } = await WalletAPI.sendGift(
                viewerGiftTarget.id,
                selectedGift.id,
                quantity
            );
            const label = gift?.quantity
                ? `${selectedGift.label} x${gift.quantity}`
                : selectedGift.label;
            await liveSession.sendComment(
                `sent ${label} to ${viewerGiftTarget.name}`,
                user?.username || user?.fullName || 'me'
            );
            Alert.alert('Gift Sent', `Sent ${label}. Coins left: ${wallet.coinBalance}.`);
            setShowGiftPanel(false);
        } catch (error) {
            Alert.alert('Gift Failed', 'Unable to send a gift right now.');
        } finally {
            setSendingGift(false);
        }
    };

    const openTransportLink = async (targetUrl?: string) => {
        if (!targetUrl) {
            return;
        }

        try {
            const supported = await Linking.canOpenURL(targetUrl);

            if (!supported) {
                Alert.alert('Open Link', 'This transport link cannot be opened on this device.');
                return;
            }

            await Linking.openURL(targetUrl);
        } catch (error) {
            Alert.alert('Open Link', 'Unable to open this transport link right now.');
        }
    };

    const renderComment = ({ item }: { item: typeof liveSession.state.comments[number] }) => (
        <View style={styles.commentItem}>
            <Text style={styles.commentUsername}>
                {item.username}
                <Text style={styles.commentTimestamp}>  {item.timestamp}</Text>
            </Text>
            <Text style={styles.commentText}>{item.text}</Text>
        </View>
    );

    const renderViewer = ({ item }: { item: typeof liveSession.state.viewers[number] }) => (
        <View style={styles.viewerItem}>
            <Text style={styles.viewerName}>{item.username}</Text>
            <TouchableOpacity
                style={styles.viewerGiftButton}
                onPress={() => openGiftPanel(item.id, item.username)}
            >
                <Gift size={14} color="#FFB800" />
                <Text style={styles.viewerGiftText}>Gift</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <View style={styles.livePreview}>
                <View style={styles.placeholderCard}>
                    <Text style={styles.liveText}>Live Room Preview</Text>
                    <Text style={styles.previewTitle}>{streamTitle}</Text>
                    <Text style={styles.previewDescription}>{streamDescription}</Text>
                    <View style={styles.connectionBanner}>
                        <Text style={styles.connectionBannerText}>
                            {liveSession.state.connectionLabel}
                        </Text>
                    </View>
                    <View style={styles.metaWrap}>
                        {streamMeta.map((item) => (
                            <View key={item} style={styles.metaPill}>
                                <Text style={styles.metaPillText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                    <Text style={styles.previewNote}>
                        {liveSession.backendConnected
                            ? 'Backend live session created. Viewer count and comments can now sync through the configured API and socket endpoints.'
                            : 'Backend live start failed or is unavailable. The screen is running in preview fallback mode.'}
                    </Text>
                    {hostTransport ? (
                        <View style={styles.transportCard}>
                            <Text style={styles.transportTitle}>Transport</Text>
                            <Text style={styles.transportLine}>
                                Provider: {hostTransport.provider}
                            </Text>
                            <TouchableOpacity onPress={() => openTransportLink(hostTransport.publishUrl)}>
                                <Text style={[styles.transportLine, styles.transportLink]}>
                                    Publish: {hostTransport.publishUrl}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => openTransportLink(hostTransport.playbackUrl)}>
                                <Text style={[styles.transportLine, styles.transportLink]}>
                                    Playback: {hostTransport.playbackUrl}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.transportLine}>
                                Stream key: {hostTransport.streamKey}
                            </Text>
                            {hostTransport.dashboardUrl ? (
                                <TouchableOpacity
                                    onPress={() => openTransportLink(hostTransport.dashboardUrl)}
                                >
                                    <Text style={[styles.transportLine, styles.transportLink]}>
                                        Dashboard: {hostTransport.dashboardUrl}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ) : null}
                    {playbackUrl ? (
                        <TouchableOpacity
                            style={styles.shareLinkCard}
                            onPress={handleShareLive}
                        >
                            <Text style={styles.shareLinkTitle}>Shareable live link</Text>
                            <Text style={styles.shareLinkValue}>{playbackUrl}</Text>
                        </TouchableOpacity>
                    ) : null}
                    {isHost ? (
                        <View style={styles.hostSummary}>
                            <Text style={styles.hostSummaryText}>
                                Muted: {moderationSummary?.mutedUserIds.length ?? 0}
                            </Text>
                            <Text style={styles.hostSummaryText}>
                                Blocked: {moderationSummary?.blockedUserIds.length ?? 0}
                            </Text>
                        </View>
                    ) : null}
                    {liveSession.state.error ? (
                        <Text style={styles.errorNote}>{liveSession.state.error}</Text>
                    ) : null}
                </View>
                {showGiftPanel ? (
                    <View style={styles.giftPanel}>
                        <Text style={styles.giftPanelTitle}>Send a Gift</Text>
                        <Text style={styles.giftPanelSubtitle}>
                            To: {viewerGiftTarget?.name || 'Recipient'}
                        </Text>
                        <Text style={styles.giftPanelMeta}>
                            Coins available: {walletState.coinBalance}
                        </Text>
                        <View style={styles.giftOptions}>
                            {giftCatalog.map((gift) => {
                                const isSelected = selectedGift?.id === gift.id;
                                return (
                                    <TouchableOpacity
                                        key={gift.id}
                                        onPress={() => setSelectedGift(gift)}
                                        style={[
                                            styles.giftOption,
                                            isSelected && styles.giftOptionSelected,
                                        ]}
                                    >
                                        <Text style={styles.giftOptionLabel}>{gift.label}</Text>
                                        <Text style={styles.giftOptionMeta}>
                                            {gift.coinCost} coins
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={styles.giftQuantityRow}>
                            <Text style={styles.giftQuantityLabel}>Quantity</Text>
                            <TextInput
                                value={giftQuantity}
                                onChangeText={setGiftQuantity}
                                keyboardType="number-pad"
                                style={styles.giftQuantityInput}
                                placeholder="1"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        <View style={styles.giftActionRow}>
                            <TouchableOpacity
                                style={styles.giftSecondaryButton}
                                onPress={() => setShowGiftPanel(false)}
                                disabled={sendingGift}
                            >
                                <Text style={styles.giftSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.giftPrimaryButton}
                                onPress={handleSendGift}
                                disabled={sendingGift}
                            >
                                <Text style={styles.giftPrimaryText}>
                                    {sendingGift ? 'Sending...' : 'Send Gift'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </View>

            <View style={styles.topControls}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleEndStream}
                >
                    <X size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.streamInfo}>
                    <View style={styles.timeViewerCount}>
                        <Text style={styles.liveIndicator}>LIVE</Text>
                        <Text style={styles.duration}>
                            {liveSession.state.mode === 'backend' ? 'SYNC' : 'PREVIEW'}
                        </Text>
                        <View style={styles.viewerCountContainer}>
                            <Users size={12} color="#fff" />
                            <Text style={styles.viewerCount}>{liveSession.state.viewerCount}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.topRightControls}>
                    <TouchableOpacity style={styles.controlButton}>
                        <Camera size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlButton}>
                        <Sparkles size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.streamActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={liveSession.sendLike}
                >
                    <Heart size={24} color="#FF4D67" />
                    <Text style={styles.actionText}>{liveSession.state.likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={24} color="#5A8CFF" />
                    <Text style={styles.actionText}>{liveSession.state.comments.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleGiftAction}>
                    <Gift size={24} color="#FFB800" />
                    <Text style={styles.actionText}>Gift</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleShareLive}>
                    <Share2 size={24} color="#FF4D67" />
                    <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowModerationPanel((current) => !current)}
                >
                    <MoreVertical size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {showModerationPanel ? (
                <View style={styles.moderationPanel}>
                    <View style={styles.moderationHeader}>
                        <Shield size={16} color="#FCD34D" />
                        <Text style={styles.moderationTitle}>Host Controls</Text>
                    </View>
                    {isHost ? (
                        <>
                            <View style={styles.moderationRow}>
                                <TouchableOpacity
                                    style={styles.moderationToggle}
                                    onPress={handleToggleComments}
                                    disabled={updatingSession}
                                >
                                    <MicOff size={16} color="#F9FAFB" />
                                    <Text style={styles.moderationToggleText}>
                                        {liveSession.state.session?.comments === 'enabled'
                                            ? 'Disable Comments'
                                            : 'Enable Comments'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.moderationToggle}
                                    onPress={handleToggleModeration}
                                    disabled={updatingSession}
                                >
                                    <Shield size={16} color="#F9FAFB" />
                                    <Text style={styles.moderationToggleText}>
                                        {liveSession.state.session?.moderation === 'open'
                                            ? 'Restrict Chat'
                                            : 'Open Chat'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {recentComments.slice(-4).reverse().map((item) => (
                                <View key={item.id} style={styles.moderationItem}>
                                    <View style={styles.moderationCopy}>
                                        <Text style={styles.moderationUsername}>{item.username}</Text>
                                        <Text style={styles.moderationText} numberOfLines={2}>
                                            {item.text}
                                        </Text>
                                    </View>
                                    <View style={styles.moderationActions}>
                                        <TouchableOpacity
                                            style={styles.iconAction}
                                            onPress={() =>
                                                handleModerateUser('mute', item.userId, item.username)
                                            }
                                            disabled={!item.userId || moderatingUserId === item.userId}
                                        >
                                            <MicOff size={14} color="#FCD34D" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.iconAction}
                                            onPress={() =>
                                                handleModerateUser('remove_viewer', item.userId, item.username)
                                            }
                                            disabled={!item.userId || moderatingUserId === item.userId}
                                        >
                                            <UserX size={14} color="#93C5FD" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.iconAction}
                                            onPress={() =>
                                                handleModerateUser('block', item.userId, item.username)
                                            }
                                            disabled={!item.userId || moderatingUserId === item.userId}
                                        >
                                            <Ban size={14} color="#FCA5A5" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </>
                    ) : (
                        <Text style={styles.moderationDescription}>
                            Only the host can update live moderation controls.
                        </Text>
                    )}
                </View>
            ) : null}

            <View style={styles.commentsContainer}>
                <FlatList
                    data={liveSession.state.comments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id}
                    style={styles.commentsList}
                />
            </View>

            {liveSession.state.viewers?.length ? (
                <View style={styles.viewersPanel}>
                    <Text style={styles.viewersTitle}>Viewers</Text>
                    <FlatList
                        data={liveSession.state.viewers.slice(0, 6)}
                        keyExtractor={(item) => item.id}
                        renderItem={renderViewer}
                    />
                </View>
            ) : null}

            <View style={styles.commentInputContainer}>
                <TextInput
                    style={[
                        styles.commentInput,
                        !canComment && styles.commentInputDisabled,
                    ]}
                    placeholder={
                        canComment ? 'Add a comment...' : 'Comments are disabled for this stream'
                    }
                    placeholderTextColor="#777"
                    value={comment}
                    onChangeText={setComment}
                    editable={canComment}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        !canComment && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSendComment}
                    disabled={!canComment}
                >
                    <Text style={styles.sendButtonText}>
                        {canComment ? 'Send' : 'Off'}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.endStreamButton}
                onPress={handleEndStream}
            >
                <Text style={styles.endStreamText}>
                    {liveSession.state.mode === 'backend' ? 'End Live' : 'End Preview'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    livePreview: {
        position: 'absolute',
        width,
        height,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    placeholderCard: {
        width: '100%',
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 18,
        padding: 20,
    },
    liveText: {
        color: '#FF4D67',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    previewTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        marginTop: 10,
    },
    previewDescription: {
        color: '#D1D5DB',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
    },
    metaWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
    },
    metaPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    metaPillText: {
        color: '#F9FAFB',
        fontSize: 12,
    },
    previewNote: {
        color: '#9CA3AF',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 8,
    },
    connectionBanner: {
        borderRadius: 10,
        backgroundColor: 'rgba(255, 77, 103, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 14,
    },
    connectionBannerText: {
        color: '#F9FAFB',
        fontSize: 12,
        fontWeight: '600',
    },
    hostSummary: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    hostSummaryText: {
        color: '#E5E7EB',
        fontSize: 12,
        fontWeight: '600',
    },
    errorNote: {
        color: '#FCA5A5',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 8,
    },
    transportCard: {
        marginTop: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: 12,
    },
    transportTitle: {
        color: '#F9FAFB',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    transportLine: {
        color: '#D1D5DB',
        fontSize: 12,
        lineHeight: 18,
    },
    transportLink: {
        textDecorationLine: 'underline',
    },
    shareLinkCard: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    shareLinkTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
    },
    shareLinkValue: {
        color: '#D1D5DB',
        fontSize: 12,
        lineHeight: 18,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    streamInfo: {
        flex: 1,
        alignItems: 'center',
    },
    timeViewerCount: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    liveIndicator: {
        color: '#FF4D67',
        marginRight: 8,
        fontSize: 12,
        fontWeight: '700',
    },
    duration: {
        color: '#fff',
        marginRight: 8,
        fontSize: 12,
    },
    viewerCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewerCount: {
        color: '#fff',
        marginLeft: 4,
        fontSize: 12,
    },
    topRightControls: {
        flexDirection: 'row',
    },
    controlButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    streamActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 240,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        marginTop: 4,
        fontSize: 12,
    },
    moderationPanel: {
        position: 'absolute',
        bottom: 180,
        left: 16,
        right: 16,
        zIndex: 11,
        borderRadius: 18,
        padding: 16,
        backgroundColor: 'rgba(17, 24, 39, 0.94)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    moderationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    moderationTitle: {
        color: '#F9FAFB',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
    moderationDescription: {
        color: '#D1D5DB',
        fontSize: 13,
        lineHeight: 18,
    },
    moderationRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    moderationToggle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    moderationToggleText: {
        color: '#F9FAFB',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    moderationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    moderationCopy: {
        flex: 1,
        paddingRight: 12,
    },
    moderationUsername: {
        color: '#F9FAFB',
        fontSize: 13,
        fontWeight: '700',
    },
    moderationText: {
        color: '#CBD5E1',
        fontSize: 12,
        marginTop: 4,
    },
    moderationActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconAction: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentsContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        height: 120,
        paddingHorizontal: 16,
    },
    commentsList: {
        flex: 1,
    },
    commentItem: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
    },
    commentUsername: {
        color: '#5A8CFF',
        fontWeight: '700',
        marginBottom: 2,
    },
    commentTimestamp: {
        color: '#9CA3AF',
        fontWeight: '400',
    },
    commentText: {
        color: '#fff',
    },
    giftPanel: {
        marginTop: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    giftPanelTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    giftPanelSubtitle: {
        color: '#E2E8F0',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    giftPanelMeta: {
        color: '#94A3B8',
        fontSize: 12,
        marginBottom: 12,
    },
    giftOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    giftOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.15)',
        minWidth: 110,
    },
    giftOptionSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.6)',
    },
    giftOptionLabel: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
    },
    giftOptionMeta: {
        color: '#CBD5F5',
        fontSize: 12,
        marginTop: 4,
    },
    giftQuantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        justifyContent: 'space-between',
    },
    giftQuantityLabel: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '600',
    },
    giftQuantityInput: {
        minWidth: 72,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.3)',
        color: '#F8FAFC',
        textAlign: 'center',
    },
    giftActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 16,
    },
    giftSecondaryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
    },
    giftSecondaryText: {
        color: '#E2E8F0',
        fontWeight: '600',
    },
    giftPrimaryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#FF5A5F',
    },
    giftPrimaryText: {
        color: '#FFF',
        fontWeight: '700',
    },
    viewersPanel: {
        position: 'absolute',
        right: 16,
        top: 140,
        width: 160,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    viewersTitle: {
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    viewerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    viewerName: {
        color: '#E2E8F0',
        fontSize: 12,
        flex: 1,
        marginRight: 6,
    },
    viewerGiftButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 184, 0, 0.18)',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 8,
    },
    viewerGiftText: {
        color: '#FFB800',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    commentInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#222',
        borderRadius: 20,
        paddingHorizontal: 16,
        color: '#fff',
    },
    commentInputDisabled: {
        opacity: 0.7,
    },
    sendButton: {
        marginLeft: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FF4D67',
        borderRadius: 20,
    },
    sendButtonDisabled: {
        backgroundColor: '#4B5563',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    endStreamButton: {
        position: 'absolute',
        bottom: 80,
        right: 16,
        backgroundColor: '#FF4D67',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        zIndex: 10,
    },
    endStreamText: {
        color: '#fff',
        fontWeight: '700',
    },
});
