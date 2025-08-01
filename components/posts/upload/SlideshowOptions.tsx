import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ChevronRight, Film, ImageIcon } from 'lucide-react-native';
import { MediaItem } from '@/stores/postingStore';

interface SlideshowOptionsProps {
    mediaItems: MediaItem[];
    createAsSlideshow: boolean;
    slideDuration: number;
    transition: string;
    onToggleSlideshow: (enabled: boolean) => void;
    onDurationChange: (duration: number) => void;
    onTransitionPress: () => void;
}

export default function SlideshowOptions({
                                             mediaItems,
                                             createAsSlideshow,
                                             slideDuration,
                                             transition,
                                             onToggleSlideshow,
                                             onDurationChange,
                                             onTransitionPress
                                         }: SlideshowOptionsProps) {
    // Only show for multiple photos
    if (mediaItems.length <= 1 || !mediaItems.every(item => item.type === 'photo')) {
        return null;
    }

    const handleSlideDurationChange = (newDuration: number) => {
        if (newDuration >= 1 && newDuration <= 10) {
            onDurationChange(newDuration);
        }
    };

    return (
        <View style={styles.slideshowContainer}>
            <Text style={styles.sectionTitle}>Multiple Photos</Text>
            <View style={styles.slideshowOptions}>
                <TouchableOpacity
                    style={[
                        styles.slideshowOption,
                        !createAsSlideshow && styles.selectedSlideshowOption
                    ]}
                    onPress={() => onToggleSlideshow(false)}
                >
                    <ImageIcon size={24} color={!createAsSlideshow ? "#FF4D67" : "#777"} />
                    <Text
                        style={[
                            styles.slideshowOptionText,
                            !createAsSlideshow && styles.selectedSlideshowOptionText
                        ]}
                    >
                        Individual Posts
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.slideshowOption,
                        createAsSlideshow && styles.selectedSlideshowOption
                    ]}
                    onPress={() => onToggleSlideshow(true)}
                >
                    <Film size={24} color={createAsSlideshow ? "#FF4D67" : "#777"} />
                    <Text
                        style={[
                            styles.slideshowOptionText,
                            createAsSlideshow && styles.selectedSlideshowOptionText
                        ]}
                    >
                        Create Slideshow
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Slideshow settings */}
            {createAsSlideshow && (
                <View style={styles.slideshowSettings}>
                    <TouchableOpacity
                        style={styles.slideshowSetting}
                        onPress={onTransitionPress}
                    >
                        <Text style={styles.slideshowSettingLabel}>Transition</Text>
                        <View style={styles.slideshowSettingValue}>
                            <Text style={styles.slideshowSettingValueText}>
                                {transition.charAt(0).toUpperCase() + transition.slice(1)}
                            </Text>
                            <ChevronRight size={16} color="#777" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.slideshowSetting}>
                        <Text style={styles.slideshowSettingLabel}>Duration per slide</Text>
                        <View style={styles.durationSelector}>
                            <TouchableOpacity
                                style={styles.durationButton}
                                onPress={() => handleSlideDurationChange(slideDuration - 1)}
                                disabled={slideDuration <= 1}
                            >
                                <Text style={[
                                    styles.durationButtonText,
                                    slideDuration <= 1 && styles.disabledText
                                ]}>-</Text>
                            </TouchableOpacity>

                            <Text style={styles.durationValue}>{slideDuration}s</Text>

                            <TouchableOpacity
                                style={styles.durationButton}
                                onPress={() => handleSlideDurationChange(slideDuration + 1)}
                                disabled={slideDuration >= 10}
                            >
                                <Text style={[
                                    styles.durationButtonText,
                                    slideDuration >= 10 && styles.disabledText
                                ]}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    slideshowContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 15,
        marginBottom: 16,
    },
    slideshowOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    slideshowOption: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        marginHorizontal: 5,
    },
    selectedSlideshowOption: {
        borderColor: '#FF4D67',
        backgroundColor: 'rgba(255, 77, 103, 0.1)',
    },
    slideshowOptionText: {
        color: '#999',
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    selectedSlideshowOptionText: {
        color: '#FF4D67',
        fontWeight: '500',
    },
    slideshowSettings: {
        marginTop: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        overflow: 'hidden',
    },
    slideshowSetting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    slideshowSettingLabel: {
        color: '#fff',
        fontSize: 15,
    },
    slideshowSettingValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    slideshowSettingValueText: {
        color: '#FF4D67',
        marginRight: 5,
    },
    durationSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledText: {
        opacity: 0.5,
    },
    durationValue: {
        color: '#FF4D67',
        marginHorizontal: 10,
        minWidth: 30,
        textAlign: 'center',
    },
});