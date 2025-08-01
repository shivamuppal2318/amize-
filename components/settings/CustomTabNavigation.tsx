import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface Tab {
    key: string;
    label: string;
}

interface CustomTabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

export function CustomTabNavigation({ tabs, activeTab, onTabChange }: CustomTabNavigationProps) {
    return (
        <View style={styles.container}>
            <View style={styles.tabsContainer}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            { width: screenWidth / tabs.length }
                        ]}
                        onPress={() => onTabChange(tab.key)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: activeTab === tab.key }}
                    >
                        <Text
                            style={[
                                styles.tabLabel,
                                activeTab === tab.key ? styles.activeTabLabel : styles.inactiveTabLabel
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Indicator line container */}
            <View style={styles.indicatorContainer}>
                {tabs.map(tab => (
                    <View
                        key={tab.key}
                        style={[
                            styles.indicator,
                            activeTab === tab.key ? styles.activeIndicator : styles.inactiveIndicator,
                            { width: screenWidth / tabs.length }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#1a1a2e',
    },
    tabsContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    tabButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabLabel: {
        color: '#FF5A5F',
    },
    inactiveTabLabel: {
        color: '#9CA3AF',
    },
    indicatorContainer: {
        flexDirection: 'row',
        width: '100%',
    },
    indicator: {
        height: 3,
    },
    activeIndicator: {
        backgroundColor: '#FF5A5F',
    },
    inactiveIndicator: {
        backgroundColor: '#333333',
    },
});