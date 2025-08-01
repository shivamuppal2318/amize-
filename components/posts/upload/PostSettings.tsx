import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
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

    // Get the current visibility setting label
    const getVisibilityLabel = () => {
        const option = VISIBILITY_OPTIONS.find(opt => opt.id === draftPost.visibility);
        return option ? option.label : 'Public';
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
                Alert.prompt(
                    'Enter Location',
                    'Enter your location for this post',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Save',
                            onPress: (location) => {
                                if (location) {
                                    onLocationUpdate(location);
                                }
                            }
                        }
                    ],
                    'plain-text',
                    locationText || ''
                );
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
});