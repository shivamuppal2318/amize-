import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Grid3X3, Heart, BookmarkPlus, Lock } from 'lucide-react-native';

type TabType = 'videos' | 'likes' | 'saved' | 'private';

interface ProfileTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    isOwnProfile: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
                                                            activeTab,
                                                            onTabChange,
                                                            isOwnProfile,
                                                        }) => {
    const tabs = [
        {
            id: 'videos' as TabType,
            label: 'Videos',
            icon: (isActive: boolean) => (
                <Grid3X3 size={20} color={isActive ? '#FF4D67' : '#666666'} />
            ),
            visible: true,
        },
        {
            id: 'likes' as TabType,
            label: 'Likes',
            icon: (isActive: boolean) => (
                <Heart size={20} color={isActive ? '#FF4D67' : '#666666'} />
            ),
            visible: true,
        },
        {
            id: 'saved' as TabType,
            label: 'Saved',
            icon: (isActive: boolean) => (
                <BookmarkPlus size={20} color={isActive ? '#FF4D67' : '#666666'} />
            ),
            visible: isOwnProfile,
        },
        {
            id: 'private' as TabType,
            label: 'Private',
            icon: (isActive: boolean) => (
                <Lock size={20} color={isActive ? '#FF4D67' : '#666666'} />
            ),
            visible: isOwnProfile,
        },
    ];

    const visibleTabs = tabs.filter(tab => tab.visible);

    return (
        <View style={styles.container}>
            {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            isActive && styles.activeTab,
                            { flex: 1 / visibleTabs.length }
                        ]}
                        onPress={() => onTabChange(tab.id)}
                        activeOpacity={0.7}
                    >
                        {tab.icon(isActive)}
                        <Text style={[
                            styles.tabLabel,
                            isActive && styles.activeTabLabel
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        gap: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#FF4D67',
    },
    tabLabel: {
        color: '#666666',
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabLabel: {
        color: '#FF4D67',
        fontWeight: '600',
    },
});