import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { TabNavigationProps } from '@/types/settings';

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            className="border-b border-gray-800"
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => onTabChange(tab.key)}
                        className="py-3 px-4"
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                    >
                        <Text className={`font-medium ${isActive ? 'text-[#FF5A5F]' : 'text-gray-400'}`}>
                            {tab.label}
                        </Text>
                        {isActive && (
                            <View className="h-0.5 bg-[#FF5A5F] absolute bottom-0 left-0 right-0" />
                        )}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}