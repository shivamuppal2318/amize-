import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { X } from 'lucide-react-native';

interface SlideshowTransitionPickerProps {
    visible: boolean;
    currentTransition: string;
    onClose: () => void;
    onSelect: (transition: string) => void;
}

// Slideshow transition options
const SLIDESHOW_TRANSITIONS = [
    { id: 'fade', label: 'Fade' },
    { id: 'slide', label: 'Slide' },
    { id: 'zoom', label: 'Zoom' }
];

export default function SlideshowTransitionPicker({
                                                      visible,
                                                      currentTransition,
                                                      onClose,
                                                      onSelect
                                                  }: SlideshowTransitionPickerProps) {
    if (!visible) return null;

    return (
        <View style={styles.visibilityOverlay}>
            <View style={styles.visibilityContainer}>
                <View style={styles.visibilityHeader}>
                    <Text style={styles.visibilityTitle}>Transition Effect</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {SLIDESHOW_TRANSITIONS.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={styles.visibilityOption}
                        onPress={() => {
                            onSelect(option.id);
                            onClose();
                        }}
                    >
                        <View style={styles.visibilityOptionContent}>
                            <Text style={styles.visibilityOptionLabel}>{option.label}</Text>
                        </View>
                        <View style={styles.visibilityOptionIndicator}>
                            {currentTransition === option.id && (
                                <View style={styles.visibilitySelectedDot} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    visibilityOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    visibilityContainer: {
        width: '90%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
    },
    visibilityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    visibilityTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    visibilityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },
    visibilityOptionContent: {
        flex: 1,
    },
    visibilityOptionLabel: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 4,
    },
    visibilityOptionIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#666',
        justifyContent: 'center',
        alignItems: 'center',
    },
    visibilitySelectedDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF4D67',
    },
});