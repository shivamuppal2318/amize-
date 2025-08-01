import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Globe, Lock, Users, X } from 'lucide-react-native';

interface VisibilityPickerProps {
    visible: boolean;
    currentVisibility: string;
    onClose: () => void;
    onSelect: (visibility: string) => void;
}

// Visibility options
const VISIBILITY_OPTIONS = [
    {
        id: 'public',
        label: 'Public',
        description: 'Everyone can see this post',
        icon: <Globe size={20} color="#5A8CFF" />
    },
    {
        id: 'followers',
        label: 'Followers',
        description: 'Only your followers can see this post',
        icon: <Users size={20} color="#FFB800" />
    },
    {
        id: 'private',
        label: 'Private',
        description: 'Only you can see this post',
        icon: <Lock size={20} color="#FF4D67" />
    }
];

export default function VisibilityPicker({
                                             visible,
                                             currentVisibility,
                                             onClose,
                                             onSelect
                                         }: VisibilityPickerProps) {
    if (!visible) return null;

    return (
        <View style={styles.visibilityOverlay}>
            <View style={styles.visibilityContainer}>
                <View style={styles.visibilityHeader}>
                    <Text style={styles.visibilityTitle}>Post Privacy</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <X size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {VISIBILITY_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={styles.visibilityOption}
                        onPress={() => {
                            onSelect(option.id);
                            onClose();
                        }}
                    >
                        <View style={styles.visibilityOptionIcon}>
                            {option.icon}
                        </View>
                        <View style={styles.visibilityOptionContent}>
                            <Text style={styles.visibilityOptionLabel}>{option.label}</Text>
                            <Text style={styles.visibilityOptionDescription}>{option.description}</Text>
                        </View>
                        <View style={styles.visibilityOptionIndicator}>
                            {currentVisibility === option.id && (
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
    visibilityOptionIcon: {
        marginRight: 12,
    },
    visibilityOptionContent: {
        flex: 1,
    },
    visibilityOptionLabel: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 4,
    },
    visibilityOptionDescription: {
        color: '#999',
        fontSize: 12,
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