import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    AtSign,
    ChevronRight,
    Globe,
    Hash,
    MapPin,
    MessageSquare,
    Repeat2,
    Scissors
} from 'lucide-react-native';

interface DraftPost {
    visibility: string;
    location?: string;
    allowComments: boolean;
    allowDuets: boolean;
    allowStitch: boolean;
}

interface PostSettingsProps {
    draftPost: DraftPost;
    locationText: string;
    onLocationUpdate: (location: string) => void;
    onVisibilityPress: () => void;
    onToggleComments: () => void;
    onToggleDuets: () => void;
    onToggleStitch: () => void;
    onHashtagPress?: () => void;
    onMentionPress?: () => void;
}

// Options for post settings with their icons
const POST_OPTIONS = [
    {
        key: 'hashtags',
        label: 'Hashtag',
        icon: <Hash size={20} color="#FF4D67" />,
        hasChevron: false
    },
    {
        key: 'mentions',
        label: 'Mention',
        icon: <AtSign size={20} color="#5A8CFF" />,
        hasChevron: false
    },
    {
        key: 'location',
        label: 'Location',
        icon: <MapPin size={20} color="#FF4D67" />,
        hasChevron: true
    },
    {
        key: 'visibility',
        label: 'Visible to Everyone',
        icon: <Globe size={20} color="#5A8CFF" />,
        hasChevron: true
    },
    {
        key: 'comments',
        label: 'Allow Comments',
        icon: <MessageSquare size={20} color="#FFB800" />,
        hasChevron: true
    },
    {
        key: 'duets',
        label: 'Allow Duets',
        icon: <Repeat2 size={20} color="#FF4D67" />,
        hasChevron: true
    },
    {
        key: 'stitch',
        label: 'Allow Stitch',
        icon: <Scissors size={20} color="#5A8CFF" />,
        hasChevron: true
    }
];

// Visibility options for label display
const VISIBILITY_OPTIONS = [
    { id: 'public', label: 'Public' },
    { id: 'followers', label: 'Followers' },
    { id: 'private', label: 'Private' }
];

export default function PostSettings({
                                         draftPost,
                                         locationText,
                                         onLocationUpdate,
                                         onVisibilityPress,
                                         onToggleComments,
                                         onToggleDuets,
                                         onToggleStitch,
                                     onHashtagPress,
                                     onMentionPress
                                     }: PostSettingsProps) {
    const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
    const [pendingLocation, setPendingLocation] = useState(locationText || draftPost.location || '');

    // Get the current visibility setting label
    const getVisibilityLabel = () => {
        const option = VISIBILITY_OPTIONS.find(opt => opt.id === draftPost.visibility);
        return option ? option.label : 'Public';
    };

    const openLocationEditor = () => {
        setPendingLocation(locationText || draftPost.location || '');
        setIsLocationModalVisible(true);
    };

    const closeLocationEditor = () => {
        setIsLocationModalVisible(false);
        setPendingLocation(locationText || draftPost.location || '');
    };

    const saveLocation = () => {
        const trimmedLocation = pendingLocation.trim();
        if (trimmedLocation) {
            onLocationUpdate(trimmedLocation);
        }
        setIsLocationModalVisible(false);
    };

    // Handle option press
    const handleOptionPress = (option: typeof POST_OPTIONS[0]) => {
        switch (option.key) {
            case 'hashtags':
                onHashtagPress?.();
                break;
            case 'mentions':
                onMentionPress?.();
                break;
            case 'location':
                openLocationEditor();
                break;
            case 'visibility':
                onVisibilityPress();
                break;
            case 'comments':
                onToggleComments();
                break;
            case 'duets':
                onToggleDuets();
                break;
            case 'stitch':
                onToggleStitch();
                break;
            default:
                break;
        }
    };

    return (
        <>
            <View style={styles.optionsSection}>
                {POST_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={styles.optionItem}
                        onPress={() => handleOptionPress(option)}
                    >
                        <View style={styles.optionLeft}>
                            {option.icon}
                            <Text style={styles.optionLabel}>
                                {option.key === 'visibility'
                                    ? `Visible to ${getVisibilityLabel()}`
                                    : option.key === 'location' && draftPost.location
                                        ? draftPost.location
                                        : option.label}
                            </Text>
                        </View>

                        {option.hasChevron ? (
                            <ChevronRight size={20} color="#777" />
                        ) : (
                            option.key === 'comments' || option.key === 'duets' || option.key === 'stitch' ? (
                                <View style={styles.toggleContainer}>
                                    <View style={[
                                        styles.toggleBar,
                                        (
                                            (option.key === 'comments' && draftPost.allowComments) ||
                                            (option.key === 'duets' && draftPost.allowDuets) ||
                                            (option.key === 'stitch' && draftPost.allowStitch)
                                        ) && styles.toggleBarActive
                                    ]}>
                                        <View style={[
                                            styles.toggleCircle,
                                            (
                                                (option.key === 'comments' && draftPost.allowComments) ||
                                                (option.key === 'duets' && draftPost.allowDuets) ||
                                                (option.key === 'stitch' && draftPost.allowStitch)
                                            ) && styles.toggleCircleActive
                                        ]} />
                                    </View>
                                </View>
                            ) : null
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <Modal
                visible={isLocationModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeLocationEditor}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Enter Location</Text>
                        <Text style={styles.modalDescription}>
                            Add a location to help people discover this post.
                        </Text>
                        <TextInput
                            value={pendingLocation}
                            onChangeText={setPendingLocation}
                            placeholder="City, venue, or area"
                            placeholderTextColor="#777"
                            style={styles.locationInput}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={saveLocation}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={closeLocationEditor}
                            >
                                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={saveLocation}
                            >
                                <Text style={styles.modalButtonPrimaryText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    optionsSection: {
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionLabel: {
        color: '#fff',
        marginLeft: 12,
        fontSize: 15,
    },
    toggleContainer: {
        height: 24,
        justifyContent: 'center',
    },
    toggleBar: {
        width: 46,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#444',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleBarActive: {
        backgroundColor: '#FF4D67',
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    toggleCircleActive: {
        alignSelf: 'flex-end',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    modalDescription: {
        color: '#A1A1AA',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    locationInput: {
        backgroundColor: '#111',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        color: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 18,
    },
    modalButton: {
        minWidth: 92,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        marginLeft: 10,
    },
    modalButtonSecondary: {
        backgroundColor: '#2A2A2D',
    },
    modalButtonPrimary: {
        backgroundColor: '#FF4D67',
    },
    modalButtonSecondaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalButtonPrimaryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
