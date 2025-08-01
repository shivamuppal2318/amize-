import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface CrossPostSettings {
    whatsapp: boolean;
    facebook: boolean;
    instagram: boolean;
    twitter: boolean;
}

interface SocialSharingProps {
    crossPostSettings: CrossPostSettings;
    onTogglePlatform: (platform: keyof CrossPostSettings) => void;
}

// Social platforms for sharing
const SOCIAL_PLATFORMS = [
    { id: 'whatsapp', icon: '📱', name: 'WhatsApp' },
    { id: 'facebook', icon: 'f', name: 'Facebook' },
    { id: 'instagram', icon: '📷', name: 'Instagram' },
    { id: 'twitter', icon: '🐦', name: 'Twitter' },
];

export default function SocialSharing({
                                          crossPostSettings,
                                          onTogglePlatform
                                      }: SocialSharingProps) {

    // Render social platform button
    const renderSocialPlatform = (platform: typeof SOCIAL_PLATFORMS[0]) => {
        const isSelected = crossPostSettings[platform.id as keyof CrossPostSettings];

        return (
            <TouchableOpacity
                key={platform.id}
                style={[
                    styles.socialPlatform,
                    isSelected && styles.selectedSocialPlatform
                ]}
                onPress={() => onTogglePlatform(platform.id as keyof CrossPostSettings)}
            >
                <Text style={styles.socialPlatformIcon}>{platform.icon}</Text>
                <Text style={styles.socialPlatformName}>{platform.name}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.shareSection}>
            <Text style={styles.sectionTitle}>Automatically Share to:</Text>
            <View style={styles.socialPlatforms}>
                {SOCIAL_PLATFORMS.map(platform => renderSocialPlatform(platform))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shareSection: {
        padding: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 15,
        marginBottom: 16,
    },
    socialPlatforms: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    socialPlatform: {
        marginRight: 16,
        marginBottom: 16,
        width: 64,
        alignItems: 'center',
        opacity: 0.5,
    },
    selectedSocialPlatform: {
        opacity: 1,
    },
    socialPlatformIcon: {
        fontSize: 24,
        backgroundColor: '#333',
        width: 50,
        height: 50,
        borderRadius: 25,
        textAlign: 'center',
        lineHeight: 50,
        overflow: 'hidden',
    },
    socialPlatformName: {
        color: '#999',
        fontSize: 12,
        marginTop: 6,
        textAlign: 'center',
    },
});