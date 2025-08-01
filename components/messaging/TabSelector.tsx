import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, UI, TABS } from './constants';

interface TabSelectorProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, setActiveTab }) => {
    const tabs = [TABS.CHATS, TABS.GROUPS];

    return (
        <View style={styles.tabContainer}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tabButton, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: UI.SPACING.LG,
        marginBottom: UI.SPACING.MD,
    },
    tabButton: {
        paddingVertical: UI.SPACING.SM,
        paddingHorizontal: UI.SPACING.LG,
        width: '50%',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: COLORS.darkGray,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textGray,
        fontSize: 16,
    },
    activeTabText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
});

export default TabSelector;